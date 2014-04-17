"use strict";

var stream = require("stream");

module.exports = function _stream(write) {
    var s = new stream.Stream();
    
    s.write = write || function() {};
    
    return s;
};
