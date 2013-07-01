/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    
    async  = require("async"),
    
    lib    = require("./_lib"),
    task   = require("../tasks/compress-js");
    

describe("Node web build", function() {
    describe("Task: Compress JS", function() {
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
                        "compress-js" : {
                            globError : true
                        }
                    }
                };
            
            task({ config : config }, function(err) {
                assert(err);
                
                done();
            });
        });
        
        it("should handle file read failures", function(done) {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {
                        "compress-js" : {
                            fileError : true
                        }
                    }
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            task({ config : config }, function(err) {
                assert(err);
                
                done();
            });
        });
        
        it("should compress js files using config.dirs.temp", function(done) {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            task({ config : config }, function(err) {
                var compressed;
                
                assert.ifError(err);
                
                compressed = config.dirs.root.replace(
                    "specimens",
                    path.join("specimens", "compressed")
                );
                
                assert.equal(
                    fs.readFileSync(path.join(compressed, "test.js"), { encoding : "utf8" }),
                    fs.readFileSync(path.join(config.dirs.temp, "test.js"), { encoding : "utf8" })
                );
                
                done();
            });
        });

        it("should compress js files using config.dirs.static", function(done) {
            var config = {
                    dirs : {
                        root   : path.join(__dirname, "specimens", "simple"),
                        static : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.static);
            
            task({ config : config }, function(err) {
                var compressed;
                
                assert.ifError(err);
                
                compressed = config.dirs.root.replace(
                    "specimens",
                    path.join("specimens", "compressed")
                );
                
                assert.equal(
                    fs.readFileSync(path.join(compressed, "test.js"), { encoding : "utf8" }),
                    fs.readFileSync(path.join(config.dirs.static, "test.js"), { encoding : "utf8" })
                );
                
                done();
            });
        });

        it("should create a -debug.js unminified file", function(done) {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            task({ config : config }, function(err) {
                assert.ifError(err);
                
                assert.equal(
                    fs.readFileSync(path.join(config.dirs.root, "test.js"), { encoding : "utf8" }),
                    fs.readFileSync(path.join(config.dirs.temp, "test-debug.js"), { encoding : "utf8" })
                );
                
                done();
            });
        });

        it("should create a .map file", function(done) {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            task({
                config : config
            }, function(err) {
                
                assert.ifError(err);
                assert(fs.existsSync(path.join(config.dirs.temp, "test.map")));
                    
                done();
            });
        });
    });
});
