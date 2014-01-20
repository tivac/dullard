/*jshint node:true */
"use strict";

var assert  = require("assert"),

    Dullard = require("../lib/dullard");

describe("Dullard", function() {
    describe("Dullard Class", function() {
        it("shouldn't confuse steps with Array.prototype methods (Issue #18)", function() {
            var d1 = new Dullard({
                    dirs : [
                        "./test/specimens/tasks-other"
                    ],
                    
                    steps : [
                        "filter"
                    ]
                });
            
            d1.run();
        });

        it("should use the task name as the log prefix (Issue #30)", function(done) {
            var d1 = new Dullard({
                   dirs : [
                        "./test/specimens/tasks-a",
                    ]
                }),
                prefixes = [];
            
            d1.on("log", function(args) {
                prefixes.push(args.task);
            });
            
            d1.run([ "a", "a-async" ], function() {
                assert(prefixes.indexOf("a") > -1);
                assert(prefixes.indexOf("a-async") > -1);
                
                done();
            });
        });
    });
});
