"use strict";

function noop() {}

module.exports = function(exit) {
    return {
        cwd  : process.cwd,
        exit : exit || noop,
        on   : function(ev, fn) {
            fn();
        }
    };
};
