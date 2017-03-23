"use strict";

var path   = require("path"),
    
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
                    expect(out.code).toBe(0);
                    
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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

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
                    expect(out.code).toBe(0);

                    tests.wildcard(out.stderr, `
                        WARN cli TEST RUN
                        info b complete
                        info dullard build complete in * seconds
                    `);
                });
            });
        });
    });
});
