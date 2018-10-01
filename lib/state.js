"use strict";

var log = require('./logger');

log("debug", "state: Creating game state variables.")


var registry = {}
registry.Promise = {}; // Necessary for sync mode
registry._addType_ = function(type) {
	registry[type] = {};
	log("silly", "state: adding registry entry: ", type)
};


var idCounters = {}
idCounters._addType_ = function(type) {
	idCounters[type] = 0
	log("silly", "state: adding counter entry: ", type)
};




module.exports = { registry, idCounters };
