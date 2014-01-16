function SyntaxWidgetService($compile, $injector, $rootScope) {
  this.compile = $compile;
  this.injector = $injector;
  this.rootScope = $rootScope;
  this.matchers = [];

  var doMatchTags = function(cm) {
    for (var i = 0; i < this.matchers.length; i++) {
      this.matchers[i](cm);
    }
  }.bind(this);

  CodeMirror.defineOption("deepLinking", true, function(cm, val, old) {
    if (old && old != CodeMirror.Init) {
      cm.off("cursorActivity", doMatchTags);
      clear(cm);
    }
    if (val) {
      cm.on("cursorActivity", doMatchTags);
      doMatchTags(cm);
    }
  });
}

SyntaxWidgetService.prototype.add = function(WidgetCons) {
  var gotoWidget = null;
  var scope = null;
  var compile = this.compile;
  var injector = this.injector;
  var rootScope = this.rootScope;
  var tagHit = null;

  var clear = function(cm) {
    if (tagHit) {
      tagHit.clear();
      tagHit = null;
    }

    if (gotoWidget) {
      gotoWidget.clear();
      scope.$destroy();
    }
  };

  var doMatchTags = function(cm) {
    cm.operation(function() {
      clear(cm);

      var widget = injector.instantiate(WidgetCons);
      var cur = cm.getCursor()
      var range = cm.getViewport();
      range.from = Math.min(range.from, cur.line);
      range.to = Math.max(cur.line + 1, range.to);

      var hit = widget.getHit(cm, cur, range);
      if (!hit) {
        return;
      }

      scope = rootScope.$new();
      scope.left = cm.cursorCoords(hit.from, 'local').left;
      widget.buildScope(scope);

      var highlightClass = widget.getHighlightClass();
      if (highlightClass) {
        tagHit = cm.markText(hit.from, hit.to, {className: highlightClass});
      }

      var gotoElement = angular.element('<div style="margin-left:{{left}}px">');
      gotoElement.append(widget.getHtml());
      gotoWidget = cm.addLineWidget(hit.from.line, gotoElement[0]);
      compile(gotoElement)(scope);
      scope.$digest();
    });
  };

  this.matchers.push(doMatchTags);
}

var module = angular.module('shoestring.syntaxwidget', []);
module.service('syntaxWidget', SyntaxWidgetService);
