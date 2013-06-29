/*jshint node:true */

"use strict";

var fs   = require("fs"),
    path = require("path"),
    
    _         = require("lodash"),
    glob      = require("glob"),
    async     = require("async"),
    esprima   = require("esprima"),
    esmangle  = require("esmangle"),
    escodegen = require("escodegen");

module.exports = function compressJs(build, done) {
    var dir     = build.config.dirs.static || build.config.dirs.temp,
        task    = build.config.tasks["compress-js"] || {};
    
    glob(
        task.filter || "**/*.js",
        _.defaults(
            { cwd : dir },
            task.glob || {}
        ),
        function compressJsGlob(err, files) {
            // globError for code coverage
            if(err || task.globError) {
                return done(err || task.globError);
            }
            
            async.each(
                files,
                function compressJsFile(name, cb) {
                    var file = path.join(dir, name),
                        js = fs.readFileSync(file, { encoding : "utf8" }),
                        ast;
                   
                    // fileError for code coverage
                    if(!js || task.fileError) {
                        return cb("Unable to read " + file);
                    }
                    
                    ast = esprima.parse(js);
                    ast = esmangle.optimize(ast, null);
                    ast = esmangle.mangle(ast, null, {
                        destructive : true
                    });
                    js  = escodegen.generate(ast, {
                        sourceMap : path.join(
                            path.dirname(file),
                            path.basename(file, path.extname(file)),
                            "." + (task.map || "map")
                        ),
                        format    : {
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
