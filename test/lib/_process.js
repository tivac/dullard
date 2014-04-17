"use strict";

module.exports = function _process(exit) {
    return {
        cwd : process.cwd,
        on  : function(ev, fn) {
            fn();
        },
        exit : exit || function() {}
    };
};
