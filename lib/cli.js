/*jshint node:true */
"use strict";

module.exports = function cli(argv, Build, console) {
    var path     = require("path"),
        pkg      = require("../package.json"),
        
        _        = require("lodash"),
        uppity   = require("uppity"),
        duration = require("humanize-duration"),
        optimist = require("optimist")
                    .usage(pkg.description + "\nUsage: " + pkg.usage)
                    .options(require("../args.json")),
        
        
        config  = {},
        args    = optimist
                    .parse(argv.slice(2)),
                    
        build, configs;
    
    if(args.help) {
        return optimist.showHelp(console.error);
    }
    
    if(args._.length) {
        args.steps = args._;
    }

    configs = uppity("dullfile.js*", { nocase : true })
        .reverse()
        .map(function(file) {
            var base = path.dirname(file);
            
            file = require(file);
            
            if(file.dirs) {
                file.dirs = file.dirs.map(function(dir) {
                    return path.resolve(base, dir);
                });
            }
            
            return file;
        });
    
    configs.push(args);
    
    configs.forEach(function(file) {
        var dirs = config.dirs ? config.dirs.slice() : [];
        
        config = _.merge(config, file);
        config.dirs = dirs.concat(file.dirs || []);
    });
    
    config.cwd = process.cwd();
    
    build = new Build(config);
    
    if(!config.quiet) {
        build.on("log", function(log) {
            var elapsed = ("duration" in log) ? " in " + duration(log.duration) : "";
            
            console.log("  LOG:  " + log.message + elapsed);
        });
    }

    build.run(function(error) {
        if(error) {
            console.error("  ERROR: Build failed due to \"" + error + "\"");
        }
    });
};     
