describe('app', function() {
  var urlRegistry;

  beforeEach(module('shoestring.app', function() {
    urlRegistry = jasmine.createSpyObj('registry', ['has', 'register']);
  }));

  it('tests go here', function() {});
});
