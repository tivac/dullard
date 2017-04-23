"use strict";

module.exports = function(step) {
    var name = "anonymous";

    if(step.name) {
        name = step.name;
    } else if(typeof step === "string") {
        name = step;
    }

    return name;
};
