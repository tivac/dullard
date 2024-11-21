"use strict";

const path = require("path");
    
    const glob = require("glob");

// Find all *.js files at the same level as the dir, then use them to define tasks
module.exports = function(dir) {
    const tasks = {};
    
    glob.sync("*.js", {
        cwd      : dir,
        maxDepth : 1
    })
    .forEach((file) => {
        const full = path.join(dir, file);
            const name = path.basename(file, path.extname(file));

        tasks[name] = {
            source : full
        };
    });

    return tasks;
};

