/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    assert = require("assert"),
    
    async  = require("async"),
    
    lib    = require("./_lib"),
    task   = require("../tasks/compress-css");
    

describe("Node web build", function() {
    describe("Task: Compress CSS", function() {
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
                        "compress-css" : {
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
                        "compress-css" : {
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
        
        it("should compress CSS files using config.dirs.temp", function(done) {
            var config = {
                    dirs : {
                        root : path.join(__dirname, "specimens", "simple"),
                        temp : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.temp);
            
            async.series([
                function runTask(cb) {
                    task({ config : config }, cb);
                },
                
                function assertions(cb) {
                    var compressed = config.dirs.root.replace(
                            "specimens",
                            path.join("specimens", "compressed")
                        ),
                        specimen = fs.readFileSync(path.join(compressed, "test.css"), { encoding : "utf8" }),
                        built    = fs.readFileSync(path.join(config.dirs.temp, "test.css"), { encoding : "utf8" });
                    
                    assert.equal(built, specimen);
                    
                    cb();
                }
            ], function(err) {
                assert.ifError(err);
                
                done();
            });
        });

        it("should compress CSS files using config.dirs.static", function(done) {
            var config = {
                    dirs : {
                        root   : path.join(__dirname, "specimens", "simple"),
                        static : path.join(__dirname, "temp", "simple")
                    },
                    tasks : {}
                };
            
            lib.copy(config.dirs.root, config.dirs.static);
            
            async.series([
                function runTask(cb) {
                    task({ config : config }, cb);
                },
                
                function assertions(cb) {
                    var compressed = config.dirs.root.replace(
                            "specimens",
                            path.join("specimens", "compressed")
                        ),
                        specimen = fs.readFileSync(path.join(compressed, "test.css"), { encoding : "utf8" }),
                        built    = fs.readFileSync(path.join(config.dirs.static, "test.css"), { encoding : "utf8" });
                    
                    assert.equal(built, specimen);
                    
                    cb();
                }
            ], function(err) {
                assert.ifError(err);
                
                done();
            });
        });
    });
});
