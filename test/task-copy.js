/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    
    lib    = require("./_lib"),
    task   = require("../tasks/copy");
    

describe("Node web build", function() {
    describe("Task: Copy", function() {
        after(function() {
            lib.remove(path.join(__dirname, "temp"));
        });
        
        it("should have a description", function() {
            assert(task.description);
        });
        
        it("should copy simple files", function() {
            task({
                config : {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    }
                }
            });
            
            assert(fs.existsSync(path.join(__dirname, "temp", "simple")));
            assert(fs.existsSync(path.join(__dirname, "temp", "simple", "test.js")));
        });
    });
});
