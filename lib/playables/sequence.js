"use strict";

var log = require("../logger");
log("debug", "Loading Class: Sequence");

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode
var { gameHistory } = require("../history");

//Helper functions
var { idHandler } = require("../helper-functions")("state");

//Information
var { Information, PerfectInformation } = require("../information");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Sequence
function _Sequence(id, playableStart, playableFinish, parameters = {}) {
	_Playable.call(this, id, parameters);

	this.playableStart = registry.playables[playableStart.id()];
	this.playableFinish = registry.playables[playableFinish.id()];
}
_Sequence.prototype = Object.create(_Playable.prototype);
_Sequence.prototype.constructor = _Sequence;

_Sequence.registryName = "sequences";
_Sequence.counterName = "sequence";

_Sequence.prototype.play = function ({ history, information } = {}) {

	var sequence = this;

	//Log the history appropriately
	var startEntry = {
		sequence: sequence.id,
		action: "start"
	};
	history.log.add(startEntry);

	//History object to give to sequenced playables.
	var sequenceHistory = history.child();

	//compartmentalize if set. "compartmentalize" means pass on information as if this playable is the entire game.
	if (sequence.compartmentalize) {
		information = new Information(sequence.compartmentalize.history || sequenceHistory,
			sequence.compartmentalize.population || information.population);
	}

	// Recursion down the chain of playables
	var action = function action(result) {
		//Stop if the game is over.
		if (history.stop) return { playable: sequence };

		//Otherwise, recurse to figure out what to do next.
		if (Array.isArray(result)) {
			log("silly", "sequence.play: Next-item is an array, splitting into pieces.");

			return Promise.all(
				result.map(function (item) {
					log("silly", "sequence.play: recursing on", item);
					return action(item);
				})
			);
		}

		if (result.playable !== sequence.playableFinish) {
			log("silly", result);

			if (result.playable.findNext({ result }).length > 0) {
				log("silly", "Playable has next-item, continuing down chain.");

				return result.playable.playNext(result, { shortCircuit: true, history: sequenceHistory, information })
					.then(action); //Repeat for next playable in chain
			}
			return Promise.resolve(result);
		}
		return Promise.resolve(result);
	};

	return sequence.playableStart
		.play({ shortCircuit: true, history: sequenceHistory, information })
		.then(action)
		.then(function (result) {
			result.historyEntry = {
				sequence: sequence.id,
				action: sequenceHistory.orphan()
			};

			//TODO: add information mechanisms

			return Promise.resolve(result);
		});
};

//Overwrite history handler so that tree doesn't have "start" and "finish" entries.
_Sequence.prototype.handleHistory = function ({ history = gameHistory } = {},
	result
) {
	var sequence = this;

	return Promise.resolve(result).then(function (result) {
		history.log.add({
			sequence: sequence.id,
			action: "finish",
			duration: result.historyEntry.duration
		});

		history.addNoLog(result.historyEntry);
		return Promise.resolve(result);
	});
};

//TODO: finish this!
_Sequence.prototype.summaryThis = function (summary, entries, shortCircuit) {
	summary.action = {};

	this.playableStart.summarize(
		summary.action,
		entries,
		(shortCircuit = this.playableFinish)
	);
};

function Sequence(playableStart, playableFinish, parameters = {}) {
	var id = idHandler(parameters.id, "sequence");

	//Create backend loop object
	var _sequence = new _Sequence(id, playableStart, playableFinish, parameters);

	//Return this reference object to the user. Run the function to select a source
	var sequence = Playable(_sequence);
	return sequence;
}

module.exports = { _Sequence, Sequence };
