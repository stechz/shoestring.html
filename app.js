(function() {

var app = angular.module('shoestring.app', [
  'shoestring.editor',
  'shoestring.view',
  'shoestring.tab',
  'shoestring.tokenstate',
  'shoestring.upload',

  'shoestring.syntaxwidget',
  'shoestring.syntax.css',
  'shoestring.syntax.script',
  'shoestring.syntax.cssurl',
  'shoestring.syntax.img',

  'ngRoute'
]);

var NoEditController = function($scope, $rootScope) {
  $rootScope.appKeypress = this.secretCode.bind(this);

  $scope.$watch('viewCtrl', function(viewCtrl) {
    viewCtrl.setText(localStorage['shoestring.main.html']);
  });

  this.code = '';

  var handle = angular.element(document.body).on(
      'keypress', this.secretCode.bind(this));

  $scope.$on('$destroy', function() {
    angular.element(document.body).off('keypress', handle);
  });
};

NoEditController.prototype.secretCode = function(ev) {
  this.code = this.code + String.fromCharCode(ev.keyCode);

  if (this.code == "editme") {
    location.href = '#/shoestring.main.html';
  }

  if ('editme'.substring(0, this.code.length) != this.code) {
    this.code = '';
  }
};

var AppController = function($scope, $route, $rootScope) {
  this.filename = 'shoestring.main.html';
  this.editFilename = $route.current.params.filename;
  if (this.editFilename.match(/html$/)) {
    this.editMode = 'text/html';
  } else if (this.editFilename.match(/js$/)) {
    this.editMode = 'text/javascript';
  } else if (this.editFilename.match(/css$/)) {
    this.editMode = 'text/css';
  } else if (this.editFilename.match(/png$|jpeg$|jpg$|gif$/)) {
    this.upload = true;
  }
  this.scope = $scope;
  this.viewCtrl = $scope.viewCtrl;
  this.refresh();

  $scope.$watch('changeFilename==false', (function() {
    location.href = '#/' + this.editFilename;
  }).bind(this));

  var handle = angular.element(document.body).on(
      'keydown', this.keypress.bind(this));

  $scope.$on('$destroy', function() {
    angular.element(document.body).off('keydown', handle);
  });
};

AppController.prototype.keypress = function(event) {
  if (event.ctrlKey &&
      String.fromCharCode(event.keyCode).toLowerCase() == 'r') {
    this.refresh();
  }
};

AppController.prototype.refresh = function() {
  this.scope.viewCtrl.setText(localStorage[this.filename]);
};

AppController.prototype.setText = function(text) {
  localStorage[this.editFilename] = text;
};

app.directive('template', function($templateCache) {
  var link = function(scope, element) {
    $templateCache.put(scope.name, element.html());
  };

  return {
    link: link,
    restrict: 'AE',
    scope: {name: '@'}
  };
});

app.config(function($routeProvider, $compileProvider) {
  $routeProvider.when('/:filename*', {
    controller: AppController,
    controllerAs: 'app',
    templateUrl: 'app.html'
  });
  $routeProvider.otherwise({
    controller: NoEditController,
    controllerAs: 'noedit',
    template: '<div>'
  });

   $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|blob|data):/);
});

})();
