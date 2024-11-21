#!/usr/bin/env node
"use strict";

let path = require("path"),

    omit    = require("lodash.omit"),
    values  = require("lodash.values"),
    log     = require("npmlog"),
    uppity  = require("uppity"),
    meow    = require("meow"),
    updated = require("update-notifier"),
    
    Dullard = require("../src/dullard.js"),
    
    dullard = new Dullard(),
    aliases = {
        config  : "c",
        dirs    : "d",
        list    : "l",
        log     : "g",
        silent  : "s",
        verbose : "v",
        silly   : "y"
    },
    
    cli, config;

function sep(str) {
    return str.replace(/\\/g, "/");
}

cli = meow(`
    Usage
        $ dullard <options> <task>, ..., <taskN>

    Options
        --help         Show this help
        --dirs,    -d  Specify directories to load tasks from
        --list,    -l  Show a list of available tasks
        --config,  -c  Output final assembled config for debugging
        --silent,  -s  No output
        --verbose, -v  Verbose logging
        --silly,   -y  REALLY verbose logging
        --log,     -g  Specify log level, one of silly, verbose, info, warn, error, & silent
`, {
    alias : aliases,

    default : {
        log : "info"
    },

    string  : [ "dirs", "log" ],
    boolean : [ "config", "list", "silent", "verbose", "silly" ]
});

// Update checks
updated(cli);

[ "silent", "verbose", "silly", "log" ].find((lvl) => {
    if (!cli.flags[lvl]) {
        return false;
    }

    return (log.level = typeof cli.flags[lvl] === "string" ? cli.flags[lvl] : lvl);
});

// Go find all parent .dullfiles add load them into dullard instance
uppity(".dullfile", { nocase : true })
    .reverse()
    .forEach((file) => dullard.addConfig(file));
    
// Load tasks from any CLI-specified dirs
if (cli.flags.dirs) {
    config = {
        dirs : (Array.isArray(cli.flags.dirs) ?
            cli.flags.dirs :
            cli.flags.dirs.split(",")
        )
        .map((dir) => dir.trim())
    };
    
    log.verbose("cli", "Adding config: %j", config);

    dullard.addConfig(config);
}

if (cli.flags.list) {
    if (dullard.config.files.length) {
        log.info("cli", "Config files loaded:");
        log.info("cli", "");
        log.info("cli", `    ${dullard.config.files.map((file) => sep(file)).join("\n    ")}`);
        log.info("cli", "");
    }
    
    if (!Object.keys(dullard.tasks).length) {
        log.error("cli", "No tasks available.");

        process.exit();
    }

    log.info("cli", "Available Tasks:");
    log.info("cli", "");

    Object.keys(dullard.tasks)
        .sort()
        .forEach((name) => {
            let task = dullard.tasks[name],
                source = task.source;

            try {
                task        = require(source);
                task.source = source;
            } catch (e) {
                // just ignore the error, since it doesn't really matter
            }

            log.info("cli", `name   : ${name}`);
            log.info("cli", `source : .${sep(path.sep + path.relative(process.cwd(), task.source))}`);

            if (task.description) {
                log.info("cli", `desc   : ${task.description}`);
            }

            log.info("cli", "");
        });

    process.exit();
}

// Merge non-CLI specific args into the dullard config
config = omit(cli.flags, Object.keys(aliases).concat(values(aliases)));

dullard.addConfig(config);

if (cli.flags.config) {
    log.info("cli", "Generated config object:");
    log.info("cli", "");
    log.info("cli", JSON.stringify(omit(dullard.config, "dullard"), null, 4));

    process.exit();
}

if (!cli.flags.silent) {
    dullard.on("log", (args) =>
        log.log.apply(log, [ args.level, args.task || "dullard" ].concat(args.body))
    );
}

dullard.start(cli.input)
    .catch(() => {
        // Don't exit immediately, want to make sure any output
        // has a chance to be written first
        process.on("exit", function() {
            process.exit(1);
        });
    });
