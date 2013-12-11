Dullard
=======
[![Build Status](https://travis-ci.org/tivac/dullard.png?branch=master)](https://travis-ci.org/tivac/dullard)
[![NPM version](https://badge.fury.io/js/dullard.png)](http://badge.fury.io/js/dullard)
[![Dependency Status](https://gemnasium.com/tivac/dullard.png)](https://gemnasium.com/tivac/dullard)
[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/tivac/dullard/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

Doing the same task repeatedly is boring. Let the computer do it instead.

## Usage ##

```
Let the computers do the boring stuff.
Usage: dullard -d <dir>,...,<dirN> <step1> ... <stepN>

Options:
  --help, -?     Show usage
  --dirs, -d     directories to load task files from
  --list, -l     List available tasks
  --loglevel     Chattiness, one of: silly, verbose, info, warn, error, & silent  [default: "info"]
  --quiet, -q    Minimal output
  --silent       No output until something goes awry
  --verbose, -v  Verbose logging
```

## Config ##

Dullard will look for a file named `.dullfile` in the current directory or any parent directories & merge it with the CLI options (CLI takes precendence). It will merge all found results in the current branch of the directory tree with precedence being: `CLI > Local > Parent > ... > Root`.

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

`dirs` is an array of directories to load tasks from. `steps` is one of two options: 1) an array of strings/functions or 2) an object containing named step collections that are each an array of strings/functions. Strings should match either the names of files in the task directories stripped of their extension or the name of a step collection.

The config object will be passed as the first argument (`config` by convention) to [tasks](#tasks).

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
