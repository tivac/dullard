"use strict";

var assign = require("lodash.assign"),
    
    Dullard = require("../../src/dullard");

module.exports = function(fn, proto) {
    var B;
    
    if(typeof fn === "object") {
        proto = fn;
        fn    = null;
    }
    
    B = fn || function() {
        Dullard.apply(this, Array.prototype.slice.call(arguments));
    };

    B.prototype = Object.create(Dullard.prototype);
    B.prototype.constructor = B;
    
    assign(
        B.prototype,
        {
            run : function() {},
            
            on : function() {}
        },
        proto || {}
    );
    
    return B;
};
