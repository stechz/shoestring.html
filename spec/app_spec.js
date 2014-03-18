describe('app', function() {
  var urlRegistry;

  beforeEach(function() {
    module('shoestring.app');
    urlRegistry = jasmine.createSpyObj('registry', ['has', 'register']);
  });
});
