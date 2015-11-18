Dullard [![NPM Version](https://img.shields.io/npm/v/dullard.svg)](https://www.npmjs.com/package/dullard)[![NPM License](https://img.shields.io/npm/l/dullard.svg)](https://www.npmjs.com/package/dullard)
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
    - [Logging in a task](#logging-in-a-task)
- [Install](#install)
- [Develop](#develop)
- [FAQ](#faq)
    - [Q: What about file watching?](#q-what-about-file-watching)

## Usage ##

```
>dullard --help
dullard v0.4.3
    Let the computers do the boring stuff.

Usage: dullard -d <dir>,...,<dirN> <step1> ... <stepN>

Options:
  --help, -?     Show usage
  --dirs, -d     directories to load task files from
  --list, -l     List available tasks
  --quiet, -q    Minimal output
  --verbose, -v  Verbose logging
  --loglevel     Chattiness, one of: silly, verbose, info, warn, error, & silent  [default: "info"]
  --silent       No output until something goes awry
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

Tasks are simple modules that should export a single function. Each task function gets passed two arguments, a shared config object for state in the task chain & an optional callback for async tasks. The callback takes two possible arguments, an error object and an optional object to replace the shared config object. If the task is synchronous any return value will be considered an error.

```javascript
// Passing tasks
function exampleTaskSync(config) {
    ...
}

function exampleTaskAsync(config, done) {
    ...

    process.nextTick(done);
}

// Failing tasks
function exampleTaskFailureSync(config) {
    return "Task failed";
}

function exampleTaskFailureAsync(config, done) {
    done("Task Failed");
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

## FAQ ##

### Q: What about file watching? ###

__A__: Nothing built-in yet, still trying to figure out if I'm comfortable with cluttering up the `.dullfile`(s) with watcher config stuff. For now check out [this gist](https://gist.github.com/tivac/6591278).
