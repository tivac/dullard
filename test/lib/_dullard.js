"use strict";

var _ = require("lodash"),
    
    Dullard = require("../../lib/dullard");

module.exports = function _dullard(fn, proto) {
    var B;
    
    if(typeof fn === "object") {
        proto = fn;
        fn    = null;
    }
    
    B = fn || function() { Dullard.apply(this, Array.prototype.slice.call(arguments)); };
    B.prototype = Object.create(Dullard.prototype);
    B.prototype.constructor = B;
    
    _.extend(
        B.prototype,
        {
            run : function() {},
            on  : function() {}
        },
        proto || {}
    );
    
    return B;
};
