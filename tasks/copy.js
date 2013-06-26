/*jshint node:true */

"use strict";

var wrench = require("wrench");

module.exports = function(config) {
    
    wrench.mkdirSyncRecursive(config.dirs.temp);
    
    wrench.copyDirSyncRecursive(
        config.dirs.root,
        config.dirs.temp,
        { forceDelete : true }
    );
};
