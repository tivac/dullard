/*jshint node:true */

"use strict";

var fs   = require("fs"),
    path = require("path"),
    exec = require("child_process").exec,
    
    assert = require("assert");
    

describe("Node web build", function() {
    describe("Task: Copy", function() {
        it("should copy simple files", function(done) {
            exec(
                "node build.js -r test/specimens/simple copy",
                function(error) {
                    var dir = path.resolve(__dirname, "../temp/simple");
                    
                    assert.ifError(error);
                    
                    assert(fs.existsSync(dir));
                    assert(fs.existsSync(path.join(dir, "test.js")));
                    
                    done();
                }
            );
        });
    });
});
