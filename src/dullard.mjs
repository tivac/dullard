import path         from "node:path";
import util         from "node:util";
import EventEmitter from "node:events";

import omit   from "lodash.omit";
import series from "p-each-series";
import time   from "humanize-duration";
import check  from "is-promise";

import loadConfig   from "./load-config.mjs";
import loadTask     from "./load-task.mjs";
import mergeConfigs from "./merge-configs.mjs";
import findTasks    from "./find-tasks.mjs";
import parseSteps   from "./parse-steps.mjs";

function Dullard() {
    EventEmitter.call(this);

    this.tasks = {};
    this.steps = {};

    this.config = {
        cwd   : process.cwd(),
        log   : this.log.bind(this),
        dirs  : [],
        files : [],

        // Stick a reference to the current dullard instance on the config
        // to allow for fun meta-programming nonsense
        dullard : this
    };
}

// Allow for dullard to emit events
util.inherits(Dullard, EventEmitter);

// Fire a logging event, generally caught by CLI module & logged
Dullard.prototype.log = function(lvl, message) {
    const level = message ? lvl : "info";

    this.emit("log", {
        level : level,
        task  : this._current,
        body  : Array.prototype.slice.call(arguments, message ? 1 : 0)
    });
};

Dullard.prototype.run = async function(name) {
    if (name.name) {
        this._current = name.name;
    } else if (typeof name === "string") {
        this._current = name;
    } else {
        this._current = "no-name";
    }

    const task = await loadTask(this.tasks, name);

    if (!task) {
        throw new Error(`Unknown task: ${name}`);
    }

    this.log("verbose", "started");

    // No callback fn, so either sync or a promise
    if (task.length < 2) {
        const result = task(this.config);

        // Ensure a promise is returned
        return check(result) ?
            result :
            Promise.resolve(result);
    }

    // Wrap the callback fn to support async tasks returning an error
    // Store the result so that sync steps can error out by returning a value
    return new Promise((resolve, reject) =>
        task(this.config, (err) =>
            (err ? reject(err) : resolve())
        )
    );
};

Dullard.prototype.series = function(name) {
    let steps;

    if (name in this.steps) {
        steps = this.steps[name];
    } else {
        steps = name;
    }

    if (!Array.isArray(steps)) {
        steps = [ steps ];
    }

    this._current = name.toString();

    if (steps.length > 1) {
        this.log("verbose", "Running");
        this.log("verbose", `    ${steps.join("\n    ")}`);
    }

    return series(
        steps,
        (task) => {
            const start = Date.now();

            // Support aliases by recursing down the rabbit hole
            if (task in this.steps) {
                return this.series(task);
            }

            return this.run(task).then(() =>
                this.log(`complete in ${time(Date.now() - start)}`)
            );
        }
    )
    .then(() => (this._current = null))
    .catch((error) => {
        this.log("error", "failed");

        this._current = null;

        throw error;
    });
};

// Public API
Dullard.prototype.start = function(steps) {
    const start = Date.now();

    // select "default" step if steps is empty/doesn't exist
    if (!steps || !steps.length) {
        steps = "default";
    }

    this.log("verbose", "Build starting");
    this.log("silly", "Loaded configs");
    this.log("silly", `    ${this.config.files.join("    \n")}`);

    // Done this way to take advantage of consistent failure handling
    return this.series(
        steps
    )
    .then(() => {
        this.log(`build complete in ${time(Date.now() - start)}`);

        return this;
    })
    .catch((error) => {
        this.log("error", `build failed in ${time(Date.now() - start)}`);

        if (error instanceof Error) {
            this.log("error", error.message);
            this.log("silly", error.stack);
        } else {
            this.log("error", error);
        }

        throw error;
    });
};

Dullard.prototype.addConfig = async function(config) {
    let cwd = this.config.cwd,
        file;

    if (typeof config === "string") {
        file   = config;
        cwd    = path.dirname(file);
        config = await loadConfig(config);

        this.config.files.push(file);
    }

    // Supporting merging in other .dullfiles, needs to happen before
    // this config gets merged to preserve expected merging order
    if (config.includes) {
        await Promise.all(
            config.includes
                .map((include) => {
                    const configPath = path.resolve(cwd, include);

                    return this.addConfig(configPath);
                })
        );
    }

    // Dirs get added & checked for tasks
    if (config.dirs) {
        config.dirs.forEach((dir) =>
            this.addDir(path.resolve(cwd, dir))
        );
    }

    config.steps = parseSteps(config);

    // Merge this config into existing config
    // Ignoring keys we treated specially up above
    this.config = mergeConfigs(
        this.config,
        omit(config, [ "dirs", "includes", "dullard" ])
    );

    this.steps = this.config.steps;
};

Dullard.prototype.addDir = function(dir) {
    this.tasks = Object.assign(this.tasks, findTasks(dir));

    this.config.dirs.push(dir);
};

// Return a copy of this dullard instance (mostly used for sub-tasks)
Dullard.prototype.clone = async function() {
    const clone = new Dullard();

    await clone.addConfig(this.config);

    return clone;
};

Dullard.prototype.children = async function(steps) {
    const clone = await this.clone();

    this.log("verbose", "Running children tasks");

    return clone.start(steps)
        .then(() => {
            this.log("verbose", "Completed children tasks");

            return clone;
        });
};

export default Dullard;
