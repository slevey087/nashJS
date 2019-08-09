"use strict";

var log = require('../logger');
log("debug", "Loading Class: Stochastic-Halt")

//Game state controllers
var { registry, gameHistory } = require('../state');
var Promise = registry.Promise; // For sync mode

//Helper functions
var { isFunction } = require('../helper-functions')("general");
var { idHandler } = require('../helper-functions')("state");

//Parent class
var { Playable } = require('./playable');
var { _Halt, } = require('./halt-if');


//Backend function class for SHalt
class _StochasticHalt extends _Halt {
	constructor(id, probability, parameters = {}) {
		super(id, null, parameters)
		var sHalt = this;

		sHalt.probability = probability
		sHalt.generator = Math.random // TODO: allow user-supplied generators

		sHalt.testCondition = function () {
			if (sHalt.generator() < sHalt.probability) return true;
		}
	}

	summaryThis(summary) {
		summary("probability", this.probability);
	}
}

_StochasticHalt.registryName = "stochastics";
_StochasticHalt.counterName = "stochasticHalt";

/*
_SHalt.prototype.play = function({initializePlayers=false, shortCircuit=false}={}){

	var sHalt = this;
	var test = sHalt.testCondition();

	if (test) {
		log("info", "Halting at " + sHalt.id)

		return Promise.reject({
			result:"Halt",
			playable:sHalt
		});
	}

	var resultObject = {
		'result':"Continued",
		'playable':sHalt
	};

	return Promise.resolve(resultObject)
	.then(function(result){

		//TODO: add information mechanisms

		return Promise.resolve(result)
	}).then(function(result){

		return sHalt.proceed(result, shortCircuit);
	});
};
*/

class StochasticHalt extends Playable {
	constructor(probability, parameters = {}) {
		var id = idHandler(parameters.id, "stochasticHalt")

		if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');

		//Create backend sHalt object
		var _stochasticHalt = new _StochasticHalt(id, probability, parameters);

		super(_stochasticHalt);
	}
}

module.exports = { _StochasticHalt, StochasticHalt };
