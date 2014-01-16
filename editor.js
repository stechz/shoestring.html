(function() {

var module = angular.module('shoestring.editor', []);

module.directive('editor', function($timeout) {
  var link = function(scope, element) {
    var textarea = element.children()[0];

    if (scope.localstorage && localStorage[scope.localstorage]) {
      textarea.value = localStorage[scope.localstorage];
    }

    var options = {mode: scope.mode, lineNumbers: true, autofocus: true};
    var editor = CodeMirror.fromTextArea(textarea, options);
    var promise = null;

    var runExpression = function() {
      scope.change({value: editor.getValue()});

      if (scope.localstorage) {
        localStorage[scope.localstorage] = editor.getValue();
      }

      promise = null;
    };

    var change = function() {
      if (!promise) {
        runExpression();
        promise = $timeout(runExpression, 400);
      }
    };

    var destroy = function() {
      if (editor.wrapper && editor.wrapper.parentNode) {
        editor.wrapper.parentNode.removeChild(editor.wrapper);
      }
    };

    scope.$on('$destroy', destroy);

    editor.on("change", change);

    change();
  };

  return {
    scope: {
      change: '&',
      mode: '@',
      localstorage: '@'
    },
    replace: true,
    restrict: 'E',
    template: '<div><textarea></textarea></div>',
    link: link
  };
});

})();
