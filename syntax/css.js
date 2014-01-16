(function() {

function CssLink(TokenState) {
  this.TokenState = TokenState;
}

CssLink.prototype.getHit = function(cm, cur, range) {
  var match = CodeMirror.findMatchingTag(cm, cur, range);
  if (!(match && match.at == "open")) {
    return null;
  }

  var hit = match.open;
  if (hit.tag != "link") {
    return null;
  }

  var TokenState = this.TokenState;
  var tokenState = new TokenState(cm, hit.from);
  var href = tokenState.findAttribute('href');
  if (!href) {
    return null;
  }

  this.href = href.replace(/^'|^"|"$|'$/g, '');

  return hit;
};

CssLink.prototype.buildScope = function(scope) {
  scope.filename = this.href;
};

CssLink.prototype.getHighlightClass = function() {
  return 'editor-csslink';
};

CssLink.prototype.getHtml = function() {
  return '<div class="editor-goto">' +
      '<a href="#{{filename}}">Open {{filename}}</a></div>';
};

var run = function(syntaxWidget) {
  syntaxWidget.add(CssLink);
};

var module = angular.module('shoestring.syntax.css', []);
module.run(run);

})();
