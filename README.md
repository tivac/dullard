Dullard [![NPM Version](https://img.shields.io/npm/v/dullard.svg)](https://www.npmjs.com/package/dullard) [![NPM License](https://img.shields.io/npm/l/dullard.svg)](https://www.npmjs.com/package/dullard)
=======
[![NPM Downloads](https://img.shields.io/npm/dm/dullard.svg)](https://www.npmjs.com/package/dullard)
[![Build Status](https://img.shields.io/travis/tivac/dullard.svg)](https://travis-ci.org/tivac/dullard)
[![Dependency Status](https://img.shields.io/david/tivac/dullard.svg)](https://david-dm.org/tivac/dullard)
[![devDependency Status](https://img.shields.io/david/dev/tivac/dullard.svg)](https://david-dm.org/tivac/dullard#info=devDependencies)

> "I have made this longer than usual because I have not had time to make it shorter." - Blaise Pascal

Dullard is a simple NodeJS-powered task runner. It exists because doing the same thing repeatedly is boring. Much better to let the computer do it instead.

**Table of Contents**

- [Usage](#usage)
- [Config](#config)
    - [Examples](#examples)
        - [JSON](#json)
        - [Javascript](#javascript)
    - [Properties](#properties)
        - [dirs](#dirs)
        - [steps](#steps)
        - [includes](#includes)
    - [Customizing Config Values](#customizing-config-values)
- [Tasks](#tasks)
    - [Sync Tasks](#sync-tasks)
    - [Async Tasks](#async-tasks)
    - [Logging in a task](#logging-in-a-task)
- [Install](#install)
- [Develop](#develop)

## Usage ##

```
$ dullard --help
    
  Let the computers do the boring stuff.

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
```

## Config ##

Dullard will look for a file named `.dullfile` in the current directory or any parent directories & merge it with the CLI options. It will merge all found results in the current branch of the directory tree with precedence being: `CLI > Local > Parent > ... > Root`.

### Examples ###

#### JSON ####

```javascript
{
    "dirs" : [
        "../../../tasks-a"
    ],
    
    "steps" : [
        "fooga"
    ]
}
```

#### Javascript ####

```javascript
module.exports = {
    "dirs" : [
        "../../tasks-a"
    ],
    
    "steps" : {
        main : [
            "fooga"
        ],
        
        finish : [
            "wooga"
        ],
        
        default : [
            "main",
            "finish"
        ]
    }
};
```

### Properties ###

#### dirs ####
`dirs` is an array of directories to load tasks from. Paths are relative to the `.dullfile`.

#### steps ####
`steps` defines the order of build steps to run. It supports two different formats.

* an array of strings/functions
* an object containing named step collections that are each an array of strings/functions.

Task names are the names of files in the task directories stripped of their extension or the name of a step collection.

#### includes ###
`includes` is an array of paths to other `.dullfile`s that will be included & merged into the existing config. Paths are relative to the `.dullfile`.

```javascript
{
    ...
    "includes" : [
        "../fooga/wooga/.dullfile"
    ]
}
```

### Customizing Config Values ###

Dullard tries hard to accept whatever & turn it into something useful. To this end the results of parsing the CLI with [`optimist`](https://github.com/substack/node-optimist) are merged into the config object after all the `.dullfile`s. This allows you to run builds with environment-specific settings easily, as you can override any settings via CLI args.

For example, given the following `.dullfile` and CLI args

```javascript
{
    "env" : "dev",
    ...
}
```

invoking dullard using the command `dullard --env=live` will set the `env` value to `"live"` instead of `"dev"`.

Thanks to `optimist`'s ability to handle [dot-notation](https://github.com/substack/node-optimist#dot-notation) for arguments you can also set nested object arguments.

`dullard --env=live --cdn.static=http://www.cdn.com` with the same `.dullfile` as above gives you a `config` object like this

```javascript
{
    "env" : "dev",
    "cdn" : {
        "static" : "http://www.cdn.com"
    }
    ...
}
```

#### Warning ####
This only works for values that are __not__ one of Dullard's [CLI options](#usage).

## Tasks ##

Tasks are modules that export a single function. There's no wrapper around `fs`, no streams support baked-in, they're a function that can do some stuff. Every task will be passed a shared `config` object that represents the state of dullard & the tasks to be run. For async tasks you can also accept a second argument that can be used as a callback function following the normal node-style error-first pattern.


### Sync Tasks ###

```javascript
// Passing tasks
function exampleTaskSync(config) {
    // ...
}

function exampleTaskSync(config) {
    // ...
    
    return undefined;
}

// Failing tasks
function exampleTaskFailureSync(config) {
    throw new Error("Task failed");
}
```

### Async tasks ###

Tasks can do async work in two different ways. Either by accepting a second callback argument, or returning a promise.

```javascript
// Passing task
function exampleTaskAsyncCallback(config, done) {
    setTimeout(done, 10);
}

function exampleTaskAsyncPromise(config) {
    return new Promise(function(reject, resolve) {
        // ...
        resolve();
    });
}

// Failing task
function exampleTaskFailureAsync(config, done) {
    done("Task Failed");
}

function exampleTaskFailureAsyncPromise(config) {
    return new Promise(function(reject, resolve) {
        // ...
        reject();
    });
}
```

### Logging in a task ###

Dullard makes a `log` function available to tasks via `config.log`, this is a reference to [`npmlog.log()`](https://github.com/npm/npmlog#basic-usage) and you may use it accordingly. It respects loglevel values passed via the CLI, either via `--loglevel=<level>` or the shorthand `--verbose` argument.

## Install ##

1. `npm i -g dullard`

## Develop ##

1. `git clone git://github.com/tivac/dullard.git`
1. `npm i`
1. Make changes
1. `npm test`
