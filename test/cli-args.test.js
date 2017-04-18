"use strict";

var path   = require("path"),
    
    tester = require("cli-tester"),
    
    tests = require("./lib/tests.js");

describe("Dullard", function() {
    describe("CLI", function() {
        var cli = tester.bind(tester, require.resolve("../bin/cli.js")),
            cwd = process.cwd();

        afterEach(() => process.chdir(cwd));
        
        describe("--help", function() {
            it("should show help", function() {
                return cli("--help").then((out) => {
                    expect(out.code).toBe(0);
                    
                    expect(out.stdout).toMatchSnapshot();
                });
            });
        });

        describe("--list", function() {
            it("should describe available tasks", function() {
                process.chdir("./test/specimens/config-dirs");
                
                return cli("--list").then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });

            it("should handle no tasks state", function() {
                process.chdir("./test/specimens/config-blank");

                return cli("--list").then((out) =>
                    tests.success(out, `
                        info cli Config files loaded:
                        info cli
                        info cli     */config-blank/.dullfile
                        info cli
                        ERR! cli No tasks available.
                    `)
                );
            });
        });

        describe("--log/--silent/--verbose/--silly", function() {
            it("should support --silent", function() {
                process.chdir("./test/specimens/config-json");

                return cli("--silent").then((out) => {
                    expect(out).toMatchSnapshot();
                });
            });

            it("should support --log=silent", function() {
                process.chdir("./test/specimens/config-json");

                return cli("--log=silent").then((out) => {
                    expect(out).toMatchSnapshot();
                });
            });

            it("should support --silly", function() {
                process.chdir("./test/specimens/config-json");

                return cli("--silly").then((out) =>
                    tests.success(out, `
                        verb dullard Build starting
                        sill dullard Loaded configs
                        sill dullard    *.dullfile
                        verb b started
                        sill b hi
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should support --log=silly", function() {
                process.chdir("./test/specimens/config-json");

                return cli("--log=silly").then((out) =>
                    tests.success(out, `
                        verb dullard Build starting
                        sill dullard Loaded configs
                        sill dullard    *.dullfile
                        verb b started
                        sill b hi
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should support --verbose", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli("--verbose").then((out) =>
                    tests.success(out, `
                        verb dullard Build starting
                        verb b started
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should support --log=verbose", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli("--log=verbose").then((out) =>
                    tests.success(out, `
                        verb dullard Build starting
                        verb b started
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });
        });
        
        describe("--dirs/-d", function() {
            it("should support comma-separated --dirs via argv", function() {
                return cli(
                    "--dirs=./test/specimens/tasks-a,./test/specimens/tasks-b",
                    "--list"
                )
                .then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });

            it("should support multiple -d params via argv", function() {
                return cli(
                    "-d ./test/specimens/tasks-a",
                    "-d ./test/specimens/tasks-b",
                    "--list"
                )
                .then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });
        });

        describe("--config/-c", function() {
            it("should dump the combined config values", function() {
                process.chdir("./test/specimens/config-json");

                return cli("--config").then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });
        });
    });
});
