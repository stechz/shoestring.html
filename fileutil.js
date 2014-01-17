function saveToStorage(key, val) {
  localStorage[location.pathname + ':' + key] = val;
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
  getURLFromFile(new Blob([arr]), callback);
}

function getURLFromFile(file, callback) {
  var reader = new FileReader();

  reader.onload = function(e) {
    callback(URL.createObjectURL(new Blob([e.target.result])));
    reader = null;
  };

  reader.readAsArrayBuffer(file);
}
