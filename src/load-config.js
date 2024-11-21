"use strict";

const fs   = require("fs");
    const path = require("path");

    const strip = require("strip-json-comments");

module.exports = function(file) {
    let base = path.dirname(file),
        contents, obj;

    contents = fs.readFileSync(file, "utf8");

    // try reading config file as JSON first, fall back to JS
    try {
        contents = strip(contents);
        obj      = JSON.parse(contents);
    } catch (e) {
        obj = require(file);
    }

    if (obj.dirs) {
        obj.dirs = obj.dirs.map(function(dir) {
            return path.resolve(base, dir);
        });
    }

    return obj;
};
