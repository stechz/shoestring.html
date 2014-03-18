(function() {

var module = angular.module('shoestring.upload', []);

function CropController($scope, urlRegistry) {
  this.urlRegistry = urlRegistry;

  this.scope = $scope;
  this.size = 1;
  this.selection = {x: 0, y: 0, width: 0, height: 0};

  this.dragMove = this.dragMove.bind(this);
  this.dragEnd = this.dragEnd.bind(this);
  this.fileSelect = this.fileSelect.bind(this);
}

CropController.prototype = {
  setSelection: function() {
    var x1 = this.selection.x1;
    var x2 = this.selection.x2;
    var y1 = this.selection.y1;
    var y2 = this.selection.y2;

    if (x2 < x1) {
      x1 = x2;
      x2 = this.selection.x1;
    }
    if (y2 < y1) {
      y1 = y2;
      y2 = this.selection.y1;
    }

    this.selection.x = x1;
    this.selection.y = y1;
    this.selection.width = x2 - x1;
    this.selection.height = y2 - y1;
  },

  dragBegin: function(event) {
    this.selection.target = event.target;
    this.selection.x1 = event.offsetX;
    this.selection.y1 = event.offsetY;
    this.selection.x2 = event.offsetX;
    this.selection.y2 = event.offsetY;
    this.setSelection();
    event.preventDefault();
    angular.element(event.target).on('mousemove', this.dragMove);
    angular.element(window).on('mouseup', this.dragEnd);
  },

  dragMove: function(event) {
    this.selection.x2 = event.offsetX;
    this.selection.y2 = event.offsetY;
    this.setSelection();
    this.scope.$digest();
  },

  dragEnd: function(event) {
    angular.element(this.selection.target).off('mousemove');
    angular.element(window).off('mouseup');
  },

  getContainerWidth: function() {
    return this.element.getBoundingClientRect().width;
  },

  getImg: function() {
    return this.element.querySelector('img');
  },

  clearSelection: function() {
    this.selection.width = 0;
    this.selection.height = 0;
  },

  setSize: function(ratio) {
    var img = this.getImg();
    if (img) {

      this.size = ratio;

      angular.element(img).css({
        '-webkit-transform': 'scale(' + ratio + ')',
        '-webkit-transform-origin': '0 0',
        'transform': 'scale(' + ratio + ')',
        'transform-origin': '0 0'
      });

      angular.element(img.parentNode).css({
        'width': (img.width * ratio) + 'px',
        'overflow': 'hidden'
      });
    }
  },

  setElement: function(element) {
    this.element = element;

    var input = element.querySelector('input');
    input.addEventListener('change', this.fileSelect, false);

    if (loadFromStorage()) {
      var self = this;
      getURLFromLocalStorage(this.scope.file, function(url) {
        self.scope.$apply(function() { self.uploaded = url; });
      });
    }
  },

  zoom: function(percentage) {
    this.setSize(percentage);
  },

  fit: function() {
    var elementWidth = this.getContainerWidth();
    var img = this.getImg();
    if (img) {
      this.setSize(elementWidth / img.width);
    }
  },

  fileSelect: function(evt) {
    var files = evt.target.files;
    var f = files[0];
    if (!f) {
      return;
    }

    // Only process image files.
    if (!f.type.match('image.*')) {
      return;
    }

    this.register(f);
  },

  register: function(resource) {
    var promise = this.urlRegistry.register(this.scope.file, resource);
    promise.then(function(url) { this.uploaded = url; }.bind(this));
  },

  crop: function() {
    if (!this.originalImg) {
      this.originalUploaded = this.uploaded;
    }

    var canvas = document.createElement('canvas');
    canvas.width = this.selection.width;
    canvas.height = this.selection.height;

    var context = canvas.getContext('2d');
    context.drawImage(this.getImg(),
        this.selection.x / this.size,
        this.selection.y / this.size, canvas.width / this.size,
        canvas.height / this.size,
        0, 0, canvas.width, canvas.height);

    this.register(canvas);
    this.clearSelection();
    this.size = 1;
  },

  revert: function() {
    this.uploaded = this.originalUploaded;
  }
};

module.directive('upload', function() {
  var link = function(scope, element, attrs) {
    var controller = scope.ctrl;
    controller.setElement(element[0]);
  };

  return {
    controller: CropController,
    controllerAs: 'ctrl',
    replace: true,
    restrict: 'EA',
    templateUrl: 'upload.html',
    link: link,
    scope: {file: '@'}
  };
});

})();
