#!/usr/bin/env node
/*jshint node:true */

"use strict";

require("../lib/cli")({
    argv    : process.argv,
    Dullard : require("../lib/dullard"),
    stream  : process.stderr,
    process : process
});
