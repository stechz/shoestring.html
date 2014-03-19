(function() {

var CLIENT_JS = 'https://apis.google.com/js/client.js?' +
                'onload=googDriveInitScript';

var CLIENT_ID;
if (location.host == 'localhost') {
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

var loaded = false;

var storageGapiRoot = '';

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


/** Callback is called after gapi is initialized. */
function gapiInit(callback) {
  if ((location.pathname + '.gapi') in localStorage) {
    storageGapiRoot = localStorage[location.pathname + '.gapi'];
  }

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

    if (foldersArray.length) {
      var metadata = {
        'mimeType': 'application/vnd.google-apps.folder',
        'title': foldersArray.shift(),
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


/**
 * Saves a file into the root google drive directory that contains our sandbox.
 * If there is no root directory, make one.
 */
function gapiSaveToStorage(key, val, callback) {
  callback = callback ? callback : function() {};

  if (storageGapiRoot) {
    // We have a root directory to store our files in.

    var gapi = location.pathname + '.gapi:' + key;

    gapiInit(function() {
      if (localStorage[gapi]) {
        window.updateFile(key, guessMimeType(key), new Blob([val]), callback);
      } else {
        window.insertFile(key, guessMimeType(key), new Blob([val]),
            storageGapiRoot, function(file) {
          localStorage[gapi] = file.id;
        });
      }
    });
  } else {
    // Make up a root directory to store our files in, and try again.

    var callbacksLeft = 1;
    // TODO. implement callbacks.

    var storageGapiRootName = location.toString().replace(/#.*/, '');

    insertFile(storageGapiRootName, null, null, null, function(file) {
      var files = listFiles();
      for (var i = 0; i < files.length; i++) {
        gapiSaveToStorage(files[i], loadFromStorage(files[i]));
      }
    });
  }
}


/** Aux storage implmeentation for urlRegistry. */
function GoogDriveStorage($q) {
  this.q_ = $q;
}

GoogDriveStorage.prototype = {
  /** Saves data to goog drive under a root folder. */
  register: function(url, data) {
    var defer = this.q_.defer();
    gapiSaveToStorage(url, data);
    return defer.promise;
  },

  contents: function(url) {
    // TODO. This is a stub.
    return loadFromStorage(url);
  },

  map: function() {
    // TODO. This is a stub.
    var defer = this.q_.defer();
    var textBlob = getBlobForText(url, loadFromStorage(url));
    getURLFromFile(textBlob, function(url) { defer.resolve(url); });
    return defer.promise;
  }
};


var module = angular.module('shoestring.googDrive', []);

module.config(function(urlRegistryProvider, $injector) {
  urlRegistryProvider.registerStorage($injector.instantiate(GoogDriveStorage));
});

})();
