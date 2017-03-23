"use strict";

var assert = require("assert"),

    dedent   = require("dedent"),
    calmcard = require("calmcard"),
    
    crlf     = /\r\n/g,
    trailing = /\s+\n/g;

function clean(str) {
    return dedent(str).replace(crlf, "\n").replace(trailing, "\n");
};

module.exports.text = function(one, two) {
    expect(clean(one)).toBe(clean(two));
};

module.exports.wildcard = function(one, two) {
    var result = calmcard(clean(two), clean(one));

    if(!result) {
        expect(clean(one)).toBe(clean(two));
    }
};

