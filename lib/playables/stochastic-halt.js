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
var { _Playable, Playable } = require('./playable');
var { _Halt, Halt } = require('./halt-if');


//Backend function class for SHalt
function _SHalt(id, probability, parameters) {
	_Halt.call(this, id, null, parameters);

	var sHalt = this;

	this.probability = probability;
	this.generator = Math.random; //TODO: allow user to specify random number generator

	this.testCondition = function () {
		if (sHalt.generator() < sHalt.probability) return true;
	};
}
_SHalt.prototype = Object.create(_Halt.prototype);
_SHalt.prototype.constructor = _SHalt;

_SHalt.registryName = "stochastics";
_SHalt.counterName = "stochasticHalt";

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

_SHalt.prototype.summaryThis = function (summary, entries) {
	summary("probability") = this.probability;
}


function StochasticHalt(probability, parameters = {}) {
	var id = idHandler(parameters.id, "stochasticHalt")

	if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');

	//Create backend sHalt object
	var _sHalt = new _SHalt(id, probability, parameters);

	//Return this reference object to the user. Run the function to select a source
	var sHalt = Playable(_sHalt);
	return sHalt;
}


module.exports = { _SHalt, StochasticHalt };
