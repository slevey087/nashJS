"use strict";

var log = require("../logger");
log("debug", "Loading Class: Loop");

//Game state controllers
var { registry } = require("../state");
var { gameHistory, History } = require("../history");

//Helper functions
var { idHandler } = require("../helper-functions")("state");
var { chainerGenerator } = require("../helper-functions")("playable");

// Information mechanics
var { Information, PerfectInformation } = require("../information");
var { gamePopulation } = require("../population");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Loop

function _Loop(id, playable, count, parameters) {
	_Playable.call(this, id, parameters);

	var { logContinue = true, playableParameters = {} } = parameters;

	this.playable = registry.playables[playable.id()];
	this.logContinue = logContinue;
	this.playableParameters = playableParameters;

	this.count = count;

	registry.loops[id] = this;
}
_Loop.prototype = Object.create(_Playable.prototype);
_Loop.prototype.constructor = _Loop;

_Loop.registryName = "loops";
_Loop.counterName = "loop";

_Loop.prototype.play = function({
	history = this.history || gameHistory,
	information = this.information || PerfectInformation,
	playableParameters = this.playableParameters
} = {}) {

	var loop = this;
	loop.counter = 0;

	// Split the history entry
	var loopHistory = history.child();

	// information mechanics.
	//compartmentalize If set
	if (loop.compartmentalize) {
		information = new Information(loop.compartmentalize.history || loopHistory,
			loop.compartmentalize.population || information.population);
	}
	// Pass along
	playableParameters.information = information


	var promise = Promise.resolve();

	var action = function(result) {
		//If the game has been ended early, don't continue.
		if (history.stop) return { playable: loop };

		loop.counter++;
		if (!result) result = {};

		//Deal with history
		history.log.add({
			loop: loop.id,
			loopTo: loop.playable.id,
			count: loop.counter
		});

		playableParameters.shortCircuit = true;
		playableParameters.history = loopHistory;

		return loop.playable.play(playableParameters).then(function(result) {
			//Re-format result, replace playable with Loop playable
			result.playable = loop;

			//TODO: add information mechanisms

			return Promise.resolve(result);
		});
	};

	//Repeat the playable loop.count times, by chaining promises.
	for (var i = 0; i < loop.count; i++) {
		promise = promise.then(action);
	}

	return promise.then(function(result) {
		result.historyEntry = {
			loop: loop.id,
			count: loop.counter,
			action: loopHistory.orphan()
		};
		return Promise.resolve(result);
	});
};

//Overwrite history handler to prevent "loop finished" entry from hitting the tree.
_Loop.prototype.handleHistory = function({
		history = this.history || gameHistory,
		information = this.information || PerfectInformation,
		logContinue = this.logContinue
	} = {},
	result
) {
	var loop = this;

	return Promise.resolve(result).then(function(result) {
		//Write final entry if logContinue is set to true
		if (logContinue) {
			history.log.add({
				loop: loop.id,
				loopTo: "Loop finished.",
				count: loop.counter
			});
		}

		history.addNoLog(result.historyEntry);

		return result;
	});
};

// Add detail/nesting to summary.
_Loop.prototype.summaryThis = function(summary, entries) {
	summary.count = this.count;

	summary.action = {};
	this.playable.summarize(summary.action, entries, true);
};

function Loop(playable, count = 1, parameters = {}) {
	var id = idHandler(parameters.id, "loop");

	//Create backend loop object
	var _loop = new _Loop(id, playable, count, parameters);

	//Return this reference object to the user. Run the function to select a source
	var loop = Playable(_loop);
	return loop;
}

module.exports = { _Loop, Loop };
