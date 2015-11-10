"use strict";

var stream = require("stream");

module.exports = function(write) {
    var s = new stream.Stream();
    
    s.write = write || function() {};
    
    return s;
};
