"use strict";

var assert = require("assert"),

    dedent   = require("dentist").dedent,
    calmcard = require("calmcard"),
    
    crlf     = /\r\n/g,
    trailing = /\s+\n/g;

function clean(str) {
    return dedent(str).replace(crlf, "\n").replace(trailing, "\n");
};

module.exports.text = function(one, two) {
    assert.equal(clean(one), clean(two));
};

module.exports.wildcard = function(one, two) {
    var result = calmcard(clean(two), clean(one));

    if(!result) {
        assert.equal(clean(one), clean(two));
    }
};

