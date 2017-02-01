"use strict";

module.exports = function(config) {
    if(!config.steps) {
        return {};
    }

    // Convert steps that are a single function or array into the
    // object format we use internally
    if(typeof config.steps !== "object" || Array.isArray(config.steps)) {
        return {
            default : config.steps
        };
    }

    return config.steps;
};
