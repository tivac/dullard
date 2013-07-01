/*jshint node:true */

"use strict";

var fs   = require("fs"),
    path = require("path"),
    
    _         = require("lodash"),
    glob      = require("glob"),
    async     = require("async"),
    cleaner   = require("clean-css");

module.exports = function compressCss(build, done) {
    var dir     = build.config.dirs.static || build.config.dirs.temp,
        task    = build.config.tasks["compress-css"] || {};
    
    glob(
        task.filter || "**/*.css",
        _.defaults(
            { cwd : dir },
            task.glob || {}
        ),
        function compressCssGlob(err, files) {
            // globError for code coverage
            if(err || task.globError) {
                return done(err || task.globError);
            }
            
            async.each(
                files,
                function compressCssFile(name, cb) {
                    var file = path.join(dir, name),
                        css  = fs.readFileSync(file, { encoding : "utf8" }),
                        ast;
                   
                    // fileError for code coverage
                    if(!css || task.fileError) {
                        return cb("Unable to read " + file);
                    }
                    
                    css = cleaner.process(css);
                    
                    fs.writeFile(file, css, done);
                },
                function compressCssDone(err) {
                    done(err);
                }
            );
        }
    );
};

module.exports.description = "Compress CSS";
