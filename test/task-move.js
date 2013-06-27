/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    
    wrench = require("wrench"),
    
    move   = require("../tasks/move");
    

describe("Node web build", function() {
    describe("Task: Move", function() {
        after(function() {
            wrench.rmdirSyncRecursive(path.join(__dirname, "output"));
        });
        
        it("should have a description", function() {
            assert(move.description);
        });
        
        it("should move simple files", function() {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple"),
                        dest : path.join(__dirname, "output", "simple")
                    }
                };
            
            // Duplicate of the copy task, but whatever
            wrench.mkdirSyncRecursive(config.dirs.temp);
            wrench.copyDirSyncRecursive(config.dirs.root, config.dirs.temp, { forceDelete : true });
            
            move({ config : config });
            
            assert(fs.existsSync(path.join(__dirname, "output", "simple")));
            assert(fs.existsSync(path.join(__dirname, "output", "simple", "test.js")));
        });
    });
});
