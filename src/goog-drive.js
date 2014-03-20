(function() {

var CLIENT_JS = 'https://apis.google.com/js/client.js?' +
                'onload=googDriveInitScript';

var CLIENT_ID;
if (location.host == 'localhost:8080') {
  CLIENT_ID = '705423460585-n34vpp4vue8mupcv84aliep0kiu7qfq2.apps.googleusercontent.com';
} else if (location.host == 'optimum-airfoil-463.appspot.com') {
  CLIENT_ID = '705423460585-3ne5aiq1fend9ch9qqnic6llr06gtp3g.apps.googleusercontent.com';
}

var SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

var callbacks = [];
var gapiRootCallbacks = [];
var gapiFileLocks = {};

var loaded = false;

if (document.readyState == 'loading' && location.protocol != 'file:') {
  document.write('<script src="' + CLIENT_JS + '"></script>');
}


/** Callback for after page is loaded when gapi is in use. */
function initScript() {
  if (callbacks.length) {
    checkAuth();
  }
}
window.googDriveInitScript = initScript;


/** Gets the gapi root ID. */
function gapiRoot(val) {
  if (val) {
    localStorage[location.pathname + '.gapi'] = val;
    return val;
  } else {
    return localStorage[location.pathname + '.gapi'];
  }
}

/** Callback is called after gapi is initialized. */
function gapiInit(callback) {
  if (loaded) {
    callback();
  } else {
    callbacks.push(callback);
    checkAuth();
  }
}


/** Check if the current user has authorized the application. */
function checkAuth() {
  if (window.gapi && window.gapi.auth) {
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES.join(' '), 'immediate': true},
        handleAuthResult);
  }
}


/** Called when authorization server replies. */
function handleAuthResult(authResult) {
  if (authResult) {
    gapi.client.load('drive', 'v2', function() {
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i]();
      }
      callbacks = [];
      loaded = true;
    });
  } else {
    // No access token could be retrieved, force the authorization flow.
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
        handleAuthResult);
  }
}


/** Helper function to either update a file or insert a file. */
function uploadFileWithMetadata(metadata, binaryData, id, callback) {
  var boundary = '-------314159265358979323846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  callback = callback || function(file) { console.log(file); };

  var base64Data = btoa(binaryData);
  var multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata);

  if (binaryData) {
      multipartRequestBody += delimiter +
          'Content-Type: ' + metadata.mimeType + '\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          btoa(binaryData);
  }

  multipartRequestBody += close_delim;

  var request = gapi.client.request({
      'path': '/upload/drive/v2/files/' + (id || ''),
      'method': id ? 'PUT' : 'POST',
      'params': {'uploadType': 'multipart'},
      'headers': {
        'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody});

  request.execute(callback);
}


/** Gets contents for goog drive file. */
function getFileContents(id, callback) {
  var request = gapi.client.request(
      {'path': '/drive/v2/files/' + id, 'method': 'GET'});
  request.execute(callback);
}


/** Updates file with new data. */
function updateFile(name, type, blob, id, callback) {
  var reader = new FileReader();
  reader.readAsBinaryString(blob);
  reader.onload = function(e) {
    var contentType = type || 'application/octet-stream';
    var metadata = {'title': name, 'mimeType': contentType};
    uploadFileWithMetadata(metadata, reader.result, id, callback);
  };
}


/** Insert new file. */
function insertFile(name, type, blob, parentFolderId, callback) {
  var foldersArray = name.split('/');
  var filename = foldersArray.pop();

  (function recurse(file) {
    var parents;
    if (file) {
      parents = [{'kind': 'drive#fileLink', 'id': file.id}];
    } else if (parentFolderId) {
      parents = [{'kind': 'drive#fileLink', 'id': parentFolderId}];
    }

    var nextFolder = foldersArray.shift();

    if (nextFolder) {
      var metadata = {
        'mimeType': 'application/vnd.google-apps.folder',
        'title': nextFolder
      };

      if (parents) {
        metadata['parents'] = parents;
      }

      uploadFileWithMetadata(metadata, null, null, recurse);
    } else if (filename) {
      var reader = new FileReader();
      reader.readAsBinaryString(blob);
      reader.onload = function(e) {
        var contentType = type || 'application/octet-stream';
        var metadata = {'title': filename, 'mimeType': contentType};

        if (parents) {
          metadata['parents'] = parents;
        }

        uploadFileWithMetadata(metadata, reader.result, null, callback);
      };
    } else {
      callback(file);
    }
  })();
}


function waitForGapiRoot(callback) {
  if (gapiRoot()) {
    // gapi root already exists, so we can call back immediately.
    callback();

  } else if (gapiRootCallbacks.length) {
    // First callback is already on the case.
    gapiRootCallbacks.push(callback);

  } else {
    gapiRootCallbacks.push(callback);

    // There is no gapi root and we're the first to make one. Make up a root
    // directory to store our files in, and run our queued work.

    var storageGapiRootName =
        location.toString().replace(/#.*/, '').replace(/.*\//, '');

    insertFile(storageGapiRootName + '/', null, null, null, function(file) {
      // Now we have a root directory!
      gapiRoot(file.id);

      // Run our queued up callbacks.
      for (var i = 0; i < gapiRootCallbacks.length; i++) {
        gapiRootCallbacks[i]();
      }
      gapiRootCallbacks = [];
    });
  }
}


/**
 * Saves a file into the root google drive directory that contains our sandbox.
 * If there is no root directory, make one, and upload all the files from the
 * sandbox to it.
 */
function gapiSaveToStorage(key, val, callback) {
  if (val === null) {
    throw new Exception('cannot save null value to gdrive');
  }

  callback = callback ? callback : function() {};

  waitForGapiRoot(function() {
    console.log('save to storage', key, gapiRoot());
    var gapi = location.pathname + '.gapi:' + key;

    if (localStorage[gapi]) {
      updateFile(key, guessMimeType(key), new Blob([val]), key, callback);
    } else {
      insertFile(key, guessMimeType(key), new Blob([val]), gapiRoot(),
          function(file) {
        localStorage[gapi] = file.id;
        callback(file);
      });
    }
  });
}


/**
 * Aux storage implmeentation for urlRegistry. For some information about
 * sandboxed files and how they are handled, please see urlRegistry.
 *
 * GoogDriveStorage should be called by default to find contents and mapped
 * URLs. If a new resource is created with register(), GoogDriveStorage is
 * informed but no longer will be called when we need a URL.
 */
function GoogDriveStorage($q) {
  this.q_ = $q;
}

GoogDriveStorage.prototype = {
  /** Saves data to goog drive under a root folder. */
  register: function(url, data) {
    var defer = this.q_.defer();
    gapiInit(function() {
      gapiSaveToStorage(url, data, function(file) {
        defer.resolve('https://googledrive.com/host/' + file.id);
      });
    });
    return defer.promise;
  },

  /** Fetches contents for sandboxed url. */
  contents: function(url) {
    var gapi = location.pathname + '.gapi:' + url;
    if (localStorage[gapi]) {
      var defer = this.q_.defer();
      gapiInit(function() {
        getFileContents(localStorage[gapi], function(file) {
          defer.resolve(file.contents);
        });
      });
      return defer.promise;
    } else {
      return this.q_.when(undefined);
    }
  },

  /** Get the URL for the sandboxed url. */
  map: function(url) {
    var gapi = location.pathname + '.gapi:' + url;
    if (localStorage[gapi]) {
      var defer = this.q_.defer();
      gapiInit(function() {
        getFileContents(localStorage[gapi], function(file) {
          defer.resolve(file.selfLink);
        });
      });
      return defer.promise;
    } else {
      return this.q_.when(undefined);
    }
  }
};


var module = angular.module('shoestring.googDrive', [
  'shoestring.urlRegistry'
]);

module.config(function(urlRegistryProvider, $injector) {
  urlRegistryProvider.registerStorage(GoogDriveStorage);
});

})();
