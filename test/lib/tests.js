"use strict";

var assert = require("assert"),

    dedent   = require("dedent"),
    calmcard = require("calmcard"),
    
    crlf     = /\r\n/g,
    trailing = /\s+\n/g;

function clean(str) {
    return dedent(str).replace(crlf, "\n").replace(trailing, "\n");
};

exports.wildcard = function(one, two) {
    var result = calmcard(clean(two), clean(one));

    if(!result) {
        expect(clean(one)).toBe(clean(two));
    }
};

exports.failure = function(result, text) {
    exports.wildcard(result.stderr, text);

    expect(result.code).toBe(1);
};

exports.success = function(result, text) {
    exports.wildcard(result.stderr, text);

    expect(result.code).toBe(0);
};
