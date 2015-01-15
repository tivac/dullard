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
        .options(require("../args.json"));

function Cli(env) {
    this.Dullard = env.Dullard;
    this.stream  = env.stream;
    this.process = env.process || process;
    this.args    = optimist.parse(env.argv.slice(2));
}

Cli.prototype = {
    _level : function() {
        if(this.args.silent) {
            return "silent";
        }

        if(this.args.verbose) {
            return "verbose";
        }
        
        if(this.args.silly) {
            return "silly";
        }

        return this.args.loglevel;
    },

    _dullard : function() {
        var dullard = new this.Dullard();

        uppity(".dullfile", {
            nocase : true
        })
            .reverse()
            .forEach(function(file) {
                log.verbose("cli", "Adding config: %s", file);

                dullard.addConfig(file);
            });
            
        if(this.args.dirs) {
            this.args.dirs = this.args.dirs.split(",");
        }

        this.args.cwd   = process.cwd();

        log.verbose("cli", "Adding config: %j", this.args);

        dullard.addConfig(this.args);

        return dullard;
    },

    _list : function(dullard) {
        var self = this;

        if(!Object.keys(dullard.tasks).length) {
            return log.error("cli", "No tasks available.");
        }

        this.stream.write("Available Tasks:\n");

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

                self.stream.write("\"" + name + "\"\n");
                self.stream.write("    source: " + task.source + "\n");

                if(task.description) {
                    self.stream.write("    desc  : " + task.description + "\n");
                }

                self.stream.write("\n");
            });
    },

    run : function() {
        var self = this,
            dullard;

        if(this.args.help) {
            return optimist.showHelp(this.stream.write);
        }

        if(this.args.version) {
            return this.stream.write(
                util.format("%s v%s", pkg.name, pkg.version)
            );
        }

        // Set up logging
        log.stream = this.stream;
        log.level  = this._level();

        dullard = this._dullard();

        if(this.args.list) {
            return this._list(dullard);
        }

        if(!this.args.quiet) {
            dullard.on("log", function(args) {
                log.log.apply(log, [ args.level, args.task || "dullard" ].concat(args.body));
            });
        }

        dullard.run(this.args._.length ? this.args._ : null, function(error) {
            if(!error) {
                return;
            }
            
            log.error("cli", "Build failed!");
            log.error("cli", error);

            // Don't exit immediately, want to make sure any output
            // has a chance to be written first
            self.process.on("exit", function() {
                self.process.exit(1);
            });
        });
    }
};

module.exports = Cli;
