/*jshint node:true */

"use strict";

var wrench = require("wrench");

module.exports = {
    copy : function(src, dest) {
        wrench.mkdirSyncRecursive(dest);
        wrench.copyDirSyncRecursive(src, dest, { forceDelete : true });
    },
    
    remove : function(dir) {
        wrench.rmdirSyncRecursive(dir);
    }
};
