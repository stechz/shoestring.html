/**
 * Maps user defined URLs (like mycss.css) to URLs that will load properly in
 * the browser (like blob://some-long-identifier).
 */

(function() {

function UrlRegistry($q) {
  this.q_ = $q;
}

UrlRegistry.prototype = {
  /** Registers a new URL, given a resource like an img, canvas, text, etc. */
  register: function(url, resource) {
    var promise;
    if (resource instanceof File) {
      saveToLocalStorage(url, resource);
      promise = this.q_.when(resource);
    } else if (resource instanceof HTMLCanvasElement) {
      var defer = this.q_.defer();
      promise = defer.promise;
      resource.toBlob(function(blob) {
        saveToLocalStorage(url, blob);
        defer.resolve(blob);
      });
    } else if (typeof resource == 'string') {
      saveToStorage(url, resource);
      promise = this.q_.when(resource);
    }

    var defer = this.q_.defer();
    promise.then(function(blob) {
      getURLFromFile(blob, function(url) {
        defer.resolve(url);
      });
    });
    return defer.promise;
  },

  /** Returns true iff this URL is mapped. */
  has: function(url) {
    return !!loadFromStorage(url);
  },

  contents: function(url) {
    return this.q_.when(loadFromStorage(url));
  },

  map: function(url) {
    var defer = this.q_.defer();
    getURLFromLocalStorage(url, function(url) { defer.resolve(url); });
    return defer.promise;
  }
};

var module = angular.module('shoestring.urlRegistry', []);
module.service('urlRegistry', UrlRegistry);

})();
