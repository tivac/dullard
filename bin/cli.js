/*jshint node:true */

"use strict";

var pkg      = require("../package.json"),
    optimist = require("optimist")
        .usage(pkg.description + "\nUsage: $0 -d <dir>,...,<dirN> <step1> ... <stepN>")
        .options(require("../args.json")),
    argv     = optimist.argv,
    
    _        = require("lodash"),
    Duration = require("duration"),
    findup   = require("findup-sync"),
    
    Build = require("../lib/build.js"),
    
    _start = new Date(),
    
    _build, _config;

if(argv.help) {
    optimist.showHelp();
    
    return;
}

if(typeof argv.tasks === "string") {
    argv.tasks = argv.tasks.split(",");
}

argv.steps = argv._;

_config = findup("dullfile.js*", { nocase : true });

_config = _config ? require(_config) : {};
_config = _.merge(_config, argv);

_config.cwd = process.cwd();

_build  = new Build(_config);

_build.run(function(err) {
    if(err) {
        console.error("Build failed\n", err);
        process.exit(1);
    }
    
    console.log("Build finished in " + new Duration(_start, new Date()).toString(1));
});
 
