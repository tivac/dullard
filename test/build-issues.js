/*jshint node:true */
"use strict";

var Build = require("../lib/build.js");

describe("Dullard", function() {
    describe("Build Class", function() {
        it("shouldn't confuse steps with Array.prototype methods (Issue #18)", function() {
            var b1 = new Build({
                    dirs : [
                        "./test/specimens/tasks-other"
                    ],
                    
                    steps : [
                        "filter"
                    ]
                });
            
            b1.run();
        });
    });
});
