/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    
    lib    = require("./_lib"),
    
    task   = require("../tasks/hash");
    

describe("Node web build", function() {
    describe("Task: Hash", function() {
        after(function() {
            lib.remove(path.join(__dirname, "temp"));
        });
        
        it("should have a description", function() {
            assert(task.description);
        });
        
        it("should handle glob failures", function(done) {
            var config = {
                    dirs : {
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {
                        "hash" : {
                            globError : true
                        }
                    }
                };
            
            task({ config : config }, function(err) {
                assert(err);
                
                done();
            });
        });
        
        it("should hash simple files", function(done) {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            task(
                { config : config },
                function(err) {
                    var files;
                    
                    assert.ifError(err);
                    
                    // Files should have been renamed
                    assert(!fs.existsSync(path.join(config.dirs.temp, "test.js")));
                    assert(!fs.existsSync(path.join(config.dirs.temp, "test.css")));
                    
                    // but they should still exist
                    assert.equal(fs.readdirSync(config.dirs.temp).length, 2);
                    
                    done();
                }
            );
        });
    });
});
