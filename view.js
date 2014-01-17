(function() {

var CssUrlReplacer = function(cssText, cssElement, callback) {
  this.cssText = cssText;
  this.cssElement = cssElement;
  this.urls = {};
  this.callback = callback;

  // Use replace to find all the URLs in the css text.
  this.cssText.replace(/url\((.*)\)/g,
      function(all, url) { this.getUrl(url); }.bind(this));

  if (!Object.keys(this.urls).length) {
    this.finish();
  }
};

CssUrlReplacer.prototype.getUrl = function(url) {
  this.urls[url] = null;
  getURLFromLocalStorage(url, this.onUrlReceived.bind(this, url));
};

CssUrlReplacer.prototype.onUrlReceived = function(origUrl, replaceUrl) {
  this.urls[origUrl] = replaceUrl;

  for (var url in this.urls) {
    if (!this.urls[url]) {
      return;
    }
  }

  // All URLs have been fetched.
  this.finish();
};

CssUrlReplacer.prototype.finish = function() {
  var urls = this.urls;
  var text = this.cssText.replace(/url\((.*)\)/g,
      function(all, url) { return 'url(' + urls[url] + ')'; });

  var url = URL.createObjectURL(new Blob([text], {type: 'image'}));
  this.cssElement.setAttribute('href', url);

  var callback = this.callback;
  if (callback) {
    callback();
  }
};

var Controller = function(element) {
  this.element = element;
  this.document = element.contentDocument || element.contentWindow.document;
};

Controller.prototype.setText = function(text) {
  var doc = document.implementation.createHTMLDocument('');
  doc.open();
  doc.write(text);
  doc.close();

  var callbacks = 1;
  var trackCallback = function() {
    if (!--callbacks) {
      finalCallback();
    }
  };

  var finalCallback = function() {
    this.document.open();
    this.document.write(doc.documentElement.outerHTML);
    this.document.close();
  }.bind(this);

  var js = doc.querySelectorAll('script[src]');
  for (var i = 0; i < js.length; i++) {
    var src = js[i].getAttribute('src');
    if (src in localStorage) {
      var url = URL.createObjectURL(new Blob([localStorage[src]]));
      js[i].setAttribute('src', url);
    }
  }

  var css = doc.querySelectorAll('link[href][rel=stylesheet]');
  for (var i = 0; i < css.length; i++) {
    var href = css[i].getAttribute('href');
    if (href in localStorage) {
      callbacks++;
      new CssUrlReplacer(localStorage[href], css[i], trackCallback);
    }
  }

  var img = doc.querySelectorAll('img[src]');
  for (var i = 0; i < img.length; i++) {
    var src = img[i].getAttribute('src');
    if (src in localStorage) {
      callbacks++;
      getURLFromLocalStorage(src,
          (function(i) {
            return function(url) {
              img[i].setAttribute('src', url);
              trackCallback();
            }
           })(i));
    }
  }

  var ngapp = doc.querySelector('[ng-app]');
  if (ngapp) {
    angular.element(doc.head).append('<script src="angular.min.js"></script>');
  }
  trackCallback();
};

var module = angular.module('shoestring.view', []);

module.directive('view', function($parse, $timeout) {
  var link = function(scope, element) {
    $parse(scope.view).assign(scope.$parent, new Controller(element[0]));
  };

  return {
    scope: {
      view: '@'
    },
    replace: true,
    restrict: 'A',
    template: '<iframe></iframe>',
    link: link
  };
});

})();
