/*jshint node:true */

"use strict";

var path   = require("path"),
    events = require("events"),

    _      = require("lodash"),
    async  = require("async"),
    glob   = require("glob"),
    time   = require("humanize-duration"),

    Build;

Build = function(config) {
    var self = this;

    events.EventEmitter.call(this);

    this.tasks  = {};

    if(!config) {
        config = {};
    }

    config.dullard = this;
    config.log     = this._log.bind(this);

    if(config.dirs) {
        config.dirs.forEach(function(dir) {
            dir = path.resolve(config.cwd || process.cwd(), dir);

            self._loadTasks(dir);
        });
    }

    this.steps = config.steps;

    this._config = config;
};

Build.prototype = Object.create(events.EventEmitter.prototype);

_.extend(Build.prototype, {
    constructor : Build,

    _loadTasks : function(dir) {
        var self  = this;

        glob.sync("*.js", { cwd : dir, maxDepth : 1 }).forEach(function(file) {
            var full  = path.join(dir, file),
                name  = path.basename(file, path.extname(file));

            self.tasks[name]        = require(full);
            self.tasks[name].source = full;
        });
    },

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

    run : function(steps, done) {
        var self     = this,
            startRun = Date.now();

        if(typeof steps === "function") {
            done = steps;
            steps = null;
        }

        if(typeof done !== "function") {
            done = function() {};
        }

        // select "default" step if steps is an object
        if(!steps && typeof this.steps === "object" && !Array.isArray(this.steps)) {
            steps = "default";
        }

        this._log("verbose", "Build starting");

        this._runSteps(steps, function(err) {
            self._log("build complete in " + time(Date.now() - startRun));

            done(err);
        });
    },

    _runSteps : function(steps, done) {
        var self = this;

        if(steps) {
            if(this.steps && steps in this.steps) {
                steps = this.steps[steps];
            } else if(steps in this.tasks) {
                steps = [ steps ];
            }
        } else {
            steps = this.steps;
        }

        if(!steps) {
            return done("No steps defined");
        }

        // Ensure we've got an array
        if(!Array.isArray(steps)) {
            steps = [ steps ];
        }

        async.eachSeries(
            steps,
            function(step, cb) {
                if(self.steps && !Array.isArray(self.steps) && (step in self.steps)) {
                    return self._runSteps(step, cb);
                }

                var type      = typeof step,
                    task      = (type === "function") ? step : self.tasks[step],
                    name      = (type === "function") ? step.name : step,
                    startTask = Date.now(),
                    result;

                if(!task) {
                    return cb("Unknown task: " + name);
                }

                self._current = name;

                self._log("verbose", "started");

                // support updating the config object by wrapping the async callback fn
                result = task(self._config, function(err, config) {
                    self._log("complete in " + time(Date.now() - startTask));

                    if(err) {
                        return cb(err);
                    }

                    // support tasks returning a completely new config object (should be rare!)
                    if(config) {
                        self._config = config;
                    }

                    cb();
                });

                // Non-async tasks only take one argument, the config instance
                if(task.length < 2) {
                    self._log("complete in " + time(Date.now() - startTask));

                    cb(result);
                }
            },
            function(err) {
                self._current = null;

                done(err);
            }
        );
    }
});

module.exports = Build;
