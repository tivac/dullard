#!/usr/bin/env node
/*jshint node:true */

"use strict";

require("../lib/cli.js")({
    argv    : process.argv,
    Build   : require("../lib/build.js"),
    stream  : process.stderr,
    process : process
});
