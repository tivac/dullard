"use strict";

var path   = require("path"),
    assert = require("assert"),

    Dullard = require("../src/dullard");

describe("Dullard", function() {
    describe(".addConfig()", function() {
        it("should add an object into its config", function() {
            var d = new Dullard();

            d.addConfig({
                dirs : [
                    path.resolve(__dirname, "./specimens/tasks-a")
                ],

                object : "object",
                nested : {
                    object : "object"
                }
            });

            assert.equal(Object.keys(d.tasks).length, 2);
            assert("a-async" in d.tasks);
            assert("a" in d.tasks);

            assert("object" in d._config);
            assert.equal(d._config.object, "object");
            assert("nested" in d._config);
            assert("object" in d._config.nested);
            assert.equal(d._config.nested.object, "object");

            assert(d._config.dirs.length);
            assert(d._config.dirs[0].indexOf(path.join("specimens", "tasks-a")) > -1);
        });

        it("should treat a string config as a file path & add it into its config", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-json/.dullfile"));

            assert.equal(Object.keys(d.tasks).length, 2);
            assert("b-async" in d.tasks);
            assert("b" in d.tasks);

            assert.equal(d.steps.default[0], "b");

            assert("config-json" in d._config);
            assert.equal(d._config["config-json"], "config-json");
            assert("nested" in d._config);
            assert("config-json" in d._config.nested);
            assert.equal(d._config.nested["config-json"], "config-json");

            assert(d._config.dirs.length);
            assert(d._config.dirs[0].indexOf(path.join("specimens", "tasks-b")) > -1);
        });

        it("should merge together multiple configs", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-json/.dullfile"));
            d.addConfig(path.resolve(__dirname, "./specimens/config-js/.dullfile"));

            assert.equal(Object.keys(d.tasks).length, 4);
            assert("a-async" in d.tasks);
            assert("a" in d.tasks);
            assert("b-async" in d.tasks);
            assert("b" in d.tasks);

            assert("config-json" in d._config);
            assert.equal(d._config["config-json"], "config-json");
            
            assert("nested" in d._config);
            assert("config-json" in d._config.nested);
            assert("config-js" in d._config.nested);
            assert.equal(d._config.nested["config-json"], "config-json");
            assert.equal(d._config.nested["config-js"], "config-js");

            assert(d._config.dirs.length);
            assert(d._config.dirs[0].indexOf(path.join("specimens", "tasks-b")) > -1);
            assert(d._config.dirs[1].indexOf(path.join("specimens", "tasks-a")) > -1);
        });

        it("should not mix multiple \"steps\" when they are arrays", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-deep/.dullfile"));
            d.addConfig(path.resolve(__dirname, "./specimens/config-deep/fooga/.dullfile"));
            d.addConfig(path.resolve(__dirname, "./specimens/config-deep/fooga/wooga/.dullfile"));

            assert.equal(Object.keys(d.tasks).length, 6);
            assert("a-async" in d.tasks);
            assert("a" in d.tasks);
            assert("b-async" in d.tasks);
            assert("b" in d.tasks);
            assert("c-async" in d.tasks);
            assert("c" in d.tasks);

            assert.equal(d._config.steps.default.length, 2);
            assert.equal(d._config.steps.default[0], "c");
            assert.equal(d._config.steps.default[1], "c-async");
        });

        it("should mix multiple \"steps\" when they are objects", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-objects/.dullfile"));
            d.addConfig(path.resolve(__dirname, "./specimens/config-objects/fooga/.dullfile"));
            
            assert(Object.keys(d._config.steps).length);
            assert.equal(d._config.steps["a-steps"].length, 1);
            assert.equal(d._config.steps["a-steps"][0], "a");
            
            assert.equal(d._config.steps["b-steps"].length, 1);
            assert.equal(d._config.steps["b-steps"][0], "b-async");
            
            assert.equal(d._config.steps["a-steps"].length, 1);
            assert.equal(d._config.steps["c-steps"][0], "c");
        });

        it("should load any additional configs defined in \"includes\"", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-include/.dullfile"));

            assert.equal(Object.keys(d.tasks).length, 2);
            assert("a-async" in d.tasks);
            assert("a" in d.tasks);

            assert("config-include" in d._config);
            assert.equal(d._config["config-include"], "config-include");
            
            assert("nested" in d._config);
            assert("config-include" in d._config.nested);
            assert("config-js" in d._config.nested);
            assert.equal(d._config.nested["config-include"], "config-include");
            assert.equal(d._config.nested["config-js"], "config-js");

            assert(d._config.dirs.length);
            assert(d._config.dirs[0].indexOf(path.join("specimens", "tasks-a")) > -1);
        });

        it("should merge default tasks", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-include2/.dullfile"));

            console.log(d.steps.default.length); // 1
            console.log(d.steps.default);        // [ "included-default" ]

            assert.equal(d.steps.default.length, 1);
            assert.equal(d.steps.default, [ "specific-default" ]);
        });
        
        it("should use current process.cwd() to resolve includes entries if an object is passed", function() {
            var d = new Dullard();
            
            d.addConfig({ includes : [
                    "./test/specimens/config-js/.dullfile"
                ]
            });
            
            assert("config-js" in d._config);
            assert.equal(d._config["config-js"], "config-js");
        });
    });
});
