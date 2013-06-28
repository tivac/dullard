/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    
    lib    = require("./_lib"),
    
    task   = require("../tasks/move");
    

describe("Node web build", function() {
    describe("Task: Move", function() {
        after(function() {
            lib.remove(path.join(__dirname, "output"));
        });
        
        it("should have a description", function() {
            assert(task.description);
        });
        
        it("should move simple files", function() {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple"),
                        dest : path.join(__dirname, "output", "simple")
                    }
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            task({ config : config });
            
            assert(fs.existsSync(path.join(__dirname, "output", "simple")));
            assert(fs.existsSync(path.join(__dirname, "output", "simple", "test.js")));
        });
    });
});
