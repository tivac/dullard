"use strict";

// Attempts to read a task off disk
module.exports = function(tasks, name) {
    var task;

    if(typeof name === "function") {
        return name;
    }

    if(!(name in tasks)) {
        return false;
    }

    // Task is already loaded
    if(typeof tasks[name] === "function") {
        return tasks[name];
    }

    // Unloaded task, require and attach source info
    task = require(tasks[name].source);
    task.source = tasks[name].source;

    return task;
};
