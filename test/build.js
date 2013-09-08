/*jshint node:true */
"use strict";

var path   = require("path"),
    assert = require("assert"),

    Build = require("../lib/build.js");

describe("node-web-build", function() {
    describe("Build Class", function() {
        
        it("should be instantiable", function() {
            assert(new Build({}));
            assert(new Build());
        });
        
        it("should provide useful properties", function() {
            var b1 = new Build();
            
            assert("tasks" in b1);
            assert("steps" in b1);
            assert("_config" in b1);
        });
        
        it("should provide defaults from args.json", function() {
            var b1 = new Build(),
                b2 = new Build({ quiet : true });
            
            assert(Array.isArray(b1._config.dirs));
            assert(!b1._config.quiet);
            assert(b2._config.quiet);
        });
        
        it("should load tasks from specified directories", function() {
            var b1 = new Build({
                    dirs : [
                        "./test/specimens/tasks-a",
                    ]
                });
            
            assert(Object.keys(b1.tasks).length);
        });
        
        it("should run steps", function() {
            var b1 = new Build({
                    steps : [
                        function step1() {
                            assert(true);
                        }
                    ]
                });
            
            b1.run();
        });
        
        it("should fail on unknown step names", function() {
            var b1 = new Build({
                    steps : [
                        "fooga"
                    ]
                });
            
            b1.run(function(err) {
                assert(err);
            });
        });
        
        it("should call completion callback", function() {
            var b1 = new Build({
                    steps : [
                        function step1() {}
                    ]
                });
            
            b1.run(function() {
                assert(true);
            });
        });
        
        it("should call completion callback with errors", function() {
            var b1 = new Build({
                    steps : [
                        function step1() {
                            return "error";
                        }
                    ]
                });
            
            b1.run(function(err) {
                assert(err);
                assert.equal(err, "error");
            });
        });
        
        it("should run async steps in order", function(done) {
            var b1 = new Build({
                    steps : [
                        function step1() {
                            assert.equal(flag, undefined);
                            flag = "1";
                        },
                        
                        function step2(config, done) {
                            assert.equal(flag, "1");
                            
                            process.nextTick(function() {
                                flag = "2";
                                
                                done();
                            });
                        },
                        
                        function step3() {
                            assert.equal(flag, "2");
                            flag = "3";
                        }
                    ]
                }),
                flag;
            
            b1.run(function() {
                assert.equal(flag, "3");
                
                done();
            });
        });
        
        it("should call completion callback with errors from async steps", function(done) {
            var b1 = new Build({
                    steps : [
                        function (config, done) {
                            process.nextTick(function() {
                                done("error");
                            });
                        }
                    ]
                });
            
            b1.run(function(err) {
                assert(err);
                assert.equal(err, "error");
                
                done();
            });
        });
        
        it("should let steps override the config object", function() {
            var b1 = new Build({
                    steps : [
                        function (config, done) {
                            done(null, { fooga : true });
                        }
                    ]
                });
            
            b1.run();
            
            assert(b1._config.fooga);
            assert(!("steps" in b1._config));
        });
    });
});
