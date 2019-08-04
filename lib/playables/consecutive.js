"use strict";

var log = require("../logger");
log("debug", "Loading Class: Consecutive");

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

//Backend function class for Consecutive
class _Consecutive extends _Playable {
	constructor(id, playablesArray, parameters = {}) {
		super(id, parameters);

		this.playablesArray = playablesArray
	}

	play({ history, information } = {}) {
		var consecutive = this;

		//Log the history appropriately
		var startEntry = {
			consecutive: consecutive.id,
			action: "start"
		};
		history.log.add(startEntry);

		//History object to give to consecutived playables.
		var consecutiveHistory = history.child();

		//compartmentalize if set. "compartmentalize" means pass on information as if this playable is the entire game.
		if (consecutive.compartmentalize) {
			information = new Information(consecutive.compartmentalize.history || consecutiveHistory,
				consecutive.compartmentalize.population || information.population);
		}

		var action = function action(playablesArray) {
			//Stop if the game is over.
			if (history.stop) return { playable: consecutive };

			if (playablesArray.length > 0) {
				return playablesArray.shift().play({ shortCircuit: true, history: consecutiveHistory, information })
					.then(function (result) {
						return action(playablesArray) || result
					})
			} else return false
		}

		return action(consecutive.playablesArray.slice())
			.then(function (result) {
				result.historyEntry = {
					consecutive: consecutive.id,
					action: consecutiveHistory.orphan()
				};

				//TODO: add information mechanisms

				return Promise.resolve(result);
			});
	}

	//Overwrite history handler so that tree doesn't have "start" and "finish" entries.
	handleHistory({ history = gameHistory } = {},
		result
	) {
		var consecutive = this;

		return Promise.resolve(result).then(function (result) {
			history.log.add({
				consecutive: consecutive.id,
				action: "finish",
				duration: result.historyEntry.duration
			});

			history.addNoLog(result.historyEntry);
			return Promise.resolve(result);
		});
	};


	summaryThis(summary, entries, shortCircuit) {
		// Fetch summaries for each choice.
		summary.array("action", this.playablesArray, function (playable, summary) {
			return playable.summarize(summary, true) // short-circuit summary
		});

		return summary;
	};
}

_Consecutive.registryName = "consecutives";
_Consecutive.counterName = "consecutive";


// Frontend class for Consecutive
class Consecutive extends Playable {
	constructor(playablesArray, parameters = {}) {
		var id = idHandler(parameters.id, "consecutive");

		var _playablesArray = playablesArray.map(function (playable) {
			return registry.playables[playable.id()]
		})

		//Create backend consecutive object
		var _consecutive = new _Consecutive(id, _playablesArray, parameters);

		super(_consecutive);

		this.ids = function () {
			return playablesArray.map(function (playable) {
				return playable.id();
			})
		}
	}
}
/*
function Consecutive(playablesArray, parameters = {}) {
	var id = idHandler(parameters.id, "consecutive");

	//Create backend loop object
	var _consecutive = new _Consecutive(id, playablesArray, parameters);

	//Return this reference object to the user. Run the function to select a source
	var consecutive = Playable(_consecutive);

	consecutive.ids = function () {
		return playablesArray.map(function (playable) {
			return playable.id();
		})
	}

	return consecutive;
}
*/
module.exports = { _Consecutive, Consecutive };
