(function() {

var module = angular.module('shoestring.upload', []);

module.directive('upload', function() {
  var link = function(scope, element, attrs) {
    var handleFileSelect = function(evt) {
      var files = evt.target.files;
      var f = files[0];
      if (!f) {
        return;
      }

      // Only process image files.
      if (!f.type.match('image.*')) {
        return;
      }

      saveToLocalStorage(scope.file, f);
      getURLFromFile(f, function(url) {
        scope.$apply(function() { scope.uploaded = url; });
      });
    };

    var input = element[0].querySelector('input');
    input.addEventListener('change', handleFileSelect, false);

    if (loadFromLocalStorage(scope.file)) {
      getURLFromLocalStorage(scope.file, function(url) {
        scope.$apply(function() { scope.uploaded = url; });
      });
    }
  };

  return {
    replace: true,
    restrict: 'EA',
    templateUrl: 'upload.html',
    link: link,
    scope: {file: '@'}
  };
});

})();
