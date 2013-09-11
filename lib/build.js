/*jshint node:true */

"use strict";

var path   = require("path"),
    events = require("events"),
    
    _      = require("lodash"),
    async  = require("async"),
    glob   = require("glob"),
    
    Build;
    
Build = function(config) {
    var self = this;
    
    events.EventEmitter.call(this);
        
    this.tasks  = {};
    
    if(!config) {
        config = {};
    }
    
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
        
        glob.sync("*.js", { cwd : dir, maxDepth : 1}).forEach(function(file) {
            var full  = path.join(dir, file),
                name  = path.basename(file, path.extname(file));
            
            self.tasks[name] = require(full);
        });
    },
    
    _log : function(args) {
        if(typeof args === "string") {
            args = { message : args };
        }
        
        if(args.duration) {
            args.duration = Date.now() - args.duration;
        }
        
        this.emit("log", args);
    },
    
    run : function(done) {
        var self     = this,
            startRun = Date.now();
        
        if(typeof done !== "function") {
            done = function() {};
        }
        
        if(!this.steps) {
            return done("No steps defined");
        }
        
        this._log("Build starting");
        
        async.eachSeries(
            this.steps,
            function(step, cb) {
                var type      = typeof step,
                    task      = (type === "function") ? step : self.tasks[step],
                    name      = (type === "function") ? step.name : step,
                    startTask = Date.now(),
                    result;
                
                if(!task) {
                    return cb("Unknown task: " + name);
                }
                
                self._log(name + " started");
                
                // support updating the config object by wrapping the async callback fn
                result = task(self._config, function(err, config) {
                    self._log({
                        message  : name + " complete",
                        duration : startTask
                    });
                    
                    if(err) {
                        return cb(err);
                    }
                    
                    if(config) {
                        self._config = config;
                    }
                    
                    cb();
                });
                
                // Non-async tasks only take one argument, the config instance
                if(task.length < 2) {
                    self._log({
                        message  : name + " complete",
                        duration : startTask
                    });
                    
                    cb(result);
                }
            },
            function(err) {
                self._log({
                    message  : "build complete",
                    duration : startRun
                });
                
                done(err);
            }
        );
    }
});

module.exports = Build;
