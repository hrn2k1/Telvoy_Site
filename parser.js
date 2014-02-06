


var inspect = require('util').inspect;
var config = require('./config.js');
//var mimelib = require("mimelib-noiconv");
var utility=require('./utility.js');
//var querystring = require("querystring");

var debug = config.IS_DEBUG_MODE;




////////////////////////////////start field parser ////////////////////////
function parseProvider(str){
    var result = str.match(/webex/i);
if (result){
    return "WebEx";
}
result = str.match(/gotomeeting/i);
if (result){
    return "GoToMeeting";
}

return null;
}



////////////////////////////////end field parser /////////////////////////
function parseString(str, delimiter, endMarker, allowFuzzy, usePattern)
{
    var dict =
    [
        {
            keyword: 'toll', // TODO: rename to 'phone'
            alts: 'toll|bridge|dial-in|dial',
            pattern: '[0-9\\-+]+',
            fuzzy: true,
        },
        {
            keyword: 'code', // TODO: rename to 'access code'
            alts: 'code|meeting number|access code',
            pattern: '[0-9]+',
            fuzzy: true,
        },
        {
            keyword: 'pin', // TODO: rename to 'pin'
            alts: 'pin|secrete',
            pattern: '[0-9]+',
            fuzzy: true,
        },
        {
            keyword: 'password',
            alts: 'password',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'date',
            alts: 'date',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'time',
            alts: 'time',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'to',
            alts: 'to',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'from',
            alts: 'from',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'subject',
            alts: 'subject',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'agenda',
            alts: 'topic|agenda',
            pattern: '.+',
            fuzzy: false,
        },
    ];

    var out = {};

    for (i = 0; i < dict.length; i++) {
        var re = new RegExp('\\b(?:' + dict[i].alts + ')\\b' +
                            (allowFuzzy && dict[i].fuzzy ? '.*' : '(?:\\s*)?') + '[+:]' +
                            '\\s*(' + (usePattern ? dict[i].pattern : '.+') + ')' + endMarker, 'i');
        var match = str.match(re);
        if (match && match.length > 0) {
            if(match[1] !=null)
                out[dict[i].keyword] = match[1].trim();
            else
                out[dict[i].keyword]=null;
        }
    }
    out['provider']=parseProvider(str);
    return out;
}


exports.parseString=parseString;