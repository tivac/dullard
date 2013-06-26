/*jshint node:true */

"use strict";

var path  = require("path"),
    
    async  = require("async"),
    wrench = require("wrench"),
    argv   = require("optimist")
        .usage("Optimize a site.\nUsage: $0 -r <dir> <task1> <task2> ... <taskN>")
        .options(require("./args.json"))
        .argv,
    
    Duration = require("duration"),
    
    config = {},    
    tasks  = {},
    
    _start,
    _loadTasks;

// Set up config dirs
config.dirs = {
    root  : path.normalize(argv.root),
    dest  : path.normalize(argv.dest),
    temp  : argv.temp ? path.normalize(argv.temp) : path.join(__dirname, "temp", path.basename(argv.root)),
    tasks : {
        internal : path.join(__dirname, "tasks"),
        custom   : argv.tasks ? path.normalize(argv.tasks) : false
    }
};

config.invoke = function(steps, done) {
    async.eachSeries(
        steps,
        function(step, cb) {
            var task = tasks[step];
            
            if(!task) {
                return cb("Unknown task: " + step);
            }
            
            task(config, cb);
            
            // Non-async tasks only take one argument the config
            if(task.length < 2) {
                cb();
            }
        },
        done
    );
};

// Utility functions
_loadTasks = function(dir) {
    wrench.readdirSyncRecursive(dir).forEach(function(file) {
        tasks[path.basename(file, path.extname(file))] = require(path.join(dir, file));
    });
};

// load built-in tasks
_loadTasks(config.dirs.tasks.internal);

// optionally load custom tasks
if(argv.tasks) {
    _loadTasks(config.dirs.tasks.custom);
}

_start = new Date();

config.invoke(argv._, function(err) {
    if(err) {
        console.error("Build failed\n", err);
        process.exit(1);
    }
    
    console.log("Build finished in " + new Duration(_start, new Date()).toString(1));
});
