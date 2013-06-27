/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    wrench = require("wrench");

module.exports = function(build) {
    var dirs = build.config.dirs;
    
    wrench.mkdirSyncRecursive(path.dirname(dirs.dest));
    
    fs.renameSync(dirs.temp, dirs.dest);
};

module.exports.description = "Move transformed files from the temporary location to the output dir";
