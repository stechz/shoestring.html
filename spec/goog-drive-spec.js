describe('goog drive', function() {
  var q;
  var urlRegistry;
  var googDrive;
  var oldGapi = window.gapi;

  beforeEach(function() {
    module('shoestring.googDrive');

    spyOn(document, 'write');

    var gapiAuthSpy = jasmine.createSpyObj('auth', ['authorize']);
    var gapiClientSpy = jasmine.createSpyObj('client', ['request', 'load']);

    oldGapi = window.gapi;
    window.gapi = {auth: gapiAuthSpy, client: gapiClientSpy};
    // TODO: make gapi.auth.authorize work

    inject(function(_urlRegistry_, $q) {
      q = $q;
      urlRegistry = _urlRegistry_;
      googDrive = urlRegistry.storageImpl_;
    });
  });

  afterEach(function() {
    gapi = oldGapi;
  });

  it('registering should try to save a file', function() {
    urlRegistry.register('urlregistryspec/test.txt', '12345');
  });
});
