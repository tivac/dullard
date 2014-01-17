/*jshint node:true */
"use strict";

var assert = require("assert"),

    Build = require("../lib/build.js");

describe("Dullard", function() {
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
        
        it("should load tasks from specified directories", function() {
            var b1 = new Build({
                    dirs : [
                        "./test/specimens/tasks-a",
                    ]
                });
            
            assert(Object.keys(b1.tasks).length);
        });
        
        it("should only load top-level .js files as tasks", function() {
            var b1 = new Build({
                    dirs : [
                        "./test/specimens/tasks-a",
                    ]
                });

            assert.equal(Object.keys(b1.tasks).length, 2);
        });

        it("should handle no steps", function() {
            (new Build()).run(function(err) {
                assert(err);
            });
        });
        
        it("should support single-item steps", function() {
            var b1 = new Build({
                    steps : function step1() {
                        step = true;
                    }
                }),
                step;
            
            b1.run();
            assert(step);
        });
        
        it("should run steps", function() {
            var b1 = new Build({
                    steps : [
                        function step1() {
                            step = true;
                        }
                    ]
                }),
                step;
            
            b1.run();
            assert(step);
        });
        
        it("should pass a config object to steps", function() {
            var b1 = new Build({
                    steps : function step1(config) {
                        assert(config);
                    }
                });
            
            b1.run();
        });
        
        it("should put a `log` method on the config object", function() {
            var b1 = new Build({
                    steps : function step1(config) {
                        assert(config);
                        assert(config.log);
                        assert.equal(typeof config.log, "function");
                    }
                });
            
            b1.run();
        });
        
        it("should have a functioning `log` method on the config object", function() {
            var b1 = new Build({
                    steps : [
                        function step1(config) {
                            config.log("fooga");
                        },
                        function step2(config) {
                            config.log("info", "booga %s", "wooga")
                        }
                    ]
                }),
                result = [];
                
            b1.on("log", function(args) {
                result = result.concat(args.body);
            });
            
            b1.run();
            
            assert(result.indexOf("fooga") > -1);
            assert(result.indexOf("booga %s") > -1);
            assert(result.indexOf("wooga") > -1);
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
        
        it("should run the \"default\" step collection when given an object", function() {
            var b1 = new Build({
                    steps : {
                        "default" : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                }),
                step;
            
            b1.run();
            
            assert(step);
        });
        
        it("should support choosing a named step collection", function() {
            var b1 = new Build({
                    steps : {
                        "fooga" : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                }),
                step;
            
            b1.run("fooga");
            
            assert(step);
        });
        
        it("should support choosing a named step collection with a callback", function(done) {
            var b1 = new Build({
                    steps : {
                        "fooga" : [
                            function() {}
                        ]
                    }
                });
            
            b1.run("fooga", function() {
                assert(true);
                
                done();
            });
        });
        
        it("should let step collections appear in other step collections", function() {
            var b1 = new Build({
                    steps : {
                        "default" : [
                            "fooga"
                        ],
                        
                        "fooga" : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                }),
                step;
            
            b1.run();
            
            assert(step);
        });
        
        it("should run an array of steps passed to run()", function() {
            var b1 = new Build({
                    steps : {
                        "default" : [
                            "fooga"
                        ],
                        
                        "fooga" : function() {
                            fooga = true;
                        },
                        
                        "booga" : function() {
                            booga = true;
                        }
                    }
                }),
                fooga, booga;
            
            b1.run([ "fooga", "booga" ]);
            
            assert(fooga);
            assert(booga);
        });
        
        it("should run a single task passed to run()", function() {
            var b1 = new Build({
                    dirs : [
                        "./test/specimens/tasks-a"
                    ]
                });
            
            b1.run("a");
        });

        it("should supporting running the same task multiple times", function() {
            var b1 = new Build({
                    dirs : [
                        "./test/specimens/tasks-a"
                    ]
                });

            b1.run([ "a", "a" ]);
        });
    });
});
