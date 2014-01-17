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

            self._findTasks(dir);
        });
    }

    this.steps = config.steps;

    // Convert steps that are a single function or array into the
    // object format we use internally
    if(typeof this.steps !== "object" || Array.isArray(this.steps)) {
        this.steps = {
            "default" : this.steps
        };
    }

    this._config = config;
};

Build.prototype = Object.create(events.EventEmitter.prototype);

_.extend(Build.prototype, {
    constructor : Build,

    _findTasks : function(dir) {
        var self  = this;

        glob.sync("*.js", { cwd : dir, maxDepth : 1}).forEach(function(file) {
            var full  = path.join(dir, file),
                name  = path.basename(file, path.extname(file));

            self.tasks[name] = {
                source : full
            };
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

    _loadStep : function(step) {
        var source;

        if(typeof step === "function") {
            return step;
        }

        if(!(step in this.tasks)) {
            return;
        }

        // Step is already loaded
        if(typeof this.tasks[step] === "function") {
            return this.tasks[step];
        }

        // Save source off so it can be stuck back on
        source = this.tasks[step].source;
        
        this.tasks[step] = require(source);
        this.tasks[step].source = source;

        return this.tasks[step];
    },

    _runStep : function(step, done) {
        var self  = this,
            start = Date.now(),
            task,
            result;

        // Support aliases by recursing down the rabbit hole
        if(this.steps && step in this.steps) {
            return this._runSteps(step, done);
        }

        task = this._loadStep(step);

        if(!task) {
            return done("Unknown task: " + step);
        }

        this._current = task.name;

        this._log("verbose", "started");

        // Wrap the callback fn to support async tasks returning an updated the config
        // Store the result so that sync steps can error out by returning a value
        result = task(this._config, function(err, config) {
            self._log("complete in " + time(Date.now() - start));

            if(err) {
                return done(err);
            }

            if(config) {
                self._config = config;
            }

            done();
        });

        // Non-async tasks only take one argument, the config instance
        if(task.length < 2) {
            this._log("complete in " + time(Date.now() - start));

            done(result);
        }
    },

    _runSteps : function(steps, done) {
        if(this.steps && (steps in this.steps)) {
            steps = this.steps[steps];
        } else if(steps in this.tasks) {
            steps = [ steps ];
        }

        if(!steps) {
            return done("No steps defined");
        }

        if(!Array.isArray(steps)) {
            steps = [ steps ];
        }

        async.eachSeries(
            steps,
            this._runStep.bind(this),
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

        this._runSteps(steps, function(err) {
            this._log("build complete in " + time(Date.now() - start));

            if(typeof done === "function") {
                done(err);
            }
        }.bind(this));
    }
});

module.exports = Build;
