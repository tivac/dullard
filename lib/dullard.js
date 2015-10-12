"use strict";

var fs     = require("fs"),
    path   = require("path"),
    util   = require("util"),
    events = require("events"),

    _      = require("lodash"),
    async  = require("async"),
    glob   = require("glob"),
    time   = require("humanize-duration"),
    strip  = require("strip-json-comments"),

    Build;

Build = function(config) {
    events.EventEmitter.call(this);

    this.tasks   = {};
    this.steps   = {};
    this._config = {
        dullard : this,
        log     : this._log.bind(this),
        dirs    : []
    };
    
    if(config) {
        this.addConfig(config);
    }
};

Build.prototype = Object.create(events.EventEmitter.prototype);

_.extend(Build.prototype, {
    constructor : Build,
    
    _loadConfig : function(file) {
        var base = path.dirname(file),
            contents;

        contents = fs.readFileSync(file, "utf8");

        // try reading config file as JSON first, fall back to JS
        try {
            contents = strip(contents);
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
    },
    
    // Find all *.js files at the same level as the dir, then use them to define tasks
    _findTasks : function(dir) {
        var self = this;

        glob.sync("*.js", {
            cwd      : dir,
            maxDepth : 1
        }).forEach(function(file) {
            var full = path.join(dir, file),
                name = path.basename(file, path.extname(file));

            self.tasks[name] = {
                source : full
            };
        });
    },
    
    // Fire a logging event, generally caught by CLI module & logged
    _log : function(level, message) {
        if(!message) {
            level = "info";
        }

        this.emit("log", {
            level : level,
            task  : this._current,
            body  : Array.prototype.slice.call(arguments, message ? 1 : 0)
        });
    },
    
    // Attempts to read a task off disk
    _loadTask : function(name) {
        var source;

        if(typeof name === "function") {
            return name;
        }

        if(!(name in this.tasks)) {
            return;
        }

        // Task is already loaded
        if(typeof this.tasks[name] === "function") {
            return this.tasks[name];
        }

        // Save source off so it can be stuck back on
        source = this.tasks[name].source;
        
        this.tasks[name] = require(source);
        this.tasks[name].source = source;

        return this.tasks[name];
    },

    _runTask : function(name, done) {
        var self  = this,
            start = Date.now(),
            task,
            result;

        // Support aliases by recursing down the rabbit hole
        if(this.steps && name in this.steps) {
            return this._runSteps(name, done);
        }

        task = this._loadTask(name);

        if(!task) {
            return done("Unknown task: " + name);
        }

        this._current = name.toString();

        this._log("verbose", "started");
        
        // Only run the task if we aren't in test mode
        if(!this._test) {
            // Wrap the callback fn to support async tasks returning an updated config
            // Store the result so that sync steps can error out by returning a value
            result = task(this._config, function(err, config) {
                if(err) {
                    // Handle formatted strings coming back
                    return done(
                        util.format.apply(null, Array.prototype.slice.apply(arguments))
                    );
                }

                if(config) {
                    self._config = config;
                }

                self._log("complete in " + time(Date.now() - start));

                done();
            });
        }

        // Non-async tasks only take one argument, the config instance
        // If we're testing then it doesn't matter, the task never ran
        if(task.length < 2 || this._test) {
            this._log("info", "%s in %s", this._test ? "faked" : "complete", time(Date.now() - start));

            done(result);
        }
    },

    _runSteps : function(name, done) {
        var steps;

        if(this.steps && (name in this.steps)) {
            steps = this.steps[name];
        } else if(name in this.tasks) {
            steps = [ name ];
        } else {
            steps = name;
        }

        if(!steps) {
            return done("No steps defined");
        }

        if(!Array.isArray(steps)) {
            steps = [ steps ];
        }

        // Set up current even though we're not into .runTask yet
        // so that the log will have the right prefix
        this._current = name;
        this._log("verbose", "%s steps:\n\t%s", this._test ? "Pretending to run" : "Running", steps.join("\n\t"));

        async.eachSeries(
            steps,
            this._runTask.bind(this),
            function(err) {
                this._current = null;

                done(err);
            }.bind(this)
        );
    },

    // Public API
    run : function(steps, done) {
        var start = Date.now();

        // Support calling w/ only a callback
        if(typeof steps === "function") {
            done = steps;
            steps = null;
        }

        // select "default" step if steps is an object
        if(!steps) {
            steps = "default";
        }

        this._log("verbose", "Build starting");

        this._runSteps(steps, function(error) {
            this._log("build complete in " + time(Date.now() - start));

            if(typeof done === "function") {
                done(error);
            }
        }.bind(this));
    },
    
    test : function(steps, done) {
        this._test = true;
        
        this.run(steps, done);
    },
    
    addConfig : function(config) {
        var self = this,
            file, cwd;
        
        if(typeof config === "string") {
            file   = config;
            config = this._loadConfig(config);
        }
        
        cwd = config.cwd || process.cwd();

        if(config.dirs) {
            config.dirs.forEach(function findDirTasks(dir) {
                dir = path.resolve(config.cwd || process.cwd(), dir);

                self._findTasks(dir);
            });

            this._config.dirs = this._config.dirs.concat(config.dirs);
        }
        
        if(config.steps) {
            // Convert steps that are a single function or array into the
            // object format we use internally
            if(typeof config.steps !== "object" || Array.isArray(config.steps)) {
                config.steps = {
                    "default" : config.steps
                };
            }
        } else {
            config.steps = {};
        }
        
        // Merge this config into existing config
        // Ignoring keys we treated specially up above
        this._config = _.merge(
            this._config,
            _.omit(config, "dirs"),
            // Disable lodash's default array merging behavior,
            // see https://github.com/tivac/dullard/issues/15
            function disableMerging(a, b) {
                return Array.isArray(b) ? b : undefined;
            }
        );

        this.steps = this._config.steps;

        // Supporting merging in other .dullfiles
        if(config.includes) {
            if(file) {
                cwd = path.dirname(file);
            }

            config.includes.forEach(function addConfig(include) {
                self.addConfig(path.resolve(cwd, include));
            });
        }
    }
});

module.exports = Build;
