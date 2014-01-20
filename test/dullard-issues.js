/*jshint node:true */
"use strict";

var Dullard = require("../lib/dullard");

describe("Dullard", function() {
    describe("Dullard Class", function() {
        it("shouldn't confuse steps with Array.prototype methods (Issue #18)", function() {
            var b1 = new Dullard({
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
