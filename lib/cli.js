/*jshint node:true */
"use strict";

var fs       = require("fs"),
    path     = require("path"),
    pkg      = require("../package.json"),
    
    _        = require("lodash"),
    log      = require("npmlog"),
    minify   = require("jsonminify"),
    uppity   = require("uppity"),
    duration = require("humanize-duration"),
    optimist = require("optimist")
                .usage(pkg.description + "\nUsage: " + pkg.usage)
                .options(require("../args.json")),
    
    _logLevel;


_logLevel = function(argv) {
    if(argv.silent) {
        return "silent";
    }
    
    if(argv.verbose) {
        return "verbose";
    }
    
    return argv.loglevel;
};

module.exports = function cli(argv, Build, stream) {
    var config  = {},
        args    = optimist
                    .parse(argv.slice(2)),
                    
        build, configs;
    
    if(args.help) {
        return optimist.showHelp(stream.write);
    }
    
    // Set up logging
    log.stream = stream;
    log.level  = _logLevel(args);
    
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
    config.log = log;
    
    build = new Build(config);
    
    if(args.list) {
        if(!Object.keys(build.tasks).length) {
            return log.error("", "No tasks available.");
        }
        
        stream.write("Available Tasks:\n");
        
        Object.keys(build.tasks)
            .sort()
            .forEach(function(name) {
                var task = build.tasks[name];
                
                stream.write("\"" + name + "\"\n");
                stream.write("    source: " + task.source + "\n");
                
                if(task.description) {
                    stream.write("    desc  : " + task.description + "\n");
                }
                
                stream.write("\n");
            });
        
        return;
    }
    
    if(!config.quiet) {
        build.on("log", function(args) {
            var elapsed = ("duration" in args) ? " in " + duration(args.duration) : "";
            
            args.message += elapsed;
            
            log.log(args.level, args.prefix || "", args.message);
        });
    }
    
    build.run(args._.length ? args._ : null, function(error) {
        if(error) {
            log.error("", "Build failed due to \"" + error + "\"");
        }
    });
};
