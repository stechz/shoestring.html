(function() {

var Controller = function(element, urlRegistry, $q) {
  this.urlRegistry_ = urlRegistry;
  this.q_ = $q;

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

  var promises = [];

  var js = doc.querySelectorAll('script[src]');
  for (var i = 0; i < js.length; i++) {
    var src = js[i].getAttribute('src');
    promises.push(this.urlRegistry_.map(src).then(function(js, url) {
      if (url) {
        js.setAttribute('src', url);
      }
    }.bind(this, js[i])));
  }

  var css = doc.querySelectorAll('link[href][rel=stylesheet]');
  for (var i = 0; i < css.length; i++) {
    var href = css[i].getAttribute('href');
    css[i].removeAttribute('href');

    var urlPromise = this.urlRegistry_.contents(href).then(
        function(cssElement, cssText) {
      if (!cssText) {
        return;
      }

      // Use replace to find all the URLs in the css text.
      var urlPromises = {};
      cssText.replace(/url\((.*)\)/g, function(all, url) {
        urlPromises[url] = this.urlRegistry_.map(url);
      }.bind(this));

      return this.q_.all(urlPromises).then(function(urls) {
        // urls is a map from old URLs to new URLs.
        var text = cssText.replace(/url\((.*)\)/g,
            function(all, url) { return 'url(' + (urls[url] || url) + ')'; });
        var url = URL.createObjectURL(new Blob([text]));
        cssElement.setAttribute('href', url);
      });
    }.bind(this, css[i]));

    promises.push(urlPromise);
  }

  var img = doc.querySelectorAll('img[src]');
  for (var i = 0; i < img.length; i++) {
    var src = img[i].getAttribute('src');
    img[i].removeAttribute('src');

    var urlPromise = this.urlRegistry_.map(src).then(function(img, url) {
      if (url) {
        img.setAttribute('src', url);
      }
    }.bind(this, img[i]));

    promises.push(urlPromise);
  }

  var ngapp = doc.querySelector('[ng-app]');
  if (ngapp) {
    angular.element(doc.head).append(
        '<script type="text/javascript" src="lib/angular.js"></script>');
  }

  this.q_.all(promises).then(function() {
    var text = doc.documentElement.outerHTML;
    document.body.removeChild(iframe);

    this.document.open();
    this.document.write('<!doctype html>' + text);
    this.document.close();
  }.bind(this));
};

var module = angular.module('shoestring.view', []);

module.directive('view', function($parse, $timeout, urlRegistry, $injector) {
  var link = function(scope, element) {
    // The view attribute determines what the name of the controller is going
    // to be on the scope, so here we instantiate the controller ourselves
    // instead of using controllerAs.
    var controller = $injector.instantiate(Controller, {element: element[0]})
    $parse(scope.view).assign(scope.$parent, controller);
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
