"use strict";

var log = require('../logger');
log("debug", "Loading Class: Lambda")

//Game state controllers
var { registry } = require('../state');
var Promise = registry.Promise; // For sync mode
var { gameHistory } = require("../history");

// Information mechanics
var { PerfectInformation } = require("../information");

//Helper functions
var { isFunction } = require('../helper-functions')("general");
var { idHandler } = require('../helper-functions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');


//Backend function class for lambda
class _Lambda extends _Playable {
	constructor(id, action, parameters = {}) {
		super(id, parameters);

		this.action = action
	}


	play({ history, information } = {}) {

		var lambda = this;

		var result = lambda.action({ history, information })

		var resultObject = {
			result,
			'playable': lambda,
			historyEntry: {
				lambda: lambda.id,
				result
			}
		};

		return Promise.resolve(resultObject)
	};

	// Simple helper to just run synchronously whatever the Lambda is. Useful for debugging.
	run(...args) {
		return this.action(...args);
	}

	summaryThis(summary) {
		summary("action", this.action.toString());
		return summary
	}
}
_Lambda.registryName = "lambdas";
_Lambda.counterName = "lambda";



// Frontend class for Lambda
class Lambda extends Playable {
	constructor(action = function () { }, parameters = {}) {
		var id = idHandler(parameters.id, "lambda")

		// Throw if not a function
		if (!isFunction(action)) throw new Error("action must be a function")

		//Create backend lambda object
		var _lambda = new _Lambda(id, action, parameters);

		super(_lambda);
	}

	run(...args) {
		return registry.lambdas[this.id()].run(...args)
	}
}


module.exports = { _Lambda, Lambda };
