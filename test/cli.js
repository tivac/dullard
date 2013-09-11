/*jshint node:true */
"use strict";

var assert = require("assert"),

    cli    = require("../lib/cli.js"),
    Build  = require("../lib/build.js"),
    
    _root = process.cwd(),
    _argv = [,,],
    
    _build, _console;

_build = function(fn) {
    var b = fn || function() {};
            
    b.prototype = {
        on  : function() {},
        run : function() {}
    };
    
    return b;
};

_console = function(log, error) {
    return {
        log   : log || function() {},
        error : error || function() {}
    };
};

describe("node-web-build", function() {
    describe("CLI", function() {
        
        afterEach(function() {
            process.chdir(_root);
        });
        
        it("should show help (& not run)", function() {
            cli(
                [].concat(_argv, "-?"),
                _build(function() {
                    assert(false, "Should not have been called!");
                }),
                _console()
            );
        });
              
        it("should create a config object", function() {
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                }),
                _console()
            );
        });
        
        it("should find a local dullfile.js", function() {
            process.chdir("./test/specimens/config-js/fooga");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.dirs.length);
                    assert(config.steps.length);
                }),
                _console()
            );
        });
        
        it("should find a local dullfile.json", function() {
            process.chdir("./test/specimens/config-json/fooga/wooga");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.dirs.length);
                    assert(config.steps.length);
                }),
                _console()
            );
        });
        
        it("should find all dullfile.js* in parent directories", function() {
            process.chdir("./test/specimens/config-deep/fooga/wooga");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert(config.root);
                    assert(config.fooga);
                    assert(config.wooga);
                    
                    assert.equal(config.dirs.length, 3);
                    assert(config.steps.length, 2);
                }),
                _console()
            );
        });
        
        
        it("should mix configs & argv, with argv taking precedence", function() {
            process.chdir("./test/specimens/config-json/fooga/wooga");
            
            cli(
                [].concat(_argv, "-d=../../../tasks-b/", "wooga", "booga"),
                _build(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 2);
                    assert.equal(config.steps.length, 2);
                    
                    assert.equal(config.steps[0], "wooga");
                    assert.equal(config.steps[1], "booga");
                }),
                _console()
            );
        });
        
        it("should complain when a build fails", function() {
            cli(
                [].concat(_argv, "fooga"),
                Build,
                _console(null, function(msg) {
                    assert(msg);
                })
            );
        });
        
        it("should respect --quiet", function() {
            process.chdir("./test/specimens/config-js/fooga");
            
            cli(
                [].concat(_argv, "--quiet"),
                Build,
                _console(
                    function(error) {
                        assert.ifError(error, "Should not have been called");
                    },
                    function(error) {
                        assert.ifError(error, "Should not have been called");
                    }
                )
            );
        });
        
        it("should handle mostly-empty configs", function() {
            process.chdir("./test/specimens/config-blank");
            
            cli(
                _argv,
                _build(function(config) {
                    assert(config);
                    
                    assert.equal(config.dirs.length, 0);
                    assert(!("steps" in config));
                }),
                _console()
            );
        });
    });
});
