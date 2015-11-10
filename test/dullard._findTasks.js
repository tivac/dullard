"use strict";

var assert = require("assert"),

    Dullard = require("../src/dullard");

describe("Dullard", function() {
    describe("._findTasks()", function() {
        it("should load tasks from specified directories", function() {
            var d1 = new Dullard();
            
            d1._findTasks("./test/specimens/tasks-a");

            assert(Object.keys(d1.tasks).length);
        });
        
        it("should only load top-level .js files as tasks", function() {
            var d1 = new Dullard();

            d1._findTasks("./test/specimens/tasks-a");

            assert.equal(Object.keys(d1.tasks).length, 2);
            assert("a" in d1.tasks);
            assert("a-async" in d1.tasks);
        });
    });
});
