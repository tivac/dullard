"use strict";

let path = require("path"),
    util = require("util"),
    
    EventEmitter = require("events"),

    omit   = require("lodash.omit"),
    series = require("p-each-series"),
    time   = require("humanize-duration"),
    check  = require("is-promise"),

    loadConfig   = require("./load-config.js"),
    loadTask     = require("./load-task.js"),
    mergeConfigs = require("./merge-configs.js"),
    findTasks    = require("./find-tasks.js"),
    parseSteps   = require("./parse-steps.js"),

    Dullard;

Dullard = function() {
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
};

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

Dullard.prototype.run = function(name) {
    let task, result;
    
    if (name.name) {
        this._current = name.name;
    } else if (typeof name === "string") {
        this._current = name;
    } else {
        this._current = "no-name";
    }

    task = loadTask(this.tasks, name);

    if (!task) {
        throw new Error(`Unknown task: ${name}`);
    }

    this.log("verbose", "started");
    
    // No callback fn, so either sync or a promise
    if (task.length < 2) {
        result = task(this.config);

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

Dullard.prototype.addConfig = function(config) {
    let cwd = this.config.cwd,
        file;
    
    if (typeof config === "string") {
        file   = config;
        cwd    = path.dirname(file);
        config = loadConfig(config);

        this.config.files.push(file);
    }
    
    // Supporting merging in other .dullfiles, needs to happen before
    // this config gets merged to preserve expected merging order
    if (config.includes) {
        config.includes
            .map((include) => path.resolve(cwd, include))
            .forEach((include) => this.addConfig(include));
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
Dullard.prototype.clone = function() {
    const clone = new Dullard();

    clone.addConfig(this.config);

    return clone;
};

Dullard.prototype.children = function(steps) {
    const clone = this.clone();

    this.log("verbose", "Running children tasks");

    return clone.start(steps)
        .then(() => {
            this.log("verbose", "Completed children tasks");

            return clone;
        });
};

module.exports = Dullard;
