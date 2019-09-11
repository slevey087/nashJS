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
var { Information } = require("../information");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Sequence
class _Sequence extends _Playable {
	constructor(id, playableStart, playableFinish, parameters = {}) {
		super(id, parameters);

		this.playableStart = playableStart;
		this.playableFinish = playableFinish;
	}


	summaryThis(summary) {
		this.playableStart.summarize(
			summary.branch("action"),
			this.playableFinish
		);

		return summary;
	}

	//Overwrite history handler so that tree doesn't have "start" and "finish" entries.
	handleHistory({ history = gameHistory } = {}, result) {
		var sequence = this;

		return Promise.resolve(result).then(function (result) {
			history.log.add({
				sequence: sequence.id,
				action: "finish",
				duration: result.historyEntry.duration
			});

			history.addNoLog(result.historyEntry);
			return result;
		});
	}

	play({ history, information } = {}) {

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

				if (result.playable.findNext(result).length > 0) {
					log("silly", "Playable has next-item, continuing down chain.");

					return result.playable.playNext({ shortCircuit: true, history: sequenceHistory, information }, result)
						.then(action); //Repeat for next playable in chain
				}
			}
			return Promise.resolve(result);
		};

		return sequence.playableStart
			.play({ shortCircuit: true, history: sequenceHistory, information })
			.then(action)
			.then(function () {
				return {
					historyEntry: {
						sequence: sequence.id,
						action: sequenceHistory.orphan()
					}
				}
			});
	}
}
_Sequence.registryName = "sequences";
_Sequence.counterName = "sequence";



class Sequence extends Playable {
	constructor(playableStart, playableFinish, parameters = {}) {
		var id = idHandler(parameters.id, "sequence");

		if (!(playableStart instanceof Playable) || !(playableFinish instanceof Playable)) throw new Error("playableStart and playableFinish must be playables.")

		playableStart = registry.playables[playableStart.id()]
		playableFinish = registry.playables[playableFinish.id()]

		//Create backend sequence object
		var _sequence = new _Sequence(id, playableStart, playableFinish, parameters);

		super(_sequence)
	}
}


module.exports = { _Sequence, Sequence };
