/*jshint node:true */

"use strict";

var argv = require("optimist")
        .usage("Optimize a site.\nUsage: $0 -r <dir> <task1> <task2> ... <taskN>")
        .options(require("../args.json"))
        .argv,
    
    _        = require("lodash"),
    Duration = require("duration"),
    findup   = require("findup-sync"),
    
    Build = require("../lib/build.js"),
    
    _start = new Date(),
    
    _build, _config;

if(typeof argv.tasks === "string") {
    argv.tasks = argv.tasks.split(",");
}

argv.steps = argv._;

_config = findup("_build.js*", { nocase : true });

console.log(_config);

// config file found
if(_config) {
    _config = require(_config);
    _config = _.merge(_config, argv);
}

_build = new Build(_config || argv);

_build.run(function(err) {
    if(err) {
        console.error("Build failed\n", err);
        process.exit(1);
    }
    
    console.log("Build finished in " + new Duration(_start, new Date()).toString(1));
});
 
