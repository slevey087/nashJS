"use strict";

var log = require('../logger');
log("debug", "Loading Class: Lambda")

//Game state controllers
var { registry, gameHistory } = require('../state');

// Information mechanics
var { PerfectInformation } = require("../information");

//Helper functions
var { isFunction } = require('../helperFunctions')("general");
var { idHandler } = require('../helperFunctions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');



//Backend function class for Game
function _Lambda(id, action, parameters = {}) {
	_Playable.call(this, id);

	this.action = action;

	registry.lambdas[id] = this;
}
_Lambda.prototype = Object.create(_Playable.prototype);
_Lambda.prototype.constructor = _Lambda

_Lambda.registryName = "lambdas";
_Lambda.counterName = "lambda";


_Lambda.prototype.play = function({ initializePlayers = false, shortCircuit = false, history = gameHistory,
	information = PerfectInformation } = {}) {

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
_Lambda.prototype.run = function() {
	return this.action();
}

_Lambda.prototype.summaryThis = function(summary) {
	summary.action = this.action.toString();
}


function Lambda(action = function() {}, parameters = {}) {
	var id = idHandler(parameters.id, "lambda")

	if (!isFunction(action)) log("warn", id + ": action should be a function.")

	//Create backend lambda object
	var _lambda = new _Lambda(id, action, parameters);


	//Return this reference object to the user. Run the function to select a source
	var lambda = Playable(_lambda);


	lambda.run = function() {
		return _lambda.run();
	}

	return lambda;
}


module.exports = { _Lambda, Lambda };
