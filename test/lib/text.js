"use strict";

var dedent = require("dentist").dedent,
    
    crlf     = /\r\n/g,
    trailing = /\s+\n/g;

module.exports = function(str) {
    return dedent(str).replace(crlf, "\n").replace(trailing, "\n");
};
