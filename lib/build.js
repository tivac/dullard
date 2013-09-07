/*jshint node:true */

"use strict";

var path  = require("path"),
    
    async  = require("async"),
    wrench = require("wrench"),
    
    Build;
    
Build = function(config) {
    var self     = this,
        args     = require("../args.json"),
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

    config.tasks.forEach(function(dir) {
        dir = path.resolve(__dirname, dir);
        
        self._loadTasks(dir);
    });
    
    this.tasks = config.tasks;
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
                var task = self.tasks[step];
                
                if(!task) {
                    return cb("Unknown task: " + step);
                }
                
                task(self._config, cb);
                
                // Non-async tasks only take one argument, the config instance
                if(task.length < 2) {
                    cb();
                }
            },
            done
        );
    }
};

module.exports = Build;
