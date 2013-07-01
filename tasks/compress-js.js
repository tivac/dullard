/*jshint node:true */

"use strict";

var fs   = require("fs"),
    url  = require("url"),
    path = require("path"),
    
    _         = require("lodash"),
    glob      = require("glob"),
    async     = require("async"),
    esprima   = require("esprima"),
    esmangle  = require("esmangle"),
    escodegen = require("escodegen");

module.exports = function compressJs(build, done) {
    var root = build.config.dirs.static || build.config.dirs.temp,
        task = build.config.tasks["compress-js"] || {};
    
    glob(
        task.filter || "**/*.js",
        _.defaults(
            { cwd : root },
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
                    var file  = path.join(root, name),
                        dir   = path.dirname(file),
                        ext   = path.extname(name),
                        base  = path.basename(name, ext),
                        rel   = ("/" + path.relative(root, dir)).replace(/\/\//g, "/"),
                        map   = base + "." + (task.map || "map"),
                        debug = base + "-debug" + ext,
                        src   = fs.readFileSync(file, { encoding : "utf8" }),
                        ast, result;
                    
                    // fileError for code coverage
                    if(!src || task.fileError) {
                        return cb("Unable to read " + file);
                    }
                    
                    ast = esprima.parse(src, {
                        loc    : true,
                        tokens : true,
                    });
                    ast = esmangle.optimize(ast, null);
                    ast = esmangle.mangle(ast, null, {
                        destructive : true
                    });
<<<<<<< HEAD
                    
                    result = escodegen.generate(ast, {
                        sourceMap         : url.resolve(rel, "/" + base + ext),
                        sourceMapWithCode : true,
=======
                    js  = escodegen.generate(ast, {
                        sourceMap : path.join(
                            path.dirname(file),
                            path.basename(file, path.extname(file)),
                            "." + (task.map || "map")
                        ),
>>>>>>> ca469c83f771e142e8cf21ec1b2e12ee078402be
                        format    : {
                            renumber    : true,
                            hexadecimal : true,
                            escapeless  : true,
                            compact     : true,
                            semicolons  : false,
                            parentheses : false
                        }
                    });
                    
                    async.parallel([
                        function compressJsWriteDebug(cb) {
                            fs.writeFile(
                                path.join(dir, debug),
                                src,
                                cb
                            );
                        },
                        
                        function compressJsWriteSrc(cb) {
                            fs.writeFile(
                                file,
                                result.code + "\n//# sourceMappingURL=" + url.resolve(rel, "/" + map),
                                cb
                            );
                        },
                        
                        function compressJsWriteMap(cb) {
                            // Need to update sources array to use non-compressed files
                            result.map._sources._array = [ url.resolve(rel, "/" + debug) ];
                            
                            fs.writeFile(
                                path.join(dir, map),
                                result.map.toString(),
                                cb
                            );
                        }
                    ], done);
                },
                function compressJsDone(err) {
                    done(err);
                }
            );
        }
    );
};

module.exports.description = "Compress JavaScript code";
