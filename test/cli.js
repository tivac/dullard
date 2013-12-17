/*jshint node:true */
"use strict";

var assert = require("assert"),
    stream = require("stream"),
    
    _      = require("lodash"),
    
    cli    = require("../lib/cli.js"),
    Build  = require("../lib/build.js"),
    
    _root = process.cwd(),
    _argv = [,,],
    
    _build, _stream, _process;

_build = function(fn, proto) {
    var B;
    
    if(typeof fn === "object") {
        proto = fn;
        fn    = null;
    }
    
    B = fn || function() { Build.apply(this, Array.prototype.slice.call(arguments)); };
    B.prototype = Object.create(Build.prototype);
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
            cli(
                [].concat(_argv, "-?"),
                _build(function() {
                    assert(false, "Should not have been called!");
                }),
                _stream()
            );
        });
        
        it("should show available tasks (& not run)", function() {
            var msgs = "";
            
            cli(
                [].concat(_argv, "-l", "-d", "./test/specimens/tasks-a/"),
                _build({
                    run : function() {
                        assert(false, "Should not have been called!");
                    }
                }),
                _stream(
                    function(msg) {
                        msgs += msg;
                    }
                )
            );
            
            assert(msgs.indexOf("a-async") > -1);
        });
        
        it("should complain if no tasks are available", function() {
            var result = "";
            
            cli(
                [].concat(_argv, "-l"),
                Build,
                _stream(
                    function(msg) {
                        result += msg;
                    }
                ),
                _process(function(code) {
                    assert.equal(code, 1);
                })
            );
            
            assert(result.indexOf("No tasks available") > -1);
        });
        
        it("shouldn't say anything when loglevel is \"silent\"", function() {
            cli(
                [].concat(_argv, "--silent"),
                Build,
                _stream(
                    function(msg) {
                        assert(false, "Should not have been called");
                    }
                ),
                _process()
            );
        });
        
        it("should be chatty in verbose mode", function() {
            var result = "";
            
            process.chdir("./test/specimens/config-json");
            
            cli(
                [].concat(_argv, "--verbose"),
                Build,
                _stream(function(msg) {
                    result += msg;
                }),
                _process()
            );
            
            assert(/^verb/.test(result));
        });
              
        it("should create a config object", function() {
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                }),
                _stream()
            );
        });
        
        it("should find a local .dullfile containing JS", function() {
            process.chdir("./test/specimens/config-js");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.dirs.length);
                    assert(config.steps.length);
                }),
                _stream()
            );
        });
        
        it("should find a local .dullfile containing JSON", function() {
            process.chdir("./test/specimens/config-json");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.dirs.length);
                    assert(config.steps.length);
                }),
                _stream()
            );
        });
        
        it("should find all .dullfile files in parent directories", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.root);
                    assert(config.fooga);
                    assert(config.wooga);
                    
                    assert.equal(config.dirs.length, 3);
                    assert(config.steps.length, 2);
                }),
                _stream()
            );
        });
        
        it("should support multiple dirs passed on argv", function() {
            cli(
                [].concat(_argv, "-d", "./test/specimens/tasks-a,./test/specimens/tasks-b"),
                _build(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                })
            );
        });
        
        it("should mix configs & argv, with argv taking precedence", function() {
            process.chdir("./test/specimens/config-json");
            
            cli(
                [].concat(_argv, "-d", "../../../tasks-b/", "wooga", "booga"),
                _build(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                }),
                _stream()
            );
        });
        
        it("should mix configs & argv, setting arbitrary config values", function() {
            process.chdir("./test/specimens/config-json");
            
            cli(
                [].concat(_argv, "--fooga=true", "--wooga=hello", "--booga.wooga.googa=1", "--nooga.yooga=1"),
                _build(function(config) {
                    assert(config);
                    
                    assert.equal(config.fooga, "true");
                    assert.equal(config.wooga, "hello");
                    assert("googa" in config.booga.wooga);
                    assert(config.booga.wooga.googa, 1);
                    assert("yooga" in config.nooga);
                    assert("looga" in config.nooga);
                }),
                _stream()
            );
        });

        it("should not mix multiple \"steps\" when they are arrays", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");

            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.steps.length);
                    assert.equal(config.steps[0], "c");
                    assert.equal(config.steps[1], "c-async");
                })
            );
        });

        it("should mix multiple \"steps\" when they are objects", function() {
            process.chdir("./test/specimens/config-objects/fooga");

            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(Object.keys(config.steps).length);
                    assert.equal(config.steps["a-steps"].length, 1);
                    assert.equal(config.steps["a-steps"][0], "a");
                    
                    assert.equal(config.steps["b-steps"].length, 1);
                    assert.equal(config.steps["b-steps"][0], "b-async");
                    
                    assert.equal(config.steps["a-steps"].length, 1);
                    assert.equal(config.steps["c-steps"][0], "c");
                })
            );
        });
        
        it("should run steps passed in via argv", function() {
            process.chdir("./test/specimens/config-json");
            
            cli(
                [].concat(_argv, "-d", "../../../tasks-b/", "wooga", "booga"),
                _build({
                    run : function(steps) {
                        assert.equal(steps[0], "wooga");
                        assert.equal(steps[1], "booga");
                    }
                }),
                _stream()
            );
        });
        
        it("should complain when a build fails", function() {
            var result = "";
            
            cli(
                [].concat(_argv, "fooga"),
                Build,
                _stream(function(msg) {
                    result += msg;
                }),
                _process(function(code) {
                    assert.equal(code, 1);
                })
            );
            
            assert(result.indexOf("Build failed") > -1);
        });
        
        it("should respect --quiet", function() {
            process.chdir("./test/specimens/config-js");
            
            cli(
                [].concat(_argv, "--quiet"),
                Build,
                _stream(
                    function(error) {
                        assert.ifError(error, "Should not have been called");
                    },
                    function(error) {
                        assert.ifError(error, "Should not have been called");
                    }
                )
            );
        });
        
        it("should handle mostly-empty configs", function() {
            process.chdir("./test/specimens/config-blank");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 0);
                    assert(!("steps" in config));
                }),
                _stream()
            );
        });
        
        it("should log build lifecycle events", function() {
            var result = "";
            
            process.chdir("./test/specimens/config-js");
            
            cli(
                _argv,
                _build({
                    run : function() {
                        this.emit("log", { level : "info", message : "fooga" });
                    },
                    on  : require("events").EventEmitter.prototype.on
                }),
                _stream(
                    function(msg) {
                        result += msg;
                    }
                )
            );
            
            assert(result.indexOf("fooga") > -1);
        });
    });
});
