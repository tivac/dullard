/*jshint node:true */

"use strict";

var path  = require("path"),
    
    async  = require("async"),
    wrench = require("wrench"),
    
    Build;
    
Build = function(config) {
    var self     = this,
        options  = {},
        base     = path.resolve(__dirname, "../"),
        defaults = require("../args.json"),
        option, tasks;
    
    config || (config = {});
    
    if(!config.root) {
        throw new Error("You must specify a root");
    }
    
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
    
    tasks = Array.isArray(options.tasks) && options.tasks.map(function(dir) {
        return path.resolve(base, dir);
    });
    
    // Set up lookups
    this.tasks  = {};
    this.config = {
        dirs : {
            root  : path.resolve(base, options.root),
            dest  : path.resolve(base, options.output),
            temp  : path.resolve(base, path.join("temp", path.basename(options.root))),
            tasks : [
                path.join(base, "tasks")
            ].concat(tasks || [])
        },
        tasks : {}
    };
    
    // Load all tasks
    this.config.dirs.tasks.forEach(function(dir) {
        self._tasks(dir);
    });
};

Build.prototype = {
    _tasks : function(dir) {
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
                
                self.task = step;
                
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
