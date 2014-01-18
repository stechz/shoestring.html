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
  if (loadFromStorage(url)) {
    this.urls[url] = null;
    getURLFromLocalStorage(url, this.onUrlReceived.bind(this, url));
  }
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

  var url = URL.createObjectURL(new Blob([text]));
  this.cssElement.setAttribute('href', url);

  var callback = this.callback;
  if (callback) {
    callback();
  }
};

var Controller = function(element) {
  this.element = element;
  this.document = element.contentDocument || element.contentWindow.document;

  // Firefox hack. Otherwise iframe window stays on about:blank.
  this.element.contentWindow.location.href = '#test';
  this.document.open();
  this.document.write('');
  this.document.close();
};

Controller.prototype.setText = function(text) {
  var iframe = document.createElement('iframe');
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  var doc = iframe.contentDocument;
  doc.open();
  doc.write(text);

  var callbacks = 1;
  var trackCallback = function() {
    if (!--callbacks) {
      finalCallback();
    }
  };

  var finalCallback = function() {
    var text = doc.documentElement.outerHTML;
    document.body.removeChild(iframe);

    this.document.open();
    this.document.write('<!doctype html>' + text);
    this.document.close();
  }.bind(this);

  var js = doc.querySelectorAll('script[src]');
  for (var i = 0; i < js.length; i++) {
    var src = js[i].getAttribute('src');
    if (loadFromStorage(src)) {
      // Firefox does not allow blob URIs to be read. So we have to inject the
      // source code into the iframe.
      var url = URL.createObjectURL(new Blob([loadFromStorage(src)],
                      {type: 'text/javascript'}));
      js[i].setAttribute('src', url);
    }
  }

  var css = doc.querySelectorAll('link[href][rel=stylesheet]');
  for (var i = 0; i < css.length; i++) {
    var href = css[i].getAttribute('href');
    if (loadFromStorage(href)) {
      css[i].removeAttribute('href');
      callbacks++;
      new CssUrlReplacer(loadFromStorage(href), css[i], trackCallback);
    }
  }

  var img = doc.querySelectorAll('img[src]');
  for (var i = 0; i < img.length; i++) {
    var src = img[i].getAttribute('src');
    if (loadFromStorage(src)) {
      callbacks++;
      img[i].removeAttribute('src');
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
    angular.element(doc.head).append(
        '<script type="text/javascript" src="angular.js"></script>');
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
