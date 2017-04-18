"use strict";

module.exports = function(config) {
    var clone = config.dullard.clone();

    clone.config.one = 2;

    config.log(config);
    config.log(clone.config);
};
