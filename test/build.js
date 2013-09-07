/*jshint node:true */
"use strict";

var path   = require("path"),
    assert = require("assert"),

    Build = require("../lib/build.js");

describe("Node web build", function() {
    describe("Builder", function() {
        
        it("should be instantiable", function() {
            assert(new Build());
        });
    });
});
