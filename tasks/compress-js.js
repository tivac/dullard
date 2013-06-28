/*jshint node:true */

"use strict";

var fs   = require("fs"),
    path = require("path"),
    
    glob      = require("glob"),
    async     = require("async"),
    esprima   = require("esprima"),
    esmangle  = require("esmangle"),
    escodegen = require("escodegen");

module.exports = function compressJs(build, done) {
    var dir = build.config.dirs.static || build.config.dirs.temp;
    
    glob(
        "**/*.js",
        { cwd : dir },
        function compressJsGlob(err, files) {
            if(err) {
                return done(err);
            }
            
            async.each(
                files,
                function compressJsFile(name, cb) {
                    var file = path.join(dir, name),
                        js = fs.readFileSync(file, { encoding : "utf8" }),
                        ast;
                   
                    if(!js) {
                        return cb("Unable to read " + file);
                    }
                    
                    ast = esprima.parse(js);
                    ast = esmangle.optimize(ast, null);
                    ast = esmangle.mangle(ast);
                    js  = escodegen.generate(ast, {
                        format : {
                            renumber    : true,
                            hexadecimal : true,
                            escapeless  : true,
                            compact     : true,
                            semicolons  : false,
                            parentheses : false
                        }
                    });
                    
                    fs.writeFile(file, js, done);
                },
                function compressJsDone(err) {
                    done(err);
                }
            );
        }
    );
};

module.exports.description = "Compress JavaScript code";
