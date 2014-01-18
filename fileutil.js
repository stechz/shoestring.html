// Yes, yes, this whole file is pretty gross.

var storageGapiRoot = '';
if ((location.pathname + '.gapi') in localStorage) {
  storageGapiRoot = localStorage[location.pathname + '.gapi'];
}

function guessMimeType(name) {
  if (name.match(/html$/)) {
    return 'text/html';
  } else if (name.match(/js$/)) {
    return 'text/javascript';
  } else if (name.match(/css$/)) {
    return 'text/css';
  } else if (name.match(/png$/)) {
    return 'image/png';
  } else if (name.match(/jpeg$|jpg$/)) {
    return 'image/jpeg';
  } else if (name.match(/gif$/)) {
    return 'image/gif';
  } else {
    return 'text/plain';
  }
}

function getGapiRoot() {
  return localStorage[location.pathname + '.gapi'];
}

function setGapiRoot(root) {
  storageGapiRoot = root;
  localStorage[location.pathname + '.gapi'] = root;
}

function listFiles() {
  var results = [];
  for (var i in localStorage) {
    var begins = location.pathname + ':';
    if (i.substr(0, begins.length) == begins) {
      results.push(i.substr(begins.length));
    }
  }
  return results;
}

function saveToStorage(key, val) {
  localStorage[location.pathname + ':' + key] = val;
  if (storageGapiRoot) {
    var gapi = location.pathname + '.gapi:' + key;
    gapiInit(function() {
      if (localStorage[gapi]) {
        window.updateFile(key, guessMimeType(key), new Blob([val]),
            localStorage[gapi]);
      } else {
        window.insertFile(key, guessMimeType(key), new Blob([val]),
            storageGapiRoot, function(file) {
          localStorage[gapi] = file.id
        });
      }
    });
  }
}

function loadFromStorage(key) {
  return localStorage[location.pathname + ':' + key];
}

function saveToLocalStorage(name, arraybuffer) {
  var reader = new FileReader();

  reader.onload = function(e) {
    saveToStorage(name, e.target.result);
    reader = null;
  };

  reader.readAsBinaryString(arraybuffer);
}

function getURLFromLocalStorage(name, callback) {
  var str = loadFromStorage(name);
  var arr = new Uint8Array(str.length);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  getURLFromFile(new Blob([arr], {type: guessMimeType(name)}), callback);
}

function getURLFromFile(file, callback) {
  var reader = new FileReader();

  reader.onload = function(e) {
    callback(URL.createObjectURL(
        new Blob([e.target.result], {type: guessMimeType(name)})));
    reader = null;
  };

  reader.readAsArrayBuffer(file);
}
