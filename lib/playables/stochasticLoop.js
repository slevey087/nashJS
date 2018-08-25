"use strict";

var log = require('../logger');
log("debug", "Loading Class: StochasticLoop")

//Game state controllers
var { registry, gameHistory } = require('../state');

//Helper functions
var { idHandler } = require('../helper-functions')("state");
var { chainerGenerator } = require('../helper-functions')("playable");

//Parent classes
var { _Playable, Playable } = require('./playable');
var { _Loop, Loop } = require('./loop');


//Backend function class for StochasticLoop
function _SLoop(id, playable, probability, parameters) {
	_Loop.call(this, id, playable, null, parameters);

	this.playable = registry.playables[playable.id()];

	//This inherits from Loop which uses a count. Delete that and replace with probability.
	delete this.count;
	this.probability = probability;

	this.generator = Math.random; //TODO: allow user to specify random number generator

	registry.sLoops[id] = this;
}
_SLoop.prototype = Object.create(_Loop.prototype);
_SLoop.prototype.constructor = _SLoop;

_SLoop.registryName = "sLoops";
_SLoop.counterName = "stochasticLoop";


_SLoop.prototype.play = function({
	initializePlayers = false,
	shortCircuit = false,
	history = gameHistory,
	information: PerfectInformation
} = {}) {

	var sLoop = this;
	sLoop.counter = 0;
	var loopHistory = history.child();

	if (sLoop.compartmentalize) {
		information = new Information(sLoop.compartmentalize.history || loopHistory,
			sLoop.compartmentalize.population || information.population);
	}


	var promise = Promise.resolve({});

	//Section that will be looped
	var action = function(result) {

		sLoop.counter++;
		if (!result) result = {};


		//Deal with history
		history.log.add({
			loop: sLoop.id,
			loopTo: sLoop.playable.id,
			count: sLoop.counter
		});

		return sLoop.playable.play({ shortCircuit: true, history: loopHistory, information })
			.then(function(result) {

				result.playable = sLoop;
				//TODO: add information mechanisms

				return Promise.resolve(result)
			});
	};


	//Generate random numbers, repeat while number is above halting probability
	while (sLoop.generator() > sLoop.probability) {
		promise = promise.then(action);
	}


	return promise.then(function(result) {

		result.historyEntry = {
			loop: sLoop.id,
			count: sLoop.counter,
			action: loopHistory.orphan()
		};

		return Promise.resolve(result);
	});
};

_SLoop.prototype.summaryThis = function(summary, entries) {
	summary.probability = this.probability;

	summary.action = {}
	this.playable.summarize(summary.action, entries, true)
}


//User interface
function StochasticLoop(playable, probability = .5, parameters = {}) {
	var id = idHandler(parameters.id, "stochasticLoop")

	if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');

	//Create backend sLoop object
	var _sLoop = new _SLoop(id, playable, probability, parameters);


	//Return this reference object to the user. Run the function to select a source
	var sLoop = Playable(_sLoop);
	return sLoop;
}



module.exports = { _SLoop, StochasticLoop };
