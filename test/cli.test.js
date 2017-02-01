"use strict";

var path   = require("path"),
    assert = require("assert"),
    
    test = require("cli-tester"),
    
    text = require("./lib/text.js");

describe("Dullard", function() {
    describe.only("CLI", function() {
        var cli = require.resolve("../bin/cli.js"),
            cwd = process.cwd();

        afterEach(() => process.chdir(cwd));
        
        it("should support --help and show help", function() {
            return test(cli, "--help").then((out) => {
                assert.equal(out.code, 0);
                assert.equal(text(out.stdout), text(`
                    Let the computers do the boring stuff.
                      Usage
                          $ dullard <options> <task>, ..., <taskN>
                      Options
                          --help         Show this help
                          --dirs,    -d  Specify directories to load tasks from
                          --list,    -l  Show a list of available tasks
                          --test,    -t  Run in test mode, no tasks will be executed
                          --log,     -g  Specify log level, one of silly, verbose, info, warn, error, & silent
                          --quiet,   -q  Quiet logging
                          --silent,  -s  Really quiet logging
                          --verbose, -v  Verbose logging
                          --silly,   -y  REALLY verbose logging
                `));
            });
        });

        it("should support --list and show available tasks", function() {
            process.chdir("./test/specimens/config-dirs");
            
            return test(cli, "--list").then((out) => {
                assert.equal(out.code, 0);

                assert.equal(text(out.stderr), text(`
                    info cli Available Tasks:
                    info cli
                    info cli name   : a
                    info cli source : ./tasks/a.js
                    info cli desc   : Task description
                    info cli
                    info cli name   : a-async
                    info cli source : ./../tasks-a/a-async.js
                    info cli
                `))
            });
        });
        
        it("should complain if no tasks are available", function() {
            process.chdir("./test/specimens/config-blank");
            
            return test(cli).then((out) => {
                console.log(out);
            });
        });
        
        // it("shouldn't say anything when loglevel is \"silent\"", function() {
        //     var cli = new Cli({
        //             argv    : [].concat(_argv, "--silent"),
        //             Dullard : Dullard,
        //             process : _process(),
        //             stream  : _stream(
        //                 function() {
        //                     assert(false, "Should not have been called");
        //                 }
        //             )
        //         });

        //     cli.run();
        // });

        // it("should log when a task starts and stops", function() {
        //     var result = "",
        //         cli;
            
        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : _argv,
        //         Dullard : Dullard,
        //         process : _process(),
        //         stream  : _stream(function(msg) {
        //             result += msg;
        //         })
        //     });
            
        //     return cli.run().then(() => {
        //         assert(/^info b started$/m.test(result));
        //         assert(/^info b complete in/m.test(result));
        //     });
        // });
        
        // it("should be chatty in verbose mode", function() {
        //     var result = "",
        //         cli;
            
        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : [].concat(_argv, "--verbose"),
        //         Dullard : Dullard,
        //         process : _process(),
        //         stream  : _stream(function(msg) {
        //             result += msg;
        //         })
        //     });
            
        //     return cli.run().then(() =>
        //         assert(/^verb/m.test(result))
        //     );
        // });
        
        // it("should be annoying in silly mode", function() {
        //     var result = "",
        //         cli;
            
        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : [].concat(_argv, "--silly"),
        //         Dullard : Dullard,
        //         process : _process(),
        //         stream  : _stream(function(msg) {
        //             result += msg;
        //         })
        //     });
            
        //     return cli.run().then(() =>
        //         assert(/^sill/m.test(result))
        //     );
        // });
              
        // it("should find a local .dullfile containing JS", function() {
        //     var configs = [],
        //         cli;

        //     process.chdir("./test/specimens/config-js");
            
        //     cli = new Cli({
        //         argv    : _argv,
        //         Dullard : _dullard({
        //             addConfig : function(config) {
        //                 configs.push(config);
        //             }
        //         })
        //     });

        //     cli.run();

        //     configs
        //         .filter(function(config) {
        //             return typeof config === "string";
        //         })
        //         .forEach(function(config) {
        //             assert(config);

        //             assert(typeof config === "string");
        //             assert(config.indexOf(path.join("config-js", ".dullfile")) > -1);
        //         });
        // });
        
        // it("should find a local .dullfile containing JSON", function() {
        //     var configs = [],
        //         cli;

        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : _argv,
        //         Dullard : _dullard({
        //             addConfig : function(config) {
        //                 configs.push(config);
        //             }
        //         })
        //     });

        //     cli.run();

        //     configs
        //         .filter(function(config) {
        //             return typeof config === "string";
        //         })
        //         .forEach(function(config) {
        //             assert(config);

        //             assert(typeof config === "string");
        //             assert(config.indexOf(path.join("config-json", ".dullfile")) > -1);
        //         });
        // });
        
        // it("should find all .dullfile files in parent directories", function() {
        //     var cli, result;

        //     process.chdir("./test/specimens/config-deep/fooga/wooga");
            
        //     cli = new Cli({
        //         argv    : _argv,
        //         Dullard : Dullard
        //     });

        //     result = cli._dullard();

        //     assert(result._config);
            
        //     assert(result._config.root);
        //     assert(result._config.fooga);
        //     assert(result._config.wooga);
            
        //     assert.equal(result._config.dirs.length, 3);
        //     assert(result._config.steps.default.length, 2);
        // });
        
        // it("should support multiple dirs passed on argv", function() {
        //     var cli = new Cli({
        //             argv    : [].concat(_argv, "-d", "./test/specimens/tasks-a,./test/specimens/tasks-b"),
        //             Dullard : Dullard
        //         }),
        //         result;

        //     result = cli._dullard();

        //     assert(result._config);
            
        //     assert.equal(result._config.dirs.length, 2);
        // });
        
        // it("should allow setting arbitrary config values from argv", function() {
        //     var cli, result;

        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv : [].concat(
        //             _argv,
        //             "--argv=argv",
        //             "--nested.nested.argv=argv",
        //             "--nested.argv=argv"
        //         ),
        //         Dullard : Dullard
        //     });

        //     result = cli._dullard();

        //     assert(result._config);
            
        //     assert.equal(result._config.argv, "argv");
            
        //     assert("nested" in result._config);
        //     assert("argv" in result._config.nested);
        //     assert.equal(result._config.nested.argv, "argv");

        //     assert("config-json" in result._config.nested);
        //     assert.equal(result._config.nested["config-json"], "config-json");

        //     assert("nested" in result._config.nested);
        //     assert("argv" in result._config.nested.nested);
        //     assert.equal(result._config.nested.nested.argv, "argv");
        // });

        // it("should let argv config values override everything else", function() {
        //     var cli, result;

        //     process.chdir("./test/specimens/config-include");
            
        //     cli = new Cli({
        //         argv : [].concat(
        //             _argv,
        //             "--argv=argv",
        //             "--nested.config-js=argv"
        //         ),
        //         Dullard : Dullard
        //     });

        //     result = cli._dullard();

        //     assert(result._config);
            
        //     assert.equal(result._config.argv, "argv");
        //     assert.equal(result._config["config-js"], "config-js");
        //     assert.equal(result._config["config-include"], "config-include");
            
        //     assert.deepEqual(result._config.nested, {
        //         "config-js"      : "argv",
        //         "config-include" : "config-include"
        //     });
        // });

        // it("should run steps passed in via argv", function() {
        //     var result = "",
        //         cli;

        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : [].concat(_argv, "-d", "../tasks-a", "a"),
        //         Dullard : Dullard,
        //         process : _process(),
        //         stream  : _stream(function(msg) {
        //             result += msg;
        //         })
        //     });

        //     return cli.run().then(() =>
        //         assert(result.indexOf("a complete") > -1)
        //     );
        // });
        
        // it("should complain when a dullard fails", function() {
        //     var result = "",
        //         cli = new Cli({
        //             argv    : [].concat(_argv, "fooga"),
        //             Dullard : Dullard,
        //             stream  : _stream(function(msg) {
        //                 result += msg;
        //             }),
                    
        //             process : _process(function(code) {
        //                 assert.equal(code, 1);
        //             })
        //         });
            
        //     return cli.run().then(() =>
        //         assert(result.indexOf("Build failed") > -1)
        //     );
        // });
        
        // it("should respect --quiet", function() {
        //     var cli;

        //     process.chdir("./test/specimens/config-js");
            
        //     cli = new Cli({
        //         argv    : [].concat(_argv, "--quiet"),
        //         Dullard : Dullard,
        //         stream  : _stream(
        //             function(error) {
        //                 assert(!error, "Should not have been called");
        //             }
        //         )
        //     });

        //     cli.run();
        // });
        
        // it("should handle mostly-empty configs", function() {
        //     var cli, result;

        //     process.chdir("./test/specimens/config-blank");
            
        //     cli = new Cli({
        //         argv    : _argv,
        //         Dullard : Dullard
        //     });

        //     result = cli._dullard();
            
        //     assert(result._config);
        //     assert(result._config.steps);

        //     assert.equal(Object.keys(result._config.steps).length, 0);
        //     assert.equal(result._config.dirs.length, 0);
        // });
        
        // it("should log dullard lifecycle events", function() {
        //     var result = [],
        //         cli;
            
        //     process.chdir("./test/specimens/config-js");
            
        //     cli = new Cli({
        //         argv    : _argv,
        //         Dullard : _dullard({
        //             on  : require("events").EventEmitter.prototype.on,
        //             run : function() {
        //                 this.emit("log", { level : "info", body : [ "fooga" ] });
        //                 this.emit("log", { level : "info", body : [ "booga %s", "wooga" ] });
        //             }
        //         }),
        //         stream : _stream(
        //             function(msg) {
        //                 result = result.concat(msg);
        //             }
        //         )
        //     });

        //     cli.run();
            
        //     assert(result.indexOf(" fooga\n") > -1);
        //     assert(result.indexOf(" booga wooga\n") > -1);
        // });
        
        // it("should pretend to execute in test mode", function() {
        //     var result = "",
        //         cli;
            
        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : [].concat(_argv, "--test"),
        //         Dullard : Dullard,
        //         process : _process(),
        //         stream  : _stream(function(msg) {
        //             result += msg;
        //         })
        //     });
            
        //     return cli.run().then(() => {
        //         assert(/^WARN TEST RUN/m.test(result));
        //         assert(/faked in/.test(result));
        //     });
        // });
        
        // it("should pretend to execute CLI tasks in test mode", function() {
        //     var result = "",
        //         cli;
            
        //     process.chdir("./test/specimens/config-json");
            
        //     cli = new Cli({
        //         argv    : [].concat(_argv, "--test", "b"),
        //         Dullard : Dullard,
        //         process : _process(),
        //         stream  : _stream(function(msg) {
        //             result += msg;
        //         })
        //     });
            
        //     return cli.run().then(() => {
        //         assert(/^WARN TEST RUN/m.test(result));
        //         assert(/b faked in/.test(result));
        //     });
        // });
    });
});
