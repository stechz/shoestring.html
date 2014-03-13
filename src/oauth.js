(function() {

// not localhost
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

/**
 * Called when the client library is loaded.
 */
window.gapiInit = function(callback) {
  if (loaded) {
    callback();
  } else {
    callbacks.push(callback);
    checkAuth();
  }
};

window.gapiInitScript = function() {
  if (callbacks.length) {
    checkAuth();
  }
};

/**
 * Check if the current user has authorized the application.
 */
window.checkAuth = function() {
  if (window.gapi && window.gapi.auth) {
    gapi.auth.authorize(
        {'client_id': CLIENT_ID, 'scope': SCOPES.join(' '), 'immediate': true},
        handleAuthResult);
  }
};

/**
 * Called when authorization server replies.
 *
 * @param {Object} authResult Authorization result.
 */
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

window.updateFile = function(name, type, blob, id, callback) {
  var reader = new FileReader();
  reader.readAsBinaryString(blob);
  reader.onload = function(e) {
    var contentType = type || 'application/octet-stream';
    var metadata = {'title': name, 'mimeType': contentType};
    uploadFileWithMetadata(metadata, reader.result, id, callback);
  };
};

/**
 * Insert new file.
 */
window.insertFile = function(name, type, blob, parentFolderId, callback) {
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
};

})();
