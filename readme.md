Dullard
=======

Doing the same task repeatedly is boring. Let the computer do it instead.

[![Build Status](https://travis-ci.org/tivac/dullard.png?branch=master)](https://travis-ci.org/tivac/dullard)
[![Packages](https://david-dm.org/tivac/dullard/status.png)](https://david-dm.org/tivac/dullard/)
[![Dev Packages](https://david-dm.org/tivac/dullard/dev-status.png)](https://david-dm.org/tivac/dullard/)

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

Dullard will look for a file named `dullfile.js` or `dullfile.json` in the current directory or any parent directories & merge it with the CLI options (CLI takes precendence). For now it'll stop after the first match, but eventually it'll merge all found results in the current branch of the directory tree with precedence being: `CLI -> Local -> Parent -> ... -> Root`.

### Example Config ###

JSON version

```
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

```
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

## Tasks ##

Tasks are simple modules that should export a single function. Each task function gets passed two arguments, a shared config object for state in the task chain & an optional callback for async tasks. The callback takes two possible arguments, an error object and an optional object to replace the shared config object. If the task is synchronous any return value will be considered an error.

```
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
