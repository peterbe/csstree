var List = require('../../utils/list');
var TYPE = require('../../scanner').TYPE;
var DESCENDANT_COMBINATOR = {};

var WHITESPACE = TYPE.Whitespace;
var IDENTIFIER = TYPE.Identifier;
var NUMBER = TYPE.Number;
var COMMENT = TYPE.Comment;
var NUMBERSIGN = TYPE.NumberSign;
var RIGHTPARENTHESIS = TYPE.RightParenthesis;
var ASTERISK = TYPE.Asterisk;
var PLUSSIGN = TYPE.PlusSign;
var COMMA = TYPE.Comma;
var FULLSTOP = TYPE.FullStop;
var SOLIDUS = TYPE.Solidus;
var COLON = TYPE.Colon;
var GREATERTHANSIGN = TYPE.GreaterThanSign;
var LEFTSQUAREBRACKET = TYPE.LeftSquareBracket;
var LEFTCURLYBRACKET = TYPE.LeftCurlyBracket;
var VERTICALLINE = TYPE.VerticalLine;
var TILDE = TYPE.Tilde;

module.exports = function Selector(nested, relative) {
    this.readSC();

    var start = this.scanner.tokenStart;
    var end = start;
    var children = new List();
    var combinator = null;
    var combinatorOffset = -1;
    var child;

    scan:
    while (!this.scanner.eof) {
        switch (this.scanner.tokenType) {
            case COMMA:
                break scan;

            case LEFTCURLYBRACKET:
                if (nested) {
                    this.scanner.error();
                }

                break scan;

            case RIGHTPARENTHESIS:
                if (!nested) {
                    this.scanner.error();
                }

                break scan;

            case COMMENT:
                this.scanner.next();
                continue;

            case WHITESPACE:
                if (combinator === null && children.head !== null) {
                    combinatorOffset = this.scanner.tokenStart;
                    combinator = DESCENDANT_COMBINATOR;
                } else {
                    this.scanner.next();
                }
                continue;

            case PLUSSIGN:
            case GREATERTHANSIGN:
            case TILDE:
            case SOLIDUS:
                if ((children.head === null && !relative) || // combinator in the beginning
                    (combinator !== null && combinator !== DESCENDANT_COMBINATOR)) {
                    this.scanner.error('Unexpected combinator');
                }

                combinatorOffset = this.scanner.tokenStart;
                combinator = this.Combinator();
                continue;

            case FULLSTOP:
                child = this.Class();
                break;

            case LEFTSQUAREBRACKET:
                child = this.Attribute();
                break;

            case NUMBERSIGN:
                child = this.Id();
                break;

            case COLON:
                child = this.Pseudo();
                break;

            case IDENTIFIER:
            case ASTERISK:
            case VERTICALLINE:
                child = this.TypeOrUniversal();
                break;

            case NUMBER:
                child = this.Percentage();
                break;

            default:
                this.scanner.error();
        }

        if (combinator !== null) {
            // create descendant combinator on demand to avoid garbage
            if (combinator === DESCENDANT_COMBINATOR) {
                combinator = {
                    type: 'Combinator',
                    loc: this.getLocation(combinatorOffset, combinatorOffset + 1),
                    name: ' '
                };
            }

            children.appendData(combinator);
            combinator = null;
        }

        children.appendData(child);
        end = this.scanner.tokenStart;
    }

    if (combinator !== null && combinator !== DESCENDANT_COMBINATOR) {
        this.scanner.error('Unexpected combinator', combinatorOffset);
    }

    return {
        type: 'Selector',
        loc: this.getLocation(start, end),
        children: children
    };
};