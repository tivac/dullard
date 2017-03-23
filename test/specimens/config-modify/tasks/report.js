"use strict";

module.exports = function(config) {
    if(!config.modified) {
        throw new Error("config not modified");
    }
};
