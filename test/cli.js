/* eslint no-sparse-arrays: 0 */
"use strict";

var path   = require("path"),
    assert = require("assert"),
    
    Cli      = require("../lib/cli"),
    Dullard  = require("../lib/dullard"),
    
    _dullard = require("./lib/_dullard"),
    _stream  = require("./lib/_stream"),
    _process = require("./lib/_process"),
    
    _root = process.cwd(),
    _argv = [ , , ];

describe("Dullard", function() {
    describe("CLI", function() {
        
        afterEach(function() {
            process.chdir(_root);
        });
        
        it("should show help (& not run)", function() {
            var cli = new Cli({
                    argv    : [].concat(_argv, "-?"),
                    Dullard : _dullard(function() {
                            assert(false, "Should not have been called!");
                        }),
                    stream : _stream(function(help) {
                        assert(help.indexOf("Options:") > -1);
                    })
                });

            cli.run();
        });

        it("should show version (& not run)", function() {
            var cli = new Cli({
                    argv    : [].concat(_argv, "--version"),
                    Dullard : _dullard(function() {
                            assert(false, "Should not have been called!");
                        }),
                    stream : _stream(function(version) {
                        assert(version.indexOf("dullard") > -1);
                    })
                });

            cli.run();
        });
        
        it("should show available tasks (& not run)", function() {
            var msgs = "",
                cli  = new Cli({
                    argv    : [].concat(_argv, "-l", "-d", "./test/specimens/tasks-a/"),
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
            
            cli.run();
            assert(msgs.indexOf("a-async") > -1);
        });
        
        it("should complain if no tasks are available", function() {
            var result = "",
                cli    = new Cli({
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

            cli.run();
            assert(result.indexOf("No tasks available") > -1);
        });
        
        it("shouldn't say anything when loglevel is \"silent\"", function() {
            var cli = new Cli({
                    argv    : [].concat(_argv, "--silent"),
                    Dullard : Dullard,
                    process : _process(),
                    stream  : _stream(
                        function() {
                            assert(false, "Should not have been called");
                        }
                    )
                });

            cli.run();
        });
        
        it("should be chatty in verbose mode", function() {
            var result = "",
                cli;
            
            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv    : [].concat(_argv, "--verbose"),
                Dullard : Dullard,
                process : _process(),
                stream  : _stream(function(msg) {
                    result += msg;
                })
            });
            
            cli.run();
            
            assert(/^verb/m.test(result));
        });
        
        it("should be annoying in silly mode", function() {
            var result = "",
                cli;
            
            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv    : [].concat(_argv, "--silly"),
                Dullard : Dullard,
                process : _process(),
                stream  : _stream(function(msg) {
                    result += msg;
                })
            });
            
            cli.run();
            
            console.log(result);
            
            assert(/^sill/m.test(result));
        });
              
        it("should find a local .dullfile containing JS", function() {
            var configs = [],
                cli;

            process.chdir("./test/specimens/config-js");
            
            cli = new Cli({
                argv    : _argv,
                Dullard : _dullard({
                    addConfig : function(config) {
                        configs.push(config);
                    }
                })
            });

            cli.run();

            configs
                .filter(function(config) {
                    return typeof config === "string";
                })
                .forEach(function(config) {
                    assert(config);

                    assert(typeof config === "string");
                    assert(config.indexOf(path.join("config-js", ".dullfile")) > -1);
                });
        });
        
        it("should find a local .dullfile containing JSON", function() {
            var configs = [],
                cli;

            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv    : _argv,
                Dullard : _dullard({
                    addConfig : function(config) {
                        configs.push(config);
                    }
                })
            });

            cli.run();

            configs
                .filter(function(config) {
                    return typeof config === "string";
                })
                .forEach(function(config) {
                    assert(config);

                    assert(typeof config === "string");
                    assert(config.indexOf(path.join("config-json", ".dullfile")) > -1);
                });
        });
        
        it("should find all .dullfile files in parent directories", function() {
            var cli, result;

            process.chdir("./test/specimens/config-deep/fooga/wooga");
            
            cli = new Cli({
                argv    : _argv,
                Dullard : Dullard
            });

            result = cli._dullard();

            assert(result._config);
            
            assert(result._config.root);
            assert(result._config.fooga);
            assert(result._config.wooga);
            
            assert.equal(result._config.dirs.length, 3);
            assert(result._config.steps.default.length, 2);
        });
        
        it("should support multiple dirs passed on argv", function() {
            var cli = new Cli({
                    argv    : [].concat(_argv, "-d", "./test/specimens/tasks-a,./test/specimens/tasks-b"),
                    Dullard : Dullard
                }),
                result;

            result = cli._dullard();

            assert(result._config);
            
            assert.equal(result._config.dirs.length, 2);
        });
        
        it("should allow setting arbitrary config values from argv", function() {
            var cli, result;

            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv : [].concat(
                    _argv,
                    "--argv=argv",
                    "--nested.nested.argv=argv",
                    "--nested.argv=argv"
                ),
                Dullard : Dullard
            });

            result = cli._dullard();

            assert(result._config);
            
            assert.equal(result._config.argv, "argv");
            
            assert("nested" in result._config);
            assert("argv" in result._config.nested);
            assert.equal(result._config.nested.argv, "argv");

            assert("config-json" in result._config.nested);
            assert.equal(result._config.nested["config-json"], "config-json");

            assert("nested" in result._config.nested);
            assert("argv" in result._config.nested.nested);
            assert.equal(result._config.nested.nested.argv, "argv");
        });

        it("should run steps passed in via argv", function() {
            var result = "",
                cli;

            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv    : [].concat(_argv, "-d", "../tasks-a,../tasks-b", "b", "a"),
                Dullard : Dullard,
                stream  : _stream(function(msg) {
                    result += msg;
                }),
                process : _process()
            });

            cli.run();

            console.log(result);

            assert(result.indexOf("b complete") > -1);
            assert(result.indexOf("a complete") > -1);
        });
        
        it("should complain when a dullard fails", function() {
            var result = "",
                cli = new Cli({
                    argv    : [].concat(_argv, "fooga"),
                    Dullard : Dullard,
                    stream  : _stream(function(msg) {
                        result += msg;
                    }),
                    process : _process(function(code) {
                        assert.equal(code, 1);
                    })
                });
            
            cli.run();

            assert(result.indexOf("Build failed") > -1);
        });
        
        it("should respect --quiet", function() {
            var cli;

            process.chdir("./test/specimens/config-js");
            
            cli = new Cli({
                argv    : [].concat(_argv, "--quiet"),
                Dullard : Dullard,
                stream  : _stream(
                    function(error) {
                        assert(!error, "Should not have been called");
                    }
                )
            });

            cli.run();
        });
        
        it("should handle mostly-empty configs", function() {
            var cli, result;

            process.chdir("./test/specimens/config-blank");
            
            cli = new Cli({
                argv    : _argv,
                Dullard : Dullard
            });

            result = cli._dullard();
            
            assert(result._config);
            assert(result._config.steps);

            assert.equal(Object.keys(result._config.steps).length, 0);
            assert.equal(result._config.dirs.length, 0);
        });
        
        it("should log dullard lifecycle events", function() {
            var result = [],
                cli;
            
            process.chdir("./test/specimens/config-js");
            
            cli = new Cli({
                argv    : _argv,
                Dullard : _dullard({
                    on  : require("events").EventEmitter.prototype.on,
                    run : function() {
                        this.emit("log", { level : "info", body : [ "fooga" ] });
                        this.emit("log", { level : "info", body : [ "booga %s", "wooga" ]});
                    }
                }),
                stream : _stream(
                    function(msg) {
                        result = result.concat(msg);
                    }
                )
            });

            cli.run();
            
            assert(result.indexOf(" fooga\n") > -1);
            assert(result.indexOf(" booga wooga\n") > -1);
        });
        
        it("should pretend to execute in test mode", function() {
            var result = "",
                cli;
            
            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv    : [].concat(_argv, "--test"),
                Dullard : Dullard,
                process : _process(),
                stream  : _stream(function(msg) {
                    result += msg;
                })
            });
            
            cli.run();
            
            assert(/^WARN TEST RUN/m.test(result));
            assert(/faked in/.test(result));
        });
        
        it("should pretend to execute CLI tasks in test mode", function() {
            var result = "",
                cli;
            
            process.chdir("./test/specimens/config-json");
            
            cli = new Cli({
                argv    : [].concat(_argv, "--test", "b", "b-async"),
                Dullard : Dullard,
                process : _process(),
                stream  : _stream(function(msg) {
                    result += msg;
                })
            });
            
            cli.run();
            
            assert(/^WARN TEST RUN/m.test(result));
            assert(/b faked in/.test(result));
            assert(/b-async faked in/.test(result));
        });
    });
});
