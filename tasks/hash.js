/*jshint node:true */

"use strict";

var fs     = require("fs"),
    path   = require("path"),
    util   = require("util"),
    stream = require("stream"),
    
    _         = require("lodash"),
    glob      = require("glob"),
    async     = require("async"),
    crc32     = require("buffer-crc32"),
    
    task,
    HashingStream;

HashingStream = function(options) {
    HashingStream.super_.call(this, options);
};

util.inherits(HashingStream, stream.Writable);

HashingStream.prototype._write = function(buffer, encoding, done) {
    this.hash = crc32(buffer, this.hash);
    
    done();
};

task = function(build, done) {
    var root = build.config.dirs.static || build.config.dirs.temp,
        conf = build.config.tasks.hash || {};
        
    glob(
        conf.filter || "**/*",
        _.defaults(
            { cwd : root },
            conf.glob || {}
        ),
        function hashFiles(err, files) {
            // globError for code coverage
            if(err || conf.globError) {
                return done(err || conf.globError);
            }
            
            async.each(
                files,
                function hashFile(name, cb) {
                    var full   = path.join(root, name),
                        dir    = path.dirname(full),
                        ext    = path.extname(name),
                        base   = path.basename(name, ext),
                        hasher = new HashingStream(),
                        read;
                    
                    read = fs.createReadStream(full);
                    
                    hasher.on("finish", function() {
                        var hash = crc32.unsigned(this.hash).toString(16);
                        
                        fs.rename(
                            full,
                            path.join(dir, base + "." + hash + ext),
                            cb
                        );
                    });
                    
                    read.pipe(hasher);
                },
                function hashFileDone(err) {
                    done(err);
                }
            );
        }
    );
};

task.description = "Append file hashes to all static content & rename references";

module.exports = task;
