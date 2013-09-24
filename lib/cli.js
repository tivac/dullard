/*jshint node:true */
"use strict";

var fs       = require("fs"),
    path     = require("path"),
    pkg      = require("../package.json"),
    
    _        = require("lodash"),
    minify   = require("jsonminify"),
    uppity   = require("uppity"),
    duration = require("humanize-duration"),
    optimist = require("optimist")
                .usage(pkg.description + "\nUsage: " + pkg.usage)
                .options(require("../args.json"));


module.exports = function cli(argv, Build, console) {
    var config  = {},
        args    = optimist
                    .parse(argv.slice(2)),
                    
        build, configs;
    
    if(args.help) {
        return optimist.showHelp(console.error);
    }
    
    if(args.dirs) {
        args.dirs = args.dirs.split(",");
    }

    configs = uppity(".dullfile", { nocase : true })
        .reverse()
        .map(function(file) {
            var base = path.dirname(file),
                contents;
            
            contents = fs.readFileSync(file, { encoding : "utf8" });

            // try reading config file as JSON first, fall back to JS
            try {
                contents = minify(contents);
                file     = JSON.parse(contents);
            } catch(e) {
                file = require(file);
            }
            
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
        
        config = _.merge(
            config, 
            file,
            // Disable lodash's default array merging behavior, see https://github.com/tivac/dullard/issues/15
            function(a, b) {
                return _.isArray(b) ? b : undefined;
            }
        );
        
        config.dirs = dirs.concat(file.dirs || []);
    });
    
    config.cwd = process.cwd();
    
    build = new Build(config);
    
    if(args.list) {
        if(!Object.keys(build.tasks).length) {
            return console.log("No tasks available.");
        }
        
        console.log("Available Tasks:");
        
        Object.keys(build.tasks)
            .sort()
            .forEach(function(name) {
                var task = build.tasks[name];
                
                console.log("\"" + name + "\"");
                console.log("    source: " + task.source);
                
                if(task.description) {
                    console.log("    description: " + task.description);
                }
                
                console.log("");
            });
        
        return;
    }
    
    if(!config.quiet) {
        build.on("log", function(log) {
            var elapsed = ("duration" in log) ? " in " + duration(log.duration) : "";
            
            console.log("  LOG:  " + log.message + elapsed);
        });
    }
    
    build.run(args._.length ? args._ : null, function(error) {
        if(error) {
            console.error("  ERROR: Build failed due to \"" + error + "\"");
        }
    });
};
