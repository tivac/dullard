Dullard
=======

Doing the same task repeatedly is boring. Let the computer do it instead.

[![Build Status](https://travis-ci.org/tivac/dullard.png?branch=master)](https://travis-ci.org/tivac/dullard)
[![NPM version](https://badge.fury.io/js/dullard.png)](http://badge.fury.io/js/dullard)
[![Dependency Status](https://gemnasium.com/tivac/dullard.png)](https://gemnasium.com/tivac/dullard)

## Usage ##

```
Let the computers do the boring stuff.
Usage: dullard -d <dir>,...,<dirN> <step1> ... <stepN>

Options:
  --dirs, -d   directories to load task files from  [default: []]
  --help, -?   Show usage
  --quiet, -q  Minimal output                       [default: false]
```

## Config ##

Dullard will look for a file named `dullfile.js` or `dullfile.json` in the current directory or any parent directories & merge it with the CLI options (CLI takes precendence). It will merge all found results in the current branch of the directory tree with precedence being: `CLI -> Local -> Parent -> ... -> Root`.

### Example Config ###

JSON version

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

JS version

```javascript
/*jshint node:true */

"use strict";

module.exports = {
    "dirs" : [
        "../../tasks-a"
    ],
    
    "steps" : [
        "fooga"
    ]
};
```

`dirs` is an array of directories to load tasks from. `steps` is an array of strings or functions. Strings should match the names of files in the task directories stripped of their extension.

The config object will be passed as the first argument (`config` by convention) to [tasks](#tasks).

## Tasks ##

Tasks are simple modules that should export a single function. Each task function gets passed two arguments, a shared config object for state in the task chain & an optional callback for async tasks. The callback takes two possible arguments, an error object and an optional object to replace the shared config object. If the task is synchronous any return value will be considered an error.

```javascript
function exampleTaskSync(config) {
    ...
}

function exampleTaskAsync(config, done) {
    ...

    process.nextTick(done);
}

function exampleTaskFailureSync(config) {
    return "Task failed";
}

function exampleTaskFailureAsync(config, done) {
    done("Task Failed");
}
```
