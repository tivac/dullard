/*jshint node:true */
"use strict";

var path   = require("path"),
    assert = require("assert"),

    Build = require("../lib/build.js");

describe("Node web build", function() {
    describe("Build Object", function() {
        it("should be instatiable", function() {
            assert(new Build({ root : "./specimens/simple/" }));
        });
        
        it("should throw if root isn't defined", function() {
            assert.throws(
                function() {
                    new Build();
                }
            );
        });
        
        it("should use the right defaults", function() {
            var b    = new Build({ root : "./test/specimens/simple" }),
                dirs = b.config.dirs,
                __base = path.resolve(__dirname, "../");
            
            assert.equal(dirs.root, path.join(__dirname, "specimens", "simple"));
            assert.equal(dirs.dest, path.join(__base, "output"));
            assert.equal(dirs.temp, path.join(__base, "temp", "simple"));
            
            assert.equal(dirs.tasks.internal, path.join(__base, "tasks"));
            assert.equal(dirs.tasks.custom, false);
        });
        
        it("should accept custom task dirs", function() {
            var b = new Build({
                    root  : "./test/specimens/simple",
                    tasks : "./test/specimens/tasks"
                });
            
            assert.equal(
                b.config.dirs.tasks.custom,
                path.join(__dirname, "specimens", "tasks")
            );
        });
        
        it("should invoke tasks", function(done) {
            var b = new Build({ root  : "." });
            
            b.tasks.test = function(config) {};
            
            b.invoke([ "test" ], done);
        });
        
        it("should error on invalid task names", function(done) {
            var b = new Build({ root  : "." });
            
            b.invoke([ "test" ], function(err) {
                assert(err);
                
                done();
            });
        });
        
        it("should run async tasks correctly", function(done) {
            var b = new Build({ root  : "." });
            
            b.tasks.async = function(config, done) { done(); };
            
            b.invoke([ "async" ], function(err) {
                done();
            });
        });
    });
});
