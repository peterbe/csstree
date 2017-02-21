var List = require('../../utils/list');
var TYPE = require('../../tokenizer').TYPE;

var COMMA = TYPE.Comma;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var BALANCED = true;

module.exports = {
    name: 'SelectorList',
    parse: function() {
        var children = new List();

        while (!this.scanner.eof) {
            children.appendData(this.parseSelector
                ? this.Selector()
                : this.Raw(BALANCED, COMMA, LEFTCURLYBRACKET)
            );

            if (this.scanner.tokenType === COMMA) {
                this.scanner.next();
                continue;
            }

            break;
        }

        return {
            type: 'SelectorList',
            loc: this.getLocationFromList(children),
            children: children
        };
    },
    generate: function(node) {
        return this.eachComma(node.children);
    },
    walk: function(node, context, walk) {
        var oldSelector = context.selector;
        context.selector = node;

        node.children.each(walk);

        context.selector = oldSelector;
    }
};