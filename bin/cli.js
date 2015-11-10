#!/usr/bin/env node
"use strict";

var Cli = require("../src/cli"),
    cli;

cli = new Cli({
    argv    : process.argv,
    Dullard : require("../src/dullard"),
    stream  : process.stderr,
    process : process
});

cli.run();
