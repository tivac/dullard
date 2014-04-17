"use strict";

var path   = require("path"),
    assert = require("assert"),

    Dullard = require("../lib/dullard");

describe("Dullard", function() {
    describe(".addConfig()", function() {
        
        it("should add an object into its config", function() {
            var d = new Dullard();

            d.addConfig({
                dirs  : [
                    path.resolve(__dirname, "./specimens/tasks-a")
                ],

                fooga : 1,
                wooga : {
                    nooga : 1
                }
            });

            assert.equal(Object.keys(d.tasks).length, 2);
            assert("a-async" in d.tasks);
            assert("a" in d.tasks);

            assert("fooga" in d._config);
            assert("wooga" in d._config);
            assert("nooga" in d._config.wooga);
            assert.equal(d._config.wooga.nooga, 1);

            assert(d._config.dirs.length);
            assert(d._config.dirs[0].indexOf(path.join("specimens", "tasks-a")) > -1);
        });

        it("should treat a string config as a file path & add it into its config", function() {
            var d = new Dullard();

            d.addConfig(path.resolve(__dirname, "./specimens/config-json/.dullfile"));

            assert.equal(Object.keys(d.tasks).length, 2);
            assert("b-async" in d.tasks);
            assert("b" in d.tasks);

            assert.equal(d.steps.default[0], "a");

            assert("nooga" in d._config);
            assert("looga" in d._config.nooga);
            assert.equal(d._config.nooga.looga, 5);

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

            assert("booga" in d._config);
            assert.equal(d._config.booga, "config-json");
            
            assert("nooga" in d._config);
            assert("looga" in d._config.nooga);
            assert.equal(d._config.nooga.looga, "config-json");
            assert.equal(d._config.nooga.tooga, "config-js");

            assert(d._config.dirs.length);
            assert(d._config.dirs[0].indexOf(path.join("specimens", "tasks-b")) > -1);
            assert(d._config.dirs[1].indexOf(path.join("specimens", "tasks-a")) > -1);
        });

        it.skip("should not mix multiple \"steps\" when they are arrays", function() {
            var cli;

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

        it.skip("should mix multiple \"steps\" when they are objects", function() {
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
    });
});
