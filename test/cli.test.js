"use strict";

var path   = require("path"),
    assert = require("assert"),
    
    tester = require("cli-tester"),
    
    tests = require("./lib/tests.js");

describe("Dullard", function() {
    describe("CLI", function() {
        var cli = require.resolve("../bin/cli.js"),
            cwd = process.cwd();

        afterEach(() => process.chdir(cwd));
        
        describe("--help", function() {
            it("should show help", function() {
                return tester(cli, "--help").then((out) => {
                    assert.equal(out.code, 0);
                    
                    tests.text(out.stdout, `
                        Let the computers do the boring stuff.
                          Usage
                              $ dullard <options> <task>, ..., <taskN>
                          Options
                              --help         Show this help
                              --dirs,    -d  Specify directories to load tasks from
                              --list,    -l  Show a list of available tasks
                              --test,    -t  Run in test mode, no tasks will be executed
                              --config,  -c  Output final assembled config for debugging
                              --silent,  -s  No output
                              --verbose, -v  Verbose logging
                              --silly,   -y  REALLY verbose logging
                              --log,     -g  Specify log level, one of silly, verbose, info, warn, error, & silent
                    `);
                });
            });
        });

        describe("--list", function() {
            it("should describe available tasks", function() {
                process.chdir("./test/specimens/config-dirs");
                
                return tester(cli, "--list").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Config files loaded:
                        info cli
                        info cli     */config-dirs/.dullfile
                        info cli     */config-js/.dullfile
                        info cli
                        info cli Available Tasks:
                        info cli
                        info cli name   : a
                        info cli source : ./tasks/a.js
                        info cli desc   : Task description
                        info cli
                        info cli name   : a-async
                        info cli source : ./../tasks-a/a-async.js
                        info cli
                    `);
                });
            });

            it("should handle no tasks state", function() {
                process.chdir("./test/specimens/config-blank");

                return tester(cli, "--list").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Config files loaded:
                        info cli
                        info cli     */config-blank/.dullfile
                        info cli
                        ERR! cli No tasks available.
                    `);
                });
            });
        });

        describe("--log/--silent/--verbose/--silly", function() {
            it("should support --silent", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--silent").then((out) => {
                    assert.deepEqual(out, {
                        code   : 0,
                        stderr : "",
                        stdout : ""
                    });
                });
            });

            it("should support --log=silent", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--log=silent").then((out) => {
                    assert.deepEqual(out, {
                        code   : 0,
                        stderr : "",
                        stdout : ""
                    });
                });
            });

            it("should support --silly", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--silly").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        verb dullard Build starting
                        sill dullard Loaded configs
                        sill dullard    *.dullfile
                        verb b started
                        sill b hi
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should support --log=silly", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--log=silly").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        verb dullard Build starting
                        sill dullard Loaded configs
                        sill dullard    *.dullfile
                        verb b started
                        sill b hi
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should support --verbose", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli, "--verbose").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        verb dullard Build starting
                        verb b started
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should support --log=verbose", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli, "--log=verbose").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        verb dullard Build starting
                        verb b started
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });
        });
        
        describe("--dirs/-d", function() {
            it("should support comma-separated --dirs via argv", function() {
                return tester(
                    cli,
                    "--dirs=./test/specimens/tasks-a,./test/specimens/tasks-b",
                    "--list"
                )
                .then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Available Tasks:
                        info cli
                        info cli name   : a
                        info cli source : ./test/specimens/tasks-a/a.js
                        info cli desc   : Task description
                        info cli
                        info cli name   : a-async
                        info cli source : ./test/specimens/tasks-a/a-async.js
                        info cli
                        info cli name   : b
                        info cli source : ./test/specimens/tasks-b/b.js
                        info cli
                        info cli name   : b-async
                        info cli source : ./test/specimens/tasks-b/b-async.js
                        info cli
                    `);
                });
            });

            it("should support multiple -d params via argv", function() {
                return tester(
                    cli,
                    "-d ./test/specimens/tasks-a",
                    "-d ./test/specimens/tasks-b",
                    "--list"
                )
                .then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Available Tasks:
                        info cli
                        info cli name   : a
                        info cli source : ./test/specimens/tasks-a/a.js
                        info cli desc   : Task description
                        info cli
                        info cli name   : a-async
                        info cli source : ./test/specimens/tasks-a/a-async.js
                        info cli
                        info cli name   : b
                        info cli source : ./test/specimens/tasks-b/b.js
                        info cli
                        info cli name   : b-async
                        info cli source : ./test/specimens/tasks-b/b-async.js
                        info cli
                    `);
                });
            });
        });

        describe("--config/-c", function() {
            it("should dump the combined config values", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--config").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Generated config object:
                        info cli
                        info cli {
                        info cli     "cwd": "*config-json",
                        info cli     "dirs": [
                        info cli         "*tasks-b"
                        info cli     ],
                        info cli     "files": [
                        info cli         "*.dullfile"
                        info cli     ],
                        info cli     "nested": {
                        info cli         "config-json": "config-json"
                        info cli     },
                        info cli     "config-json": "config-json",
                        info cli     "steps": {
                        info cli         "default": [
                        info cli             "b"
                        info cli         ]
                        info cli     }
                        info cli }
                    `);
                });
            });
        });

        describe("--test/-t", function() {
            it("should pretend to run tasks", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--test").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        WARN cli TEST RUN
                        info b complete
                        info dullard build complete in * seconds
                    `);
                });
            });
        });

        describe("arbitrary argv values", function() {
            it("should set arbitrary config values", function() {
                process.chdir("./test/specimens/config-json");

                return tester(
                    cli,
                    "--argv=argv",
                    "--nested.nested.argv=argv",
                    "--nested.argv=argv",
                    "--config"
                )
                .then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Generated config object:
                        info cli
                        info cli {
                        info cli     "cwd": "*config-json",
                        info cli     "dirs": [
                        info cli         "*tasks-b"
                        info cli     ],
                        info cli     "files": [
                        info cli         "*.dullfile"
                        info cli     ],
                        info cli     "nested": {
                        info cli         "config-json": "config-json",
                        info cli         "nested": {
                        info cli             "argv": "argv"
                        info cli         },
                        info cli         "argv": "argv"
                        info cli     },
                        info cli     "config-json": "config-json",
                        info cli     "steps": {
                        info cli         "default": [
                        info cli             "b"
                        info cli         ]
                        info cli     },
                        info cli     "argv": "argv"
                        info cli }
                    `);
                });
            });

            it("should override values from .dullfiles", function() {
                 process.chdir("./test/specimens/config-json");

                return tester(
                    cli,
                    "--nested.config-json=argv",
                    "--config"
                )
                .then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Generated config object:
                        info cli
                        info cli {
                        info cli     "cwd": "*config-json",
                        info cli     "dirs": [
                        info cli         "*tasks-b"
                        info cli     ],
                        info cli     "files": [
                        info cli         "*.dullfile"
                        info cli     ],
                        info cli     "nested": {
                        info cli         "config-json": "argv"
                        info cli     },
                        info cli     "config-json": "config-json",
                        info cli     "steps": {
                        info cli         "default": [
                        info cli             "b"
                        info cli         ]
                        info cli     }
                        info cli }
                    `);
                });
            });
        });

        describe("argv tasks", function() {
            it("should support a single task", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli, "b-async").then((out) => {
                    assert.equal(out.code, 0);
                    
                    tests.wildcard(out.stderr, `
                        info b-async complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should support multiple tasks", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli, "b-async", "b").then((out) => {
                    assert.equal(out.code, 0);
                    
                    tests.wildcard(out.stderr, `
                        info b-async complete in * seconds
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should support repeated tasks", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli, "b-async", "b", "b-async").then((out) => {
                    assert.equal(out.code, 0);
                    
                    tests.wildcard(out.stderr, `
                        info b-async complete in * seconds
                        info b complete in * seconds
                        info b-async complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should return an error code on invalid tasks", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli, "fooga").then((out) => {
                    assert.equal(out.code, 1);
                    
                    tests.wildcard(out.stderr, `
                        ERR! fooga failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Unknown task: fooga
                    `);
                });
            });
        });

        describe("failures", function() {
            it("should complain if no tasks are available", function() {
                process.chdir("./test/specimens/config-blank");
                
                return tester(cli).then((out) => {
                    assert.equal(out.code, 1);

                    tests.wildcard(out.stderr, `
                        ERR! dullard build failed in * seconds
                        ERR! dullard No tasks found
                    `);
                });
            });

            it("should handle missing tasks", function() {
                process.chdir("./test/specimens/config-missingtask");
                
                return tester(cli).then((out) => {
                    assert.equal(out.code, 1);
                    
                    tests.wildcard(out.stderr, `
                        info a complete in * seconds
                        ERR! missing failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Unknown task: missing
                    `);
                });
            });

            it("should support sync tasks that fail", function() {
                process.chdir("./test/specimens/config-tasks");
                
                return tester(cli, "fail-return").then((out) => {
                    assert.equal(out.code, 1);
                    
                    tests.wildcard(out.stderr, `
                        ERR! fail-return failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Error
                    `);
                });
            });
            
            it("should support callback tasks that fail", function() {
                process.chdir("./test/specimens/config-tasks");
                
                return tester(cli, "fail-callback").then((out) => {
                    assert.equal(out.code, 1);
                    
                    tests.wildcard(out.stderr, `
                        ERR! fail-callback failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Error
                    `);
                });
            });

            it("should support promise tasks that fail", function() {
                process.chdir("./test/specimens/config-tasks");
                
                return tester(cli, "fail-promise").then((out) => {
                    assert.equal(out.code, 1);
                    
                    tests.wildcard(out.stderr, `
                        ERR! fail-promise failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Error
                    `);
                });
            });
        });

        describe(".dullfile locating", function() {
            it("should find a local .dullfile containing JS", function() {
                process.chdir("./test/specimens/config-js");

                return tester(cli, "--list").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Config files loaded:
                        info cli
                        info cli    */config-js/.dullfile
                        info cli
                        info cli Available Tasks:
                        info cli
                        info cli name   : a
                        info cli source : ./../tasks-a/a.js
                        info cli desc   : Task description
                        info cli
                        info cli name   : a-async
                        info cli source : ./../tasks-a/a-async.js
                        info cli
                    `);
                });
            });
            
            it("should find a local .dullfile containing JSON", function() {
                process.chdir("./test/specimens/config-json");

                return tester(cli, "--list").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Config files loaded:
                        info cli
                        info cli    */config-json/.dullfile
                        info cli
                        info cli Available Tasks:
                        info cli
                        info cli name   : b
                        info cli source : ./../tasks-b/b.js
                        info cli
                        info cli name   : b-async
                        info cli source : ./../tasks-b/b-async.js
                        info cli
                    `);
                });
            });

            it("should find all .dullfile files in parent directories", function() {
                process.chdir("./test/specimens/config-deep/fooga/wooga");
                
                return tester(cli, "--list").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Config files loaded:
                        info cli
                        info cli    */config-deep/.dullfile
                        info cli    */config-deep/fooga/.dullfile
                        info cli    */config-deep/fooga/wooga/.dullfile
                        info cli
                        info cli Available Tasks:
                        info cli
                        info cli name   : a
                        info cli source : ./../../../tasks-a/a.js
                        info cli desc   : Task description
                        info cli
                        info cli name   : a-async
                        info cli source : ./../../../tasks-a/a-async.js
                        info cli
                        info cli name   : b
                        info cli source : ./../../../tasks-b/b.js
                        info cli
                        info cli name   : b-async
                        info cli source : ./../../../tasks-b/b-async.js
                        info cli
                        info cli name   : c
                        info cli source : ./../../../tasks-c/c.js
                        info cli
                        info cli name   : c-async
                        info cli source : ./../../../tasks-c/c-async.js
                        info cli
                    `);
                });
            });
        });

        describe("features", function() {
            it("should support inline functions as steps", function() {
                process.chdir("./test/specimens/config-tasks");

                return tester(cli).then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info inline complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });

            it("should log when a task completes", function() {
                process.chdir("./test/specimens/config-json");
                
                return tester(cli).then((out) => {
                    assert.equal(out.code, 0);
                    
                    tests.wildcard(out.stderr, `
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });
            
            it("should support the `include` .dullfile key", function() {
                process.chdir("./test/specimens/config-include");
                
                return tester(cli, "--list").then((out) => {
                    assert.equal(out.code, 0);

                    tests.wildcard(out.stderr, `
                        info cli Config files loaded:
                        info cli
                        info cli     */config-include/.dullfile
                        info cli     */config-js/.dullfile
                        info cli
                        info cli Available Tasks:
                        info cli
                        info cli name   : a
                        info cli source : ./../tasks-a/a.js
                        info cli desc   : Task description
                        info cli
                        info cli name   : a-async
                        info cli source : ./../tasks-a/a-async.js
                        info cli
                    `);
                });
            });

            it("should support task aliases", function() {
                process.chdir("./test/specimens/config-alias");
                
                return tester(cli).then((out) => {
                    assert.equal(out.code, 0);
                    
                    tests.wildcard(out.stderr, `
                        info a complete in * seconds
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `);
                });
            });
        });
    });
});
