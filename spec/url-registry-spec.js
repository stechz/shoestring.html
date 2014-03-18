describe('url registry', function() {
  var urlRegistry;
  var listenerSpy;

  beforeEach(function() {
    module('urlRegistry');

    listenerSpy = jasmine.createSpyObj('storage', ['contents', 'map']);
    module(function(urlProvider) {
      urlProvider.registerStorage(listenerSpy, U);
    });
  });

  it('should call storage if nothing in local storage', function() {
  });

  it('should not call storage if something is in local storage', function() {
  });

  it('should inform storage when file changes', function() {
  });
});
