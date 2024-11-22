import path from "node:path";

import glob from "fast-glob";

// Find all *.js files at the same level as the dir, then use them to define tasks
export default function(dir) {
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
}

