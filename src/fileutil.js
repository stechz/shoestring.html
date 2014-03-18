// Yes, yes, this whole file is pretty gross.

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
}

function loadFromStorage(key) {
  return localStorage[location.pathname + ':' + key];
}

function saveToLocalStorage(name, arraybuffer, callback) {
  var reader = new FileReader();

  reader.onload = function(e) {
    saveToStorage(name, e.target.result);
    if (callback) {
      callback();
    }
    reader = null;
  };

  reader.readAsBinaryString(arraybuffer);
}

function getBlobForText(name, str) {
  var arr = new Uint8Array(str.length);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return new Blob([arr], {type: guessMimeType(name)});
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
