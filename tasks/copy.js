/*jshint node:true */

"use strict";

var fs     = require("fs"),
    wrench = require("wrench");

module.exports = function(build) {
    var dirs = build.config.dirs;
    
    if(!fs.existsSync(dirs.temp)) {
        wrench.mkdirSyncRecursive(dirs.temp);
    }
    
    wrench.copyDirSyncRecursive(
        dirs.root,
        dirs.temp,
        { forceDelete : true }
    );
};

module.exports.description = "Copy files from root dir into temporary location";
