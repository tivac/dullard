/*jshint node:true */

"use strict";

var path  = require("path"),
    
    async  = require("async"),
    wrench = require("wrench"),
    
    Build;
    
Build = function(config) {
    var self = this,
        args = require("../args.json"),
        option;
    
    this.tasks  = {};
    
    if(!config) {
        config = {};
    }
    
    // Parse optimist's args.json file & provide its defaults against
    // the config object
    for(option in args) {
        if(option in config) {
            continue;
        }
        
        if("default" in args[option]) {
            config[option] = args[option]["default"];
        }
    }
    
    config.dirs.forEach(function(dir) {
        dir = path.resolve(config.cwd || process.cwd(), dir);
        
        self._loadTasks(dir);
    });
    
    this.steps = config.steps;
    
    this._config = config;
};

Build.prototype = {
    _loadTasks : function(dir) {
        var self  = this,
            files = wrench.readdirSyncRecursive(dir);
        
        files.forEach(function(file) {
            var name = path.basename(file, path.extname(file));
            
            self.tasks[name] = require(path.join(dir, file));
        });
    },
    
    run : function(done) {
        var self = this;
        
        async.eachSeries(
            this.steps,
            function(step, cb) {
                var task = (typeof step === "function") ? step : self.tasks[step],
                    result;
                
                if(!task) {
                    return cb("Unknown task: " + step);
                }
                
                // support updating the config object by wrapping the async callback fn
                result = task(self._config, function(err, config) {
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
                    cb(result);
                }
            },
            done
        );
    }
};

module.exports = Build;
