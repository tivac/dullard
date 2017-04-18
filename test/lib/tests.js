"use strict";

var assert = require("assert"),

    dedent   = require("dedent"),
    calmcard = require("calmcard"),
    
    crlf     = /\r\n/g,
    trailing = /\s+\n/g;

function clean(str) {
    return dedent(str).replace(crlf, "\n").replace(trailing, "\n");
};

function wildcard(one, two) {
    var result;
    
    one = clean(one);
    two = clean(two);
    
    // wildcard comparison
    result = calmcard(two, one);

    // If wildcard match failed show nice diff output
    // it won't respect wildcard chars, but not much to do about that
    if(!result) {
        expect(one).toBe(two);
    }
}

exports.failure = function(result, text) {
    expect(result.code).toBe(1);

    wildcard(result.stderr, text);
};

exports.success = function(result, text) {
    expect(result.code).toBe(0);

    wildcard(result.stderr, text);
};
