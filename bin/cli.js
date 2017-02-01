#!/usr/bin/env node
"use strict";

var path = require("path"),

    log    = require("npmlog"),
    uppity = require("uppity"),
    cli    = require("meow")(`
    Usage
        $ dullard <options> <task>, ..., <taskN>
    
    Options
        --help         Show this help
        --dirs,    -d  Specify directories to load tasks from
        --list,    -l  Show a list of available tasks
        --test,    -t  Run in test mode, no tasks will be executed
        --log,     -g  Specify log level, one of silly, verbose, info, warn, error, & silent
        --quiet,   -q  Quiet logging
        --silent,  -s  Really quiet logging
        --verbose, -v  Verbose logging
        --silly,   -y  REALLY verbose logging
    `, {
        alias : {
            dirs    : "d",
            list    : "l",
            test    : "t",
            log     : "g",
            quiet   : "q",
            silent  : "s",
            verbose : "v",
            silly   : "y"
        },

        default : {
            log : "info"
        },

        string  : [ "dirs", "log" ],
        boolean : [ "list", "test", "quiet", "silent", "verbose", "silly" ]
    }),
    
    Dullard = require("../src/dullard.js"),
    dullard = new Dullard(),
    config;

[ "quiet", "silent", "verbose", "silly", "log" ].find((lvl) => {
    if(!cli.flags[lvl]) {
        return false;
    }

    return (log.level = typeof cli.flags[lvl] === "string" ? cli.flags[lvl] : lvl);
});

// Go find all parent .dullfiles add load them into dullard instance
uppity(".dullfile", { nocase : true })
    .reverse()
    .forEach((file) => {
        log.verbose("cli", "Adding config: %s", file);

        dullard.addConfig(file);
    });
    
// Load tasks from any CLI-specified dirs
if(cli.flags.dirs) {
    config = {
        dirs : Array.isArray(cli.flags.dirs) ?
            cli.flags.dirs :
            cli.flags.dirs.split(",")
    };
    
    log.verbose("cli", "Adding config: %j", config);

    dullard.addConfig(config);
}

if(cli.flags.list) {
    if(!Object.keys(dullard.tasks).length) {
        return log.error("cli", "No tasks available.");
    }

    log.info("cli", "Available Tasks:");
    log.info("cli", "");

    return Object.keys(dullard.tasks)
        .sort()
        .forEach((name) => {
            var task   = dullard.tasks[name],
                source = task.source;

            try {
                task = require(source);
                task.source = source;
            } catch(e) {
                // just ignore the error, since it doesn't really matter
            }

            log.info("cli", `name   : ${name}`);
            log.info("cli", `source : .${path.sep}${path.relative(process.cwd(), task.source)}`.replace(/\\/g, "/"));

            if(task.description) {
                log.info("cli", `desc   : ${task.description}`);
            }

            log.info("cli", "");
        });
}

if(cli.flags.test) {
    log.warn("TEST RUN");
    
    return dullard.test(cli.input);
}

if(!cli.flags.quiet) {
    dullard.on("log", (args) =>
        log.log.apply(log, [ args.level, args.task || "dullard" ].concat(args.body))
    );
}

return dullard.run(cli.input)
    .catch((error) => {
        log.error("cli", "Build failed!");
        log.error("cli", error);

        // Don't exit immediately, want to make sure any output
        // has a chance to be written first
        process.on("exit", function() {
            process.exit(1);
        });
    });
