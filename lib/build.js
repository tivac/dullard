/*jshint node:true */

"use strict";

var path  = require("path"),
    
    async  = require("async"),
    wrench = require("wrench"),
    
    Build;
    
Build = function(config) {
    var self     = this,
        options  = {},
        dir      = process.cwd(),
        base     = path.resolve(__dirname, "../"),
        defaults = require("../args.json"),
        option;
    
    // Set up lookups
    this.tasks  = {};
    
    config || (config = {});
        
    // Parse optimist's args.json file & provide its defaults against
    // the config object
    for(option in defaults) {
        if(!(option in config) && ("default" in defaults[option])) {
            options[option] = defaults[option]["default"];
            
            continue;
        }
        
        if(option in config) {
            options[option] = config[option];
        }
    }
    
    options.tasks.forEach(function(dir) {
        self._loadTasks(path.resolve(base, dir));
    });
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
    
    invoke : function(tasks, done) {
        var self = this;
        
        async.eachSeries(
            tasks,
            function(step, cb) {
                var task = self.tasks[step];
                
                if(!task) {
                    return cb("Unknown task: " + step);
                }
                
                task(self, cb);
                
                // Non-async tasks only take one argument, the build instance
                if(task.length < 2) {
                    cb();
                }
            },
            done
        );
    }
};

module.exports = Build;
