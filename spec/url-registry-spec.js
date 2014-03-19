describe('url registry', function() {
  var q;
  var urlRegistry;
  var auxSpy;

  beforeEach(function() {
    module('shoestring.urlRegistry');

    module(function(urlRegistryProvider) {
      auxSpy = jasmine.createSpyObj('storage', ['contents', 'map', 'register']);
      urlRegistryProvider.registerStorage(auxSpy);
    });

    inject(function(_urlRegistry_, $q) {
      urlRegistry = _urlRegistry_;
      q = $q;
    });
  });


  it('should call aux storage if nothing in local storage', function() {
    var promise = urlRegistry.contents('urlregistryspec/test.txt');
    expect(auxSpy.contents).toHaveBeenCalledWith('urlregistryspec/test.txt');

    var promise = urlRegistry.map('urlregistryspec/test.txt');
    expect(auxSpy.map).toHaveBeenCalledWith('urlregistryspec/test.txt');
  });

  it('should not call aux storage if file is in local storage', function() {
    spyOn(window, 'loadFromStorage');
    loadFromStorage.and.returnValue(1);

    // First time, it should fetch from aux. All subsequent fetches should be
    // from local storage.
    urlRegistry.contents('urlregistryspec/test.txt');
    auxSpy.contents.calls.reset();

    // Should be from local storage.
    var promise = urlRegistry.contents('urlregistryspec/test.txt');
    expect(auxSpy.contents).not.toHaveBeenCalled();

    // Should be from local storage.
    var promise = urlRegistry.map('urlregistryspec/test.txt');
    expect(auxSpy.map).not.toHaveBeenCalled();
  });

  it('should inform storage when file changes', function() {
    urlRegistry.register('urlregistryspec/test.txt', '12345');
    expect(auxSpy.register).toHaveBeenCalledWith(
        'urlregistryspec/test.txt', '12345');
  });
});
