/*jshint node:true */
"use strict";

var util     = require("util"),

    pkg      = require("../package.json"),

    log      = require("npmlog"),
    uppity   = require("uppity"),
    optimist = require("optimist")
                .usage(
                    util.format(
                        "%s v%s\n    %s\n\nUsage: %s",
                        pkg.name,
                        pkg.version,
                        pkg.description,
                        pkg.usage
                    )
                )
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

module.exports = {
    
    _list : function() {
        
    },
    
    _configs : function(env) {
        
    },
    
    run : function cli(env) {
        var Dullard = env.Dullard,
            stream  = env.stream,
            process = env.process,
            
            config  = {},
            args    = optimist.parse(env.argv.slice(2)),

            dullard;

        if(!process) {
            process = global.process;
        }

        if(args.help) {
            return optimist.showHelp(stream.write);
        }

        if(args.version) {
            return stream.write(
                util.format("%s v%s", pkg.name, pkg.version)
            );
        }

        // Set up logging
        log.stream = stream;
        log.level  = _logLevel(args);

        dullard = new Dullard();

        uppity(".dullfile", { nocase : true })
            .reverse()
            .forEach(function(file) {
                dullard.addConfig(file);
            });
            
        if(args.dirs) {
            args.dirs = args.dirs.split(",");
        }
        
        args.cwd = process.cwd();
            
        dullard.addConfig(args);

        if(args.list) {
            module.exports._list
            if(!Object.keys(dullard.tasks).length) {
                return log.error("cli", "No tasks available.");
            }

            stream.write("Available Tasks:\n");

            Object.keys(dullard.tasks)
                .sort()
                .forEach(function(name) {
                    var task   = dullard.tasks[name],
                        source = task.source;

                    try {
                        task = require(source);
                        task.source = source;
                    } catch(e) {
                        // just ignore the error, since it doesn't really matter
                    }

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
            dullard.on("log", function(args) {
                log.log.apply(log, [ args.level, args.task || "dullard" ].concat(args.body));
            });
        }

        dullard.run(args._.length ? args._ : null, function(error) {
            if(!error) {
                return;
            }
            
            log.error("cli", "Build failed!");
            log.error("cli", error);

            process.on("exit", function() {
                process.exit(1);
            });
        });
    }
};
