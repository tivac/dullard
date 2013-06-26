/*jshint node:true */
"use strict";

var assert = require("assert"),

    Build = require("../lib/build.js");

describe("Node web build", function() {
    describe("Build Object", function() {
        it("should be instatiable", function() {
            assert(new Build({ root : "./specimens/simple/" }));
        });   
    });
});
