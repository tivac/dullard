#!/usr/bin/env node
import path from "node:path";

import omit    from "lodash.omit";
import log     from "npmlog";
import uppity  from "uppity";
import meow    from "meow";
import updated from "update-notifier";

import Dullard from "../src/dullard.mjs";

const dullard = new Dullard();
const flags   = {
    config : {
        type      : "boolean",
        shortFlag : "c"
    },
    dirs : {
        type       : "string",
        shortFlag  : "d",
        isMultiple : true
    },
    list : {
        type      : "boolean",
        shortFlag : "l"
    },
    log : {
        type      : "string",
        shortFlag : "g"
    },
    silent : {
        type      : "boolean",
        shortFlag : "s"
    },
    verbose : {
        type      : "boolean",
        shortFlag : "v"
    },
    silly : {
        type      : "boolean",
        shortFlag : "y"
    }
};

let config;

function sep(str) {
    return str.replace(/\\/g, "/");
}

const cli = meow(`
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
    flags,

    default : {
        log : "info"
    },
    importMeta : import.meta
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
await Promise.all(
    uppity(".dullfile", { nocase : true })
        .reverse()
        .map((file) => dullard.addConfig(file))
);

// Load tasks from any CLI-specified dirs
if (cli.flags.dirs.length) {
    config = {
        dirs : cli.flags.dirs.flatMap((dir) => dir.split(",").map((d) => d.trim()))
    };

    log.verbose("cli", "Adding config: %j", config);

    await dullard.addConfig(config);
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

    const alphabetizedTasks = Object.keys(dullard.tasks).sort();

    for await (const name of alphabetizedTasks) {
        let task     = dullard.tasks[name];
        const source = task.source;

        try {
            task = await import(new URL(`file://${source}`)).then((module) => ({
                ...module,
                source
            }));
        } catch (e) {
            // just ignore the error, since it doesn't really matter
        }

        log.info("cli", `name   : ${name}`);
        log.info("cli", `source : .${sep(path.sep + path.relative(process.cwd(), task.source))}`);

        if (task.description) {
            log.info("cli", `desc   : ${task.description}`);
        }

        log.info("cli", "");
    }

    process.exit();
}

// Merge non-CLI specific args into the dullard config
config = omit(cli.flags, Object.keys(flags).flatMap((flag) => [ flag, flags[flag].shortFlag ]));

await dullard.addConfig(config);

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
    .catch((e) => {
        // Don't exit immediately, want to make sure any output
        // has a chance to be written first
        process.on("exit", function() {
            process.exit(1);
        });
    });
