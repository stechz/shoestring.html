/**
 * Maps user defined URLs (like mycss.css) to URLs that will load properly in
 * the browser (like blob://some-long-identifier).
 */

(function() {

/**
 * Keeps track of our sandboxed filesystem that serves up images, CSS, HTML,
 * and even javascript. This always stores files in localStorage, but it's
 * possible to register a proxy storage mechanism that saves files to a more
 * permanent place.
 *
 * For more information about proxy storage, see UrlProvider.
 */
function UrlRegistry($q, storageImpl) {
  this.q_ = $q;
  this.storageImpl_ = storageImpl;
  this.localDict_ = {};
}

UrlRegistry.prototype = {
  /** Returns true iff we should request something using aux storage. */
  useAux: function(url) {
    var inLocalStorage = loadFromStorage(url) !== undefined;
    var auxHasBeenFetchedOnce = url in this.localDict_;
    if (this.storageImpl_) {
      this.localDict_[url] = true;
    }
    return this.storageImpl_ && (!inLocalStorage || !auxHasBeenFetchedOnce);
  },

  /**
   * Registers a new sandbox URL.
   * @param resource Can be a File, a canvas element, or a string.
   */
  register: function(url, resource) {
    var promise;

    if (this.storageImpl_) {
      this.localDict_[url] = true;
      this.storageImpl_.register(url, resource);
    }

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
      promise = this.q_.when(getBlobForText(url, resource));
    } else {
      throw new Error('unrecognized object passed to register');
    }

    var defer = this.q_.defer();
    promise.then(function(blob) {
      getURLFromFile(blob, function(url) {
        defer.resolve(url);
      });
    });

    return defer.promise;
  },

  /** Fetches contents for a sandboxed URL. */
  contents: function(url) {
    return this.useAux(url) ?
        this.storageImpl_.contents(url) : this.q_.when(loadFromStorage(url));
  },

  /** Finds the canonical blob URL that stores a sandboxed resource.  */
  map: function(url) {
    // TODO: map should probably only change the URL when something becomes
    // dirty.

    if (this.useAux(url)) {
      return this.storageImpl_.map(url);
    }

    var defer = this.q_.defer();
    var textBlob = getBlobForText(url, loadFromStorage(url));
    getURLFromFile(textBlob, function(url) { defer.resolve(url); });
    return defer.promise;
  }
};


/** Configures UrlRegistry for alternative storage mechanisms. */
function UrlRegistryProvider() {
  this.storageImpl = null;
}

UrlRegistryProvider.prototype = {
  /**
   * Register an auxiliary storage mechanism for sandboxed filesystem. Examples
   * could be: google drive storage, dropbox, or EC2.
   *
   * Once registered, there are two different methods that we store files.
   * Which one is canonical?
   *   1. if page has freshly loaded, fetch from aux.
   *   2. after fresh page load, localStorage becomes canonical storage. Aux
   *      will be notified if files change (like if the user is editing a page).
   */
  registerStorage: function(storageImpl) {
    this.storageImpl = storageImpl;
  },

  /** Instantiate UrlRegistry. */
  $get: function($injector) {
    return $injector.instantiate(UrlRegistry, {storageImpl: this.storageImpl});
  }
};

var module = angular.module('shoestring.urlRegistry', []);
module.provider('urlRegistry', UrlRegistryProvider);

})();
