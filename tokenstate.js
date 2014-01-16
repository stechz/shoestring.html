(function() {

var TokenState = function(cm, pos) {
  this.cm = cm;
  this.pos = {line: pos.line, ch: pos.ch};
  this.lastToken = null;
  this.continueAtLineEnd_ = true;
}

TokenState.prototype.stopAtLineEnd = function() {
  this.continueAtLineEnd_ = false;
};

TokenState.prototype.continueAtLineEnd = function() {
  this.continueAtLineEnd_ = true;
};

TokenState.prototype.next = function() {
  var token = this.cm.getTokenAt(this.pos);
  if (this.pos.line >= this.cm.lineCount()) {
    return null;
  } else if (this.lastToken && token.end == this.lastToken.end) {
    if (this.continueAtLineEnd_) {
      this.pos.line += 1;
      this.pos.ch = 0;
      return this.next();
    } else {
      return null;
    }
  } else {
    this.pos.ch = token.end + 1;
    this.lastToken = token;
    return token;
  }
};

TokenState.prototype.checkToken = function(type, string) {
  return this.lastToken.type == type && this.lastToken.string == string;
};

TokenState.prototype.findAttribute = function(name) {
  while (this.next() && !this.checkToken('attribute', name)) {
    if (this.checkToken('tag', '>')) {
      // Could not find attribute.
      return null;
    }
  }

  while (this.next() && this.lastToken.string != "=") {
    if (this.lastToken.type) {
      // Attribute has no equals sign, so empty attribute.
      return '';
    }
  }

  while (this.next() && this.lastToken.type != "string") {
    if (this.lastToken.type) {
      // attribute=, but no string. Looks invalid.
      return null;
    }
  }

  return this.lastToken ? this.lastToken.string : null;
};

var module = angular.module('shoestring.tokenstate', []);
module.value('TokenState', TokenState);

})();
