describe('url registry', function() {
  var q;
  var urlRegistry;
  var auxSpy;

  beforeEach(function() {
    module('shoestring.urlRegistry');

    module(function(urlRegistryProvider) {
      auxSpy = jasmine.createSpyObj('storage', ['contents', 'map', 'register']);
      urlRegistryProvider.registerStorage(function() { return auxSpy });
    });

    inject(function(_urlRegistry_, $q) {
      urlRegistry = _urlRegistry_;
      q = $q;

      auxSpy.contents.and.returnValue($q.when('some contents'));
      auxSpy.map.and.returnValue($q.when('mappedurl://'));
    });
  });


  it('should call aux storage if nothing in local storage', function() {
    var promise = urlRegistry.contents('urlregistryspec/test.txt');
    expect(auxSpy.contents).toHaveBeenCalledWith('urlregistryspec/test.txt');

    var promise = urlRegistry.map('urlregistryspec/test.txt');
    expect(auxSpy.map).toHaveBeenCalledWith('urlregistryspec/test.txt');
  });

  it('should call aux storage if file has not changed', function() {
    spyOn(window, 'loadFromStorage');
    loadFromStorage.and.returnValue(1);

    var promise = urlRegistry.contents('urlregistryspec/test.txt');
    expect(auxSpy.contents).toHaveBeenCalledWith('urlregistryspec/test.txt');

    var promise = urlRegistry.map('urlregistryspec/test.txt');
    expect(auxSpy.map).toHaveBeenCalledWith('urlregistryspec/test.txt');
  });

  it('should call local storage if file has changed', function() {
    urlRegistry.register('urlregistryspec/test.txt', 'some stuff');

    var promise = urlRegistry.contents('urlregistryspec/test.txt');
    expect(auxSpy.contents).not.toHaveBeenCalledWith(
        'urlregistryspec/test.txt');
  });

  it('should inform aux storage when file changes', function() {
    urlRegistry.register('urlregistryspec/test.txt', '12345');
    expect(auxSpy.register).toHaveBeenCalledWith(
        'urlregistryspec/test.txt', '12345');
  });
});
