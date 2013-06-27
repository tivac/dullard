/*jshint node:true */

"use strict";

var argv = require("optimist")
        .usage("Optimize a site.\nUsage: $0 -r <dir> <task1> <task2> ... <taskN>")
        .options(require("../args.json"))
        .argv,
    
    Duration = require("duration"),
    
    Build = require("../lib/build.js"),
    _build, _start;

if(argv.tasks) {
    argv.tasks = argv.tasks.split(",");
}

_build = new Build(argv);

_start = new Date();

_build.invoke(argv._, function(err) {
    if(err) {
        console.error("Build failed\n", err);
        process.exit(1);
    }
    
    console.log("Build finished in " + new Duration(_start, new Date()).toString(1));
});
 
