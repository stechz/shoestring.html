(function() {

var module = angular.module('shoestring.tab', []);

module.directive('tab', function() {
  var link = function(scope, element, attrs, controller) {
  };

  return {
    scope: {value: '@'},
    replace: true,
    restrict: 'EA',
    template: '<div class="tab">{{value}}</div>',
    link: link
  };
});

})();
