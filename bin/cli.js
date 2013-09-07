/*jshint node:true */

"use strict";

var argv = require("optimist")
        .usage("Optimize a site.\nUsage: $0 -r <dir> <task1> <task2> ... <taskN>")
        .options(require("../args.json"))
        .argv,
    
    Duration = require("duration"),
    findup   = require("findup-sync"),
    
    Build = require("../lib/build.js"),
    
    _start = new Date(),
    
    _build, _config;

if(typeof argv.tasks === "string") {
    argv.tasks = argv.tasks.split(",");
}

_config = require(findup("_build.js*", { nocase : true }));

// TODO: merge _config (or _config()!) with argv before passing to new Build
// TODO: figure out what should be in the config
//          - tasks (dirs to load task modules from)
//          - steps (tasks to run, in an order)
//          - other misc stuff added to shared state object
_build  = new Build(argv);

_build.invoke(argv._, function(err) {
    if(err) {
        console.error("Build failed\n", err);
        process.exit(1);
    }
    
    console.log("Build finished in " + new Duration(_start, new Date()).toString(1));
});
 
