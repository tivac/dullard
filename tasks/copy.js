/*jshint node:true */

"use strict";


var wrench = require("wrench");

module.exports = function(build) {
    var dirs = build.config.dirs;
    
    wrench.mkdirSyncRecursive(dirs.temp);
    
    wrench.copyDirSyncRecursive(
        dirs.root,
        dirs.temp,
        { forceDelete : true }
    );
};

module.exports.description = "Copy files from root dir into temporary location";
