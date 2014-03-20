describe('goog drive', function() {
  var oldGapi;
  var q;
  var urlRegistry;
  var executeMock;

  var testLocalStorageKeys = function() {
    var result = [];
    for (var key in localStorage) {
      if (!key.indexOf(location.pathname)) {
        result.push(key);
      }
    }
    return result;
  };

  var cleanupLocalStorageKeys = function() {
    var testKeys = testLocalStorageKeys();
    for (var i = 0; i < testKeys.length; i++) {
      delete localStorage[testKeys[i]];
    }
  };

  beforeEach(function() {
    cleanupLocalStorageKeys();

    module('shoestring.googDrive');

    spyOn(document, 'write');

    var gapiAuthSpy = jasmine.createSpyObj('auth', ['authorize']);
    var gapiClientSpy = jasmine.createSpyObj('client', ['request', 'load']);
    var gapiClientRequestResult = jasmine.createSpyObj('request', ['execute']);
    gapiClientSpy.request.and.returnValue(gapiClientRequestResult);

    oldGapi = window.gapi;
    window.gapi = {auth: gapiAuthSpy, client: gapiClientSpy};

    // Authorization and client load successful! :)
    gapi.auth.authorize.and.callFake(function(obj, callback) { callback({}); });
    gapi.client.load.and.callFake(function(a, b, callback) { callback(); });

    inject(function(_urlRegistry_, $q) {
      q = $q;
      urlRegistry = _urlRegistry_;
      executeMock = gapiClientRequestResult.execute;
    });
  });

  afterEach(function() {
    gapi = oldGapi;
    cleanupLocalStorageKeys();
  });

  it('registering without root should try to save a folder and a file',
      function(done) {
    urlRegistry.register('test.txt', 'contents of this thing');

    // Check request object. We expect this to be the root folder.
    var folderRequest = gapi.client.request.calls.mostRecent().args[0];
    expect(folderRequest.method).toBe('POST');
    expect(folderRequest.body).toContain('application/vnd.google-apps.folder');
    expect(folderRequest.body).not.toContain('parents');

    // Run the callback 
    executeMock.calls.mostRecent().args[0]({id: '12345'});
    expect(localStorage[location.pathname + '.gapi']).toBe('12345');

    // Check request object for the file we were trying to save.
    var handle = setInterval(function() {
      if (gapi.client.request.calls.count() != 2) {
        return;
      }

      clearInterval(handle);

      var fileRequest = gapi.client.request.calls.mostRecent().args[0];
      expect(fileRequest.body).toContain('parents');
      expect(fileRequest.body).toContain('12345');
      executeMock.calls.mostRecent().args[0]({id: '56789'});

      // Only two keys should have been saved.
      var testKeys = testLocalStorageKeys();
      expect(testKeys.length).toBe(3);
      expect(localStorage[location.pathname + '.gapi:test.txt']).toBe('56789');
      expect(localStorage[location.pathname + ':test.txt']).toBe(
          'contents of this thing');

      done();
    }, 50);
  });

  it('registering with a root should try to just save a file', function() {
  });
});
