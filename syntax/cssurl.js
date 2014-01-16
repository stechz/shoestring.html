(function() {

function CssUrlLink(TokenState) {
  this.TokenState = TokenState;
}

CssUrlLink.prototype.getHit = function(cm, cur, range) {
  cur.ch = 0;

  var TokenState = this.TokenState;
  var tokenState = new TokenState(cm, cur);
  tokenState.stopAtLineEnd();

  // Look for URL.
  while (tokenState.next() && !tokenState.checkToken('string-2', 'url'));

  var hit = {from: {line: tokenState.pos.line, ch: tokenState.pos.ch - 4}};

  tokenState.continueAtLineEnd();
  tokenState.next();

  if (!tokenState.checkToken(null, '(')) {
    return null;
  }

  tokenState.next();
  this.href = tokenState.lastToken.string;

  tokenState.next();
  if (!tokenState.checkToken(null, ')')) {
    return null;
  }

  hit.to = tokenState.pos;
  tokenState.pos.ch -= 1;
  return hit;
};

CssUrlLink.prototype.buildScope = function(scope) {
  scope.filename = this.href;
};

CssUrlLink.prototype.getHighlightClass = function() {
  return 'editor-csslink';
};

CssUrlLink.prototype.getHtml = function() {
  return '<div class="editor-goto">' +
      '<a href="#{{filename}}">Open {{filename}}</a></div>';
};

var run = function(syntaxWidget) {
  syntaxWidget.add(CssUrlLink);
};

var module = angular.module('shoestring.syntax.cssurl', []);
module.run(run);

})();
