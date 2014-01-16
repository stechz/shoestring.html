(function() {

function ScriptLink(TokenState) {
  this.TokenState = TokenState;
}

ScriptLink.prototype.getHit = function(cm, cur, range) {
  var match = CodeMirror.findMatchingTag(cm, cur, range);
  if (!(match && match.at == "open")) {
    return null;
  }

  var hit = match.open;
  if (hit.tag != "img") {
    return null;
  }

  var TokenState = this.TokenState;
  var tokenState = new TokenState(cm, hit.from);
  var href = tokenState.findAttribute('src');
  if (!href) {
    return null;
  }

  this.href = href.replace(/^'|^"|"$|'$/g, '');

  return hit;
};

ScriptLink.prototype.buildScope = function(scope) {
  scope.filename = this.href;
};

ScriptLink.prototype.getHighlightClass = function() {
  return 'editor-csslink';
};

ScriptLink.prototype.getHtml = function() {
  return '<div class="editor-goto">' +
      '<a href="#{{filename}}">Open {{filename}}</a></div>';
};

var run = function(syntaxWidget) {
  syntaxWidget.add(ScriptLink);
};

var module = angular.module('shoestring.syntax.img', []);
module.run(run);

})();
