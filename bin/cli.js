#!/usr/bin/env node
"use strict";

var Cli = require("../lib/cli"),
    cli;

cli = new Cli({
    argv    : process.argv,
    Dullard : require("../lib/dullard"),
    stream  : process.stderr,
    process : process
});

cli.run();
