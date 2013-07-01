/*jshint node:true */

"use strict";

var fs     = require("fs"),
    wrench = require("wrench");

module.exports = {
    copy : function(src, dest) {
        wrench.mkdirSyncRecursive(dest);
        wrench.copyDirSyncRecursive(src, dest, { forceDelete : true });
    },
    
    remove : function(dir) {
        if(!fs.existsSync(dir)) {
            return;
        }
        
        wrench.rmdirSyncRecursive(dir);
    }
};
