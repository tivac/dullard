#!/usr/bin/env node
/*jshint node:true */

"use strict";

require("../lib/cli.js")(process.argv, require("../lib/build.js"), process.stderr, process);
