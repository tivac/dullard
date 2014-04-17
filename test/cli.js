/*jshint node:true */
"use strict";

var path   = require("path"),
    assert = require("assert"),
    
    cli      = require("../lib/cli"),
    Dullard  = require("../lib/dullard"),
    
    _dullard = require("./lib/_dullard"),
    _stream  = require("./lib/_stream"),
    _process = require("./lib/_process"),
    
    _root = process.cwd(),
    _argv = [,,];

describe("Dullard", function() {
    describe("CLI", function() {
        
        afterEach(function() {
            process.chdir(_root);
        });
        
        it("should show help (& not run)", function() {
            cli({
                argv    : [].concat(_argv, "-?"),
                Dullard : _dullard(function() {
                        assert(false, "Should not have been called!");
                    }),
                stream  : _stream(function(help) {
                    assert(help.indexOf("Options:") > -1);
                })
            });
        });

        it("should show version (& not run)", function() {
            cli({
                argv    : [].concat(_argv, "--version"),
                Dullard : _dullard(function() {
                        assert(false, "Should not have been called!");
                    }),
                stream  : _stream(function(version) {
                    assert(version.indexOf("dullard") > -1);
                })
            });
        });
        
        it("should show available tasks (& not run)", function() {
            var msgs = "";
            
            cli({
                argv    : [].concat(_argv, "-l", "-d", "./test/specimens/tasks-a/"),
                Dullard : _dullard({
                    run : function() {
                        assert(false, "Should not have been called!");
                    }
                }),
                stream  : _stream(
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
                argv    : [].concat(_argv, "-l"),
                Dullard : Dullard,
                stream  : _stream(
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
                argv    : [].concat(_argv, "--silent"),
                Dullard : Dullard,
                process : _process(),
                stream  : _stream(
                    function() {
                        assert(false, "Should not have been called");
                    }
                )
            });
        });
        
        it("should be chatty in verbose mode", function() {
            var result = "";
            
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv    : [].concat(_argv, "--verbose"),
                Dullard : Dullard,
                process : _process(),
                stream  : _stream(function(msg) {
                    result += msg;
                })
            });
            
            assert(/^verb/.test(result));
        });
              
        it("should create a config object", function() {
            cli({
                argv    : _argv,
                stream  : _stream(),
                Dullard : _dullard({
                    addConfig : function(config) {
                        assert(config);
                    }
                })
            });
        });
        
        it("should find a local .dullfile containing JS", function() {
            process.chdir("./test/specimens/config-js");
            
            cli({
                argv    : _argv,
                stream  : _stream(),
                Dullard : _dullard({
                    addConfig : function(config) {
                        assert(config);
                        
                        if(typeof config === "string") {
                            assert(config.indexOf(path.join("config-js", ".dullfile")) > -1);
                        }
                    }
                })
            });
        });
        
        it("should find a local .dullfile containing JSON", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv    : _argv,
                stream  : _stream(),
                Dullard : _dullard({
                    addConfig : function(config) {
                        assert(config);
                        
                        if(typeof config === "string") {
                            assert(config.indexOf(path.join("config-json", ".dullfile")) > -1);
                        }
                    }
                })
            });
        });
        
        it("should find all .dullfile files in parent directories", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");
            
            cli({
                argv    : _argv,
                stream  : _stream(),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert(config.root);
                    assert(config.fooga);
                    assert(config.wooga);
                    
                    assert.equal(config.dirs.length, 3);
                    assert(config.steps.length, 2);
                })
            });
        });
        
        it("should support multiple dirs passed on argv", function() {
            cli({
                argv    : [].concat(_argv, "-d", "./test/specimens/tasks-a,./test/specimens/tasks-b"),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                })
            });
        });
        
        it("should mix configs & argv, with argv taking precedence", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv    : [].concat(_argv, "-d", "../../../tasks-b/", "wooga", "booga"),
                stream : _stream(),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                })
            });
        });
        
        it("should mix configs & argv, setting arbitrary config values", function() {
            process.chdir("./test/specimens/config-json");
            
            cli({
                argv    : [].concat(_argv, "--fooga=true", "--wooga=hello", "--booga.wooga.googa=1", "--nooga.yooga=1"),
                stream  : _stream(),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.fooga, "true");
                    assert.equal(config.wooga, "hello");
                    assert("googa" in config.booga.wooga);
                    assert(config.booga.wooga.googa, 1);
                    assert("yooga" in config.nooga);
                    assert("looga" in config.nooga);
                })
            });
        });

        it("should not mix multiple \"steps\" when they are arrays", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");

            cli({
                argv    : _argv,
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
                argv    : _argv,
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
                stream : _stream(),
                Dullard : _dullard({
                    run : function(steps) {
                        assert.equal(steps[0], "wooga");
                        assert.equal(steps[1], "booga");
                    }
                })
            });
        });
        
        it("should complain when a dullard fails", function() {
            var result = "";
            
            cli({
                argv    : [].concat(_argv, "fooga"),
                Dullard : Dullard,
                stream  : _stream(function(msg) {
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
                argv    : [].concat(_argv, "--quiet"),
                Dullard : Dullard,
                stream  : _stream(
                    function(error) {
                        assert(!error, "Should not have been called");
                    }
                )
            });
        });
        
        it("should handle mostly-empty configs", function() {
            process.chdir("./test/specimens/config-blank");
            
            cli({
                argv    : _argv,
                stream  : _stream(),
                Dullard : _dullard(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 0);
                    assert(!("steps" in config));
                })
            });
        });
        
        it("should log dullard lifecycle events", function() {
            var result = [];
            
            process.chdir("./test/specimens/config-js");
            
            cli({
                argv    : _argv,
                Dullard : _dullard({
                    run : function() {
                        this.emit("log", { level : "info", body : [ "fooga" ] });
                        this.emit("log", { level : "info", body : [ "booga %s", "wooga" ]});
                    },
                    on  : require("events").EventEmitter.prototype.on
                }),
                stream  : _stream(
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
