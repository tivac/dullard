/*jshint node:true */
"use strict";

var assert = require("assert"),
    stream = require("stream"),
    
    _      = require("lodash"),
    
    cli     = require("../lib/cli"),
    Dullard = require("../lib/dullard"),
    
    _root = process.cwd(),
    _argv = [,,],
    
    _dullard, _stream, _process;

_dullard = function(fn, proto) {
    var B;
    
    if(typeof fn === "object") {
        proto = fn;
        fn    = null;
    }
    
    B = fn || function() { Dullard.apply(this, Array.prototype.slice.call(arguments)); };
    B.prototype = Object.create(Dullard.prototype);
    B.prototype.constructor = B;
    
    _.extend(
        B.prototype,
        {
            run : function() {},
            on  : function() {}
        },
        proto || {}
    );
    
    return B;
};

_stream = function(write) {
    var s = new stream.Stream();
    
    s.write = write || function() {};
    
    return s;
};

_process = function(exit) {
    return {
        cwd : process.cwd,
        on  : function(ev, fn) {
            fn();
        },
        exit : exit || function() {}
    };
};

describe("Dullard", function() {
    describe("CLI", function() {
        
        afterEach(function() {
            process.chdir(_root);
        });
        
        it("should show help (& not run)", function() {
            cli({
                argv   : [].concat(_argv, "-?"),
                Dullard  : _dullard(function() {
                        assert(false, "Should not have been called!");
                    }),
                stream : _stream()
            });
        });
        
        it("should show available tasks (& not run)", function() {
            var msgs = "";
            
            cli({
                argv : [].concat(_argv, "-l", "-d", "./test/specimens/tasks-a/"),
                Dullard : _dullard({
                    run : function() {
                        assert(false, "Should not have been called!");
                    }
                }),
                stream : _stream(
                    function(msg) {
                        msgs += msg;
                    }
                )
            });
            
            assert(msgs.indexOf("a-async") > -1);
        });
        
        it("should complain if no tasks are available", function() {
            var result = "";
            
            cli({
                argv  : [].concat(_argv, "-l"),
                Dullard : Dullard,
                stream : _stream(
                    function(msg) {
                        result += msg;
                    }
                ),
                process : _process(function(code) {
                    assert.equal(code, 1);
                })
            });

            assert(result.indexOf("No tasks available") > -1);
        });
        
        it("shouldn't say anything when loglevel is \"silent\"", function() {
            cli({
                argv : [].concat(_argv, "--silent"),
                Dullard : Dullard,
                stream : _stream(
                    function(msg) {
                        assert(false, "Should not have been called");
                    }
                ),
                process : _process()
            });
        });
        
        it("should be chatty in verbose mode", function() {
            var result = "";
            
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv : [].concat(_argv, "--verbose"),
                Dullard : Dullard,
                stream : _stream(function(msg) {
                    result += msg;
                }),
                process : _process()
            });
            
            assert(/^verb/.test(result));
        });
              
        it("should create a config object", function() {
            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                }),
                stream : _stream()
            });
        });
        
        it("should find a local .dullfile containing JS", function() {
            process.chdir("./test/specimens/config-js");
            
            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert(config.dirs.length);
                    assert(config.steps.length);
                }),
                stream : _stream()
            });
        });
        
        it("should find a local .dullfile containing JSON", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert(config.dirs.length);
                    assert(config.steps.length);
                }),
                stream : _stream()
            });
        });
        
        it("should find all .dullfile files in parent directories", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");
            
            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert(config.root);
                    assert(config.fooga);
                    assert(config.wooga);
                    
                    assert.equal(config.dirs.length, 3);
                    assert(config.steps.length, 2);
                }),
                stream : _stream()
            });
        });
        
        it("should support multiple dirs passed on argv", function() {
            cli({
                argv  : [].concat(_argv, "-d", "./test/specimens/tasks-a,./test/specimens/tasks-b"),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                })
            });
        });
        
        it("should mix configs & argv, with argv taking precedence", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv  : [].concat(_argv, "-d", "../../../tasks-b/", "wooga", "booga"),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                }),
                stream : _stream()
            });
        });
        
        it("should mix configs & argv, setting arbitrary config values", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv  : [].concat(_argv, "--fooga=true", "--wooga=hello", "--booga.wooga.googa=1", "--nooga.yooga=1"),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.fooga, "true");
                    assert.equal(config.wooga, "hello");
                    assert("googa" in config.booga.wooga);
                    assert(config.booga.wooga.googa, 1);
                    assert("yooga" in config.nooga);
                    assert("looga" in config.nooga);
                }),
                stream : _stream()
            });
        });

        it("should not mix multiple \"steps\" when they are arrays", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");

            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert(config.steps.length);
                    assert.equal(config.steps[0], "c");
                    assert.equal(config.steps[1], "c-async");
                })
            });
        });

        it("should mix multiple \"steps\" when they are objects", function() {
            process.chdir("./test/specimens/config-objects/fooga");

            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert(Object.keys(config.steps).length);
                    assert.equal(config.steps["a-steps"].length, 1);
                    assert.equal(config.steps["a-steps"][0], "a");
                    
                    assert.equal(config.steps["b-steps"].length, 1);
                    assert.equal(config.steps["b-steps"][0], "b-async");
                    
                    assert.equal(config.steps["a-steps"].length, 1);
                    assert.equal(config.steps["c-steps"][0], "c");
                })
            });
        });
        
        it("should run steps passed in via argv", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv  : [].concat(_argv, "-d", "../../../tasks-b/", "wooga", "booga"),
                Dullard : _dullard({
                    run : function(steps) {
                        assert.equal(steps[0], "wooga");
                        assert.equal(steps[1], "booga");
                    }
                }),
                stream : _stream()
            });
        });
        
        it("should complain when a dullard fails", function() {
            var result = "";
            
            cli({
                argv : [].concat(_argv, "fooga"),
                Dullard : Dullard,
                stream : _stream(function(msg) {
                    result += msg;
                }),
                process : _process(function(code) {
                    assert.equal(code, 1);
                })
            });
            
            assert(result.indexOf("Build failed") > -1);
        });
        
        it("should respect --quiet", function() {
            process.chdir("./test/specimens/config-js");
            
            cli({
                argv : [].concat(_argv, "--quiet"),
                Dullard : Dullard,
                stream : _stream(
                    function(error) {
                        assert.ifError(error, "Should not have been called");
                    },
                    function(error) {
                        assert.ifError(error, "Should not have been called");
                    }
                )
            });
        });
        
        it("should handle mostly-empty configs", function() {
            process.chdir("./test/specimens/config-blank");
            
            cli({
                argv  : _argv,
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 0);
                    assert(!("steps" in config));
                }),
                stream : _stream()
            });
        });
        
        it("should log dullard lifecycle events", function() {
            var result = [];
            
            process.chdir("./test/specimens/config-js");
            
            cli({
                argv  : _argv,
                Dullard : _dullard({
                    run : function() {
                        this.emit("log", { level : "info", body : [ "fooga" ] });
                        this.emit("log", { level : "info", body : [ "booga %s", "wooga" ]});
                    },
                    on  : require("events").EventEmitter.prototype.on
                }),
                stream : _stream(
                    function(msg) {
                        result = result.concat(msg);
                    }
                )
            });
            
            assert(result.indexOf(" fooga\n") > -1);
            assert(result.indexOf(" booga wooga\n") > -1);
        });
    });
});
