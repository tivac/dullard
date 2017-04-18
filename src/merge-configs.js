"use strict";

var merge  = require("lodash.mergewith");

// Merge two configs, except arrays
module.exports = function(one, two) {
    return merge(
        {},
        one,
        two,
        
        // Disable lodash's default array merging behavior,
        // see https://github.com/tivac/dullard/issues/15
        (a, b) => (Array.isArray(b) ? b : undefined)
    );
};
