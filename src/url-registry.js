/**
 * Maps user defined URLs (like mycss.css) to URLs that will load correctly
 * (like blob://some-long-identifier).
 */

(function() {

function UrlRegistry($q) {
  this.q_ = $q;
}

UrlRegistry.prototype = {
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
