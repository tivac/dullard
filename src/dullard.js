"use strict";

var fs     = require("fs"),
    path   = require("path"),
    util   = require("util"),
    
    EventEmitter = require("events"),

    merge  = require("lodash.mergewith"),
    omit   = require("lodash.omit"),
    series = require("p-each-series"),
    time   = require("humanize-duration"),
    check  = require("is-promise"),

    loadConfig = require("./load-config.js"),
    findTasks  = require("./find-tasks.js"),

    Dullard;

Dullard = function(config) {
    EventEmitter.call(this);

    this.tasks   = {};
    this.steps   = {};
    this._config = {
        dullard : this,
        log     : this._log.bind(this),
        dirs    : []
    };
    
    if(config) {
        this.addConfig(config);
    }
};

require("util").inherits(Dullard, EventEmitter);

// Fire a logging event, generally caught by CLI module & logged
Dullard.prototype._log = function(lvl, message) {
    var level = message ? lvl : "info";

    this.emit("log", {
        level : level,
        task  : this._current,
        body  : Array.prototype.slice.call(arguments, message ? 1 : 0)
    });
};

// Attempts to read a task off disk
Dullard.prototype._loadTask = function(name) {
    var source;

    if(typeof name === "function") {
        return name;
    }

    if(!(name in this.tasks)) {
        return false;
    }

    // Task is already loaded
    if(typeof this.tasks[name] === "function") {
        return this.tasks[name];
    }

    // Save source off so it can be stuck back on
    source = this.tasks[name].source;
    
    this.tasks[name] = require(source);
    this.tasks[name].source = source;

    return this.tasks[name];
};

Dullard.prototype._runTask = function(name) {
    var self  = this, // must keep this alias for full-fat function below
        start = Date.now(),
        task,
        result;

    // Support aliases by recursing down the rabbit hole
    if(this.steps && name in this.steps) {
        return this._runSteps(name);
    }

    task = this._loadTask(name);

    if(!task) {
        throw new Error(`Unknown task: ${name}`);
    }

    this._current = name.toString();

    this._log("started");
    
    // Early-out in testing mode
    if(this._test) {
        return this._log("info", `faked in ${time(Date.now() - start)}`);
    }

    // No callback fn, so either sync or a promise
    if(task.length < 2) {
        result = task(this._config);

        // Handle non-promise return values
        return (check(result) ?
            result :
            new Promise((resolve, reject) => (typeof result !== "undefined" ? reject(result) : resolve()))
        )
        .then(() => this._log("info", `complete in ${time(Date.now() - start)}`));
    }

    // Wrap the callback fn to support async tasks returning an updated config
    // Store the result so that sync steps can error out by returning a value
    return new Promise((resolve, reject) =>
        // Since callbacks can pass back format strings + values this **MUST** remain
        // a full-fat function, we need access to arguments :(
        task(this._config, function(err, config) {
            if(err) {
                // Handle formatted strings coming back
                return reject(
                    util.format.apply(null, Array.prototype.slice.apply(arguments))
                );
            }

            if(config) {
                self._config.log("warn", "Overwriting the config value via callback will be deprecated soon");
                
                self._config = config;
            }

            self._log(`complete in ${time(Date.now() - start)}`);

            return resolve();
        })
    );
};

Dullard.prototype._runSteps = function(name) {
    var steps;

    if(this.steps && (name in this.steps)) {
        steps = this.steps[name];
    } else if(name in this.tasks) {
        steps = [ name ];
    } else {
        steps = name;
    }

    if(!steps) {
        return Promise.reject(new Error("No steps defined"));
    }

    if(!Array.isArray(steps)) {
        steps = [ steps ];
    }

    // Set up current even though we're not into .runTask yet
    // so that the log will have the right prefix
    this._current = name;
    this._log("verbose", "%s steps:\n\t%s", this._test ? "Pretending to run" : "Running", steps.join("\n\t"));

    return series(
        steps,
        this._runTask.bind(this)
    )
    .then(() => (this._current = null));
};

// Public API
Dullard.prototype.run = function(steps, done) {
    var start = Date.now();

    // Support calling w/ only a callback
    if(typeof steps === "function") {
        done  = steps;
        steps = null;
    }

    // select "default" step if steps is empty/doesn't exist
    if(!steps || !steps.length) {
        steps = "default";
    }

    this._log("verbose", "Build starting");

    return this._runSteps(steps)
        .then(() => {
            this._log(`build complete in ${time(Date.now() - start)}`);

            if(typeof done === "function") {
                return done();
            }
            
            return true;
        })
        .catch((error) => {
            this._log(`build complete in ${time(Date.now() - start)}`);

            if(typeof done === "function") {
                return done(error);
            }

            throw error;
        });
};

Dullard.prototype.test = function(steps, done) {
    this._test = true;
    
    return this.run(steps, done);
};

Dullard.prototype.addConfig = function(config) {
    /* eslint max-statements:["error", 18] */
    var file, cwd;
    
    if(typeof config === "string") {
        file   = config;
        config = loadConfig(config);
    }
    
    cwd = config.cwd || process.cwd();

    // Supporting merging in other .dullfiles
    // needs to happen before this config gets merged to preserve expected
    // merging order
    if(config.includes) {
        if(file) {
            cwd = path.dirname(file);
        }

        config.includes.forEach((include) => this.addConfig(path.resolve(cwd, include)));
    }

    if(config.dirs) {
        config.dirs.forEach((name) => {
            var dir   = path.resolve(config.cwd || process.cwd(), name),
                tasks = findTasks(dir);

            this.tasks = Object.assign(this.tasks, tasks);
        });

        this._config.dirs = this._config.dirs.concat(config.dirs);
    }
    
    if(config.steps) {
        // Convert steps that are a single function or array into the
        // object format we use internally
        if(typeof config.steps !== "object" || Array.isArray(config.steps)) {
            config.steps = {
                default : config.steps
            };
        }
    } else {
        config.steps = {};
    }
    
    // Merge this config into existing config
    // Ignoring keys we treated specially up above
    this._config = merge(
        this._config,
        omit(config, "dirs", "includes"),
        
        // Disable lodash's default array merging behavior,
        // see https://github.com/tivac/dullard/issues/15
        (a, b) => Array.isArray(b) ? b : undefined
    );

    this.steps = this._config.steps;
};

module.exports = Dullard;
