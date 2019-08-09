"use strict";

var log = require("../logger");
log("debug", "Loading Class: Halt");

// Parent class
var { _Playable, Playable } = require("./playable");

// Helper functions
var { idHandler } = require("../helper-functions")("state");

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode

class _Halt extends _Playable {
    constructor(id, parameters = {}) {
        super(id, parameters);
    }

    play({ history }) {
        // short and sweet

        history.end();
        log("info", "Halting at " + this.id)

        return Promise.resolve({
            historyEntry: {
                halt: this.id
            }
        });
    }
}
_Halt.registryName = "halts";
_Halt.counterName = "halt";

class Halt extends Playable {
    constructor(parameters = {}) {  // myArgs can actually be more than one argument
        var id = idHandler(parameters.id, _Halt.counterName);



        var _halt = new _Halt(id, parameters);
        super(_halt);
    }
}

module.exports = { _Halt, Halt };
