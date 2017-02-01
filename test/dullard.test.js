"use strict";

var assert = require("assert"),

    Dullard = require("../src/dullard");

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
            var step = false,

                d1 = new Dullard({
                    steps : function() {
                        step = true;
                    }
                });
            
            return d1.run().then(() => assert(step));
        });
        
        it("should run steps", function() {
            var step = false,

                d1 = new Dullard({
                    steps : [
                        function step1() {
                            step = true;
                        }
                    ]
                });
            
            return d1.run().then(() => assert(step));
        });
        
        it("should pass a config object to steps", function() {
            var d1 = new Dullard({
                    steps : function(config) {
                        assert(config);
                    }
                });
            
            return d1.run();
        });
        
        it("should put a `log` method on the config object", function() {
            var d1 = new Dullard({
                    steps : function(config) {
                        assert(config);
                        assert(config.log);
                        assert.equal(typeof config.log, "function");
                    }
                });
            
            return d1.run();
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
            
            return d1.run().then(function() {
                assert(result.indexOf("fooga") > -1);
                assert(result.indexOf("booga %s") > -1);
                assert(result.indexOf("wooga") > -1);
            });
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
        
        it("should call completion callback", function(done) {
            var d1 = new Dullard({
                    steps : [
                        function step1() {}
                    ]
                });
            
            d1.run(function() {
                assert(true);

                done();
            });
        });
        
        it("should call completion callback with errors", function(done) {
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

                done();
            });
        });
        
        it("should run async steps in order", function(done) {
            var flag = false,
                d1 = new Dullard({
                    steps : [
                        function step1() {
                            assert.equal(flag, false);
                            flag = "1";
                        },
                        
                        function step2(config, cb) {
                            assert.equal(flag, "1");
                            
                            process.nextTick(function() {
                                flag = "2";
                                
                                cb();
                            });
                        },
                        
                        function step3() {
                            assert.equal(flag, "2");
                            flag = "3";
                        }
                    ]
                });
            
            d1.run(function() {
                assert.equal(flag, "3");
                
                done();
            });
        });
        
        it("should call completion callback with errors from async steps", function(done) {
            var d1 = new Dullard({
                    steps : [
                        function(config, cb) {
                            process.nextTick(function() {
                                cb("error");
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
                        function(config, done) {
                            done(null, Object.assign(config, { fooga : true }));
                        }
                    ]
                });
            
            return d1.run().then(() =>
                assert(d1._config.fooga)
            );
        });
        
        it(`should run the "default" step collection when given an object`, function() {
            var step = false,
                
                d1 = new Dullard({
                    steps : {
                        default : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                });
            
            return d1.run().then(() => assert(step));
        });
        
        it("should support choosing a named step collection", function() {
            var step = false,
                
                d1 = new Dullard({
                    steps : {
                        fooga : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                });
            
            return d1.run("fooga").then(() => assert(step));
        });
        
        it("should support choosing a named step collection with a callback", function(done) {
            var d1 = new Dullard({
                    steps : {
                        fooga : [
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
            var step = false,
                
                d1 = new Dullard({
                    steps : {
                        default : [
                            "fooga"
                        ],
                        
                        fooga : [
                            function() {
                                step = true;
                            }
                        ]
                    }
                });
            
            return d1.run().then(() => assert(step));
        });
        
        it("should run an array of steps passed to run()", function() {
            var fooga = false,
                booga = true,

                d1 = new Dullard({
                    steps : {
                        default : [
                            "fooga"
                        ],
                        
                        fooga : function() {
                            fooga = true;
                        },
                        
                        booga : function() {
                            booga = true;
                        }
                    }
                });
            
            return d1.run([ "fooga", "booga" ]).then(() => {
                assert(fooga);
                assert(booga);
            });
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

        describe("Promise Support", function() {
            it("should support tasks returning a promise", function() {
                var d1 = new Dullard({
                        steps : [
                            () => new Promise((resolve, reject) =>
                                setTimeout(resolve, 10)
                            )
                        ]
                    });
                
                return d1.run().then(() => assert(true));
            });

            it("should support running promise tasks in order", function() {
                var order = [],

                    d1 = new Dullard({
                        steps : [
                            () => new Promise((resolve, reject) =>
                                setTimeout(() => {
                                    order.push(1);
                                    
                                    resolve();
                                }, 10)
                            ),

                            () => new Promise((resolve, reject) =>
                                setTimeout(() => {
                                    order.push(2);
                                    
                                    resolve();
                                }, 10)
                            )
                        ]
                    });
                
                return d1.run().then(() =>
                    assert.deepEqual(order, [ 1, 2 ])
                );
            });
            
            it("should return a rejected promise if a task returns a rejected promise", function() {
                var d1 = new Dullard({
                        steps : [
                            () => new Promise((resolve, reject) => reject("error"))
                        ]
                    });
                
                return d1.run().catch((err) => {
                    assert(err);
                    assert.equal(err, "error");
                });
            });

            it("should return a rejected promise if a sync task fails", function() {
                var d1 = new Dullard({
                        steps : [
                            function() {
                                return "error";
                            }
                        ]
                    });
                
                return d1.run().catch((err) => {
                    assert(err);
                    assert.equal(err, "error");
                });
            });
        });
    });
});
