/*jshint node:true */
"use strict";

var assert = require("assert"),

    Dullard = require("../lib/dullard");

describe("Dullard", function() {
    describe("Main Class", function() {
        
        it("should be instantiable", function() {
            assert(new Dullard({}));
            assert(new Dullard());
        });
        
        it("should provide useful properties", function() {
            var d1 = new Dullard();
            
            assert("tasks" in d1);
            assert("steps" in d1);
            assert("_config" in d1);
        });
        
        it("should load tasks from specified directories", function() {
            var d1 = new Dullard({
                    dirs : [
                        "./test/specimens/tasks-a",
                    ]
                });
            
            assert(Object.keys(d1.tasks).length);
        });
        
        it("should only load top-level .js files as tasks", function() {
            var d1 = new Dullard({
                    dirs : [
                        "./test/specimens/tasks-a",
                    ]
                });

            assert.equal(Object.keys(d1.tasks).length, 2);
        });

        it("should handle no steps", function() {
            (new Dullard()).run(function(err) {
                assert(err);
            });
        });

        it("should handle invalid steps", function() {
            var d1 = new Dullard({
                    steps : {
                        default : null
                    }
                });

            d1.run(function(err) {
                assert(err);
            });
        });
        
        it("should support single-item steps", function() {
            var d1 = new Dullard({
                    steps : function step1() {
                        step = true;
                    }
                }),
                step;
            
            d1.run();
            assert(step);
        });
        
        it("should run steps", function() {
            var d1 = new Dullard({
                    steps : [
                        function step1() {
                            step = true;
                        }
                    ]
                }),
                step;
            
            d1.run();
            assert(step);
        });
        
        it("should pass a config object to steps", function() {
            var d1 = new Dullard({
                    steps : function step1(config) {
                        assert(config);
                    }
                });
            
            d1.run();
        });
        
        it("should put a `log` method on the config object", function() {
            var d1 = new Dullard({
                    steps : function step1(config) {
                        assert(config);
                        assert(config.log);
                        assert.equal(typeof config.log, "function");
                    }
                });
            
            d1.run();
        });
        
        it("should have a functioning `log` method on the config object", function() {
            var d1 = new Dullard({
                    steps : [
                        function step1(config) {
                            config.log("fooga");
                        },
                        function step2(config) {
                            config.log("info", "booga %s", "wooga");
                        }
                    ]
                }),
                result = [];
                
            d1.on("log", function(args) {
                result = result.concat(args.body);
            });
            
            d1.run();
            
            assert(result.indexOf("fooga") > -1);
            assert(result.indexOf("booga %s") > -1);
            assert(result.indexOf("wooga") > -1);
        });
        
        it("should fail on unknown step names", function() {
            var d1 = new Dullard({
                    steps : [
                        "fooga"
                    ]
                });
            
            d1.run(function(err) {
                assert(err);
            });
        });
        
        it("should call completion callback", function() {
            var d1 = new Dullard({
                    steps : [
                        function step1() {}
                    ]
                });
            
            d1.run(function() {
                assert(true);
            });
        });
        
        it("should call completion callback with errors", function() {
            var d1 = new Dullard({
                    steps : [
                        function step1() {
                            return "error";
                        }
                    ]
                });
            
            d1.run(function(err) {
                assert(err);
                assert.equal(err, "error");
            });
        });
        
        it("should run async steps in order", function(done) {
            var d1 = new Dullard({
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
            
            d1.run(function() {
                assert.equal(flag, "3");
                
                done();
            });
        });
        
        it("should call completion callback with errors from async steps", function(done) {
            var d1 = new Dullard({
                    steps : [
                        function (config, done) {
                            process.nextTick(function() {
                                done("error");
                            });
                        }
                    ]
                });
            
            d1.run(function(err) {
                assert(err);
                assert.equal(err, "error");
                
                done();
            });
        });
        
        it("should let steps override the config object", function() {
            var d1 = new Dullard({
                    steps : [
                        function (config, done) {
                            done(null, { fooga : true });
                        }
                    ]
                });
            
            d1.run();
            
            assert(d1._config.fooga);
            assert(!("steps" in d1._config));
        });
        
        it("should run the \"default\" step collection when given an object", function() {
            var d1 = new Dullard({
                    steps : {
                        "default" : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                }),
                step;
            
            d1.run();
            
            assert(step);
        });
        
        it("should support choosing a named step collection", function() {
            var d1 = new Dullard({
                    steps : {
                        "fooga" : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                }),
                step;
            
            d1.run("fooga");
            
            assert(step);
        });
        
        it("should support choosing a named step collection with a callback", function(done) {
            var d1 = new Dullard({
                    steps : {
                        "fooga" : [
                            function() {}
                        ]
                    }
                });
            
            d1.run("fooga", function() {
                assert(true);
                
                done();
            });
        });
        
        it("should let step collections appear in other step collections", function() {
            var d1 = new Dullard({
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
            
            d1.run();
            
            assert(step);
        });
        
        it("should run an array of steps passed to run()", function() {
            var d1 = new Dullard({
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
            
            d1.run([ "fooga", "booga" ]);
            
            assert(fooga);
            assert(booga);
        });
        
        it("should run a single task passed to run()", function() {
            var d1 = new Dullard({
                    dirs : [
                        "./test/specimens/tasks-a"
                    ]
                });
            
            d1.run("a");
        });

        it("should supporting running the same task multiple times", function() {
            var d1 = new Dullard({
                    dirs : [
                        "./test/specimens/tasks-a"
                    ]
                });

            d1.run([ "a", "a" ]);
        });
    });
});
