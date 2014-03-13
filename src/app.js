(function() {

function lastPartOfUrl() {
  return location.pathname.replace(/.*\//, '');
}

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
  this.code = '';

  var iframe = angular.element(
      document.querySelector('iframe').contentDocument);
  var body = angular.element(document.body);
  var handleIframe = iframe.on('keypress', this.secretCode.bind(this));
  var handleBody = body.on('keypress', this.secretCode.bind(this));

  $scope.$on('$destroy', function() {
    iframe.off('keypress', handleIframe);
    body.off('keypress', handleBody);
  });
};

NoEditController.prototype.secretCode = function(ev) {
  this.code = this.code + String.fromCharCode(ev.keyCode || ev.charCode);

  if (this.code == "editme") {
    location.href = '#/' + lastPartOfUrl();
  }

  if ('editme'.substring(0, this.code.length) != this.code) {
    this.code = '';
  }
};

var AppController = function($scope, $route, $rootScope) {
  this.filename = lastPartOfUrl();
  this.editFilename = $route.current.params.filename;
  this.editMode = guessMimeType(this.editFilename);
  this.upload = !!this.editMode.match('image');
  this.scope = $scope;
  this.viewCtrl = $scope.viewCtrl;
  this.gapiId = getGapiRoot();
  this.gapi = this.gapiId ? 'shoestring.html' : null;

  $scope.$watch('changeFilename==false', (function() {
    location.href = '#/' + this.editFilename;
  }).bind(this));

  var handle = angular.element(document.body).on(
      'keydown', this.keypress.bind(this));

  $scope.$on('$destroy', function() {
    angular.element(document.body).off('keydown', handle);
  });
};

AppController.prototype.gapiDialog = function(event) {
  if (this.gapi) {
    return;
  }

  gapiInit(function() {
    insertFile('shoestring.html/', null, null, null, function(file) {
      this.scope.$apply(function() {
        this.gapi = 'shoestring.html';
        this.gapiId = file.id;
        setGapiRoot(file.id);

        var files = listFiles();
        for (var i = 0; i < files.length; i++) {
          saveToStorage(files[i], loadFromStorage(files[i]));
        }
      }.bind(this));
    }.bind(this));
  }.bind(this));
};

AppController.prototype.keypress = function(event) {
  if (event.ctrlKey &&
      String.fromCharCode(event.keyCode).toLowerCase() == 'r') {
    this.refresh();
  }
};

AppController.prototype.refresh = function() {
  this.scope.viewCtrl.setText(loadFromStorage(lastPartOfUrl()));
};

AppController.prototype.setText = function(text) {
  saveToStorage(this.editFilename, text);
};

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

app.run(function($rootScope) {
  if (loadFromStorage(lastPartOfUrl()) === undefined &&
      loadFromStorage('default.css') === undefined) {
    saveToStorage(lastPartOfUrl(), angular.element(
        document.getElementById('default.html')).html());
    saveToStorage('default.css', angular.element(
        document.getElementById('default.css')).html());
  }

  var unlisten = $rootScope.$watch('viewCtrl', function(viewCtrl) {
    if (viewCtrl) {
      $rootScope.viewCtrl.setText(loadFromStorage(lastPartOfUrl()));
      unlisten();
    }
  });
});

})();
