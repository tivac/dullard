"use strict";

var path = require("path"),
    
    tester = require("cli-tester"),
    
    tests = require("./lib/tests.js");

describe("Dullard", function() {
    describe("CLI", function() {
        var cli = tester.bind(tester, require.resolve("../bin/cli.js")),
            cwd = process.cwd();

        afterEach(() => process.chdir(cwd));

        describe("arbitrary argv values", function() {
            it("should set arbitrary config values", function() {
                process.chdir("./test/specimens/config-json");

                return cli(
                    "--argv=argv",
                    "--nested.nested.argv=argv",
                    "--nested.argv=argv",
                    "--config"
                )
                .then((out) =>
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
                    `)
                );
            });

            it("should override values from .dullfiles", function() {
                 process.chdir("./test/specimens/config-json");

                return cli(
                    "--nested.config-json=argv",
                    "--config"
                )
                .then((out) =>
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
                        info cli         "config-json": "argv"
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

        describe("argv tasks", function() {
            it("should support a single task", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli(
                    "b-async"
                )
                .then((out) =>
                    tests.success(out, `
                        info b-async complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should support multiple tasks", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli(
                    "b-async",
                    "b"
                )
                .then((out) =>
                    tests.success(out, `
                        info b-async complete in * seconds
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should support repeated tasks", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli(
                    "b-async",
                    "b",
                    "b-async"
                )
                .then((out) =>
                    tests.success(out, `
                        info b-async complete in * seconds
                        info b complete in * seconds
                        info b-async complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should return an error code on invalid tasks", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli(
                    "fooga"
                )
                .then((out) =>
                    tests.failure(out, `
                        ERR! fooga failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Unknown task: fooga
                    `)
                );
            });
        });

        describe("failures", function() {
            it("should complain if no tasks are available", function() {
                process.chdir("./test/specimens/config-blank");
                
                return cli().then((out) =>
                    tests.failure(out, `
                        ERR! dullard build failed in * seconds
                        ERR! dullard No tasks found
                    `)
                );
            });

            it("should handle missing tasks", function() {
                process.chdir("./test/specimens/config-missingtask");
                
                return cli().then((out) =>
                    tests.failure(out, `
                        info a complete in * seconds
                        ERR! missing failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Unknown task: missing
                    `)
                );
            });

            it("should support sync tasks that fail", function() {
                process.chdir("./test/specimens/config-tasks");
                
                return cli("fail-return").then((out) =>
                    tests.failure(out, `
                        ERR! fail-return failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Error
                    `)
                );
            });
            
            it("should support callback tasks that fail", function() {
                process.chdir("./test/specimens/config-tasks");
                
                return cli("fail-callback").then((out) =>
                    tests.failure(out, `
                        ERR! fail-callback failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Error
                    `)
                );
            });

            it("should support promise tasks that fail", function() {
                process.chdir("./test/specimens/config-tasks");
                
                return cli("fail-promise").then((out) =>
                    tests.failure(out, `
                        ERR! fail-promise failed
                        ERR! dullard build failed in * seconds
                        ERR! dullard Error
                    `)
                );
            });
        });

        describe(".dullfile locating", function() {
            it("should find a local .dullfile containing JS", function() {
                process.chdir("./test/specimens/config-js");

                return cli("--list").then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });
            
            it("should find a local .dullfile containing JSON", function() {
                process.chdir("./test/specimens/config-json");

                return cli("--list").then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });

            it("should find all .dullfile files in parent directories", function() {
                process.chdir("./test/specimens/config-deep/fooga/wooga");
                
                return cli("--list").then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });
        });

        describe("features", function() {
            it("should support inline functions as steps", function() {
                process.chdir("./test/specimens/config-tasks");

                return cli().then((out) =>
                    tests.success(out, `
                        info inline complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should log when a task completes", function() {
                process.chdir("./test/specimens/config-json");
                
                return cli().then((out) =>
                    tests.success(out, `
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });
            
            it("should support the `include` .dullfile key", function() {
                process.chdir("./test/specimens/config-include");
                
                return cli("--list").then((out) =>
                    tests.success(out, `
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
                    `)
                );
            });

            it("should support task aliases", function() {
                process.chdir("./test/specimens/config-alias");
                
                return cli().then((out) =>
                    tests.success(out, `
                        info a complete in * seconds
                        info b complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });

            it("should support modifying the config value", function() {
                process.chdir("./test/specimens/config-modify");
                
                return cli().then((out) =>
                    tests.success(out, `
                        info modify complete in * seconds
                        info report complete in * seconds
                        info dullard build complete in * seconds
                    `)
                );
            });
        });
    });
});
