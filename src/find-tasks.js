"use strict";

var path = require("path"),
    
    glob = require("glob");

// Find all *.js files at the same level as the dir, then use them to define tasks
module.exports = function(dir) {
    var tasks = {};
    
    glob.sync("*.js", {
        cwd      : dir,
        maxDepth : 1
    })
    .forEach((file) => {
        var full = path.join(dir, file),
            name = path.basename(file, path.extname(file));

        tasks[name] = {
            source : full
        };
    });

    return tasks;
};

