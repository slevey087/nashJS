"use strict";

var log = require('../logger');

//Helper functions
var { isObject } = require('../helper-functions')("general");
var { idHandler } = require('../helper-functions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');

// Information mechanics
var { Information, PerfectInformation } = require('../information');


//Backend class
function _Simultaneous(id, playableArray, { playableParameters = {} } = {}) {
	_Playable.call(this, id);

	this.playableArray = playableArray;
	this.playableParameters = playableParameters;

	registry.controllers[id] = this;
}

_Simultaneous.prototype = Object.create(_Playable.prototype);
_Simultaneous.prototype.constructor = _Simultaneous;

_Simultaneous.registryName = "controllers";
_Simultaneous.counterName = "simultaneous";


//Simultaneous Promise.all's the playables, which causes them to run meshed.
_Simultaneous.prototype.play = function({ history = gameHistory, information = PerfectInformation } = {}) {

	var simultaneous = this;

	// Deal with history. Log start, then split history for children playables to fill in.
	history.log.add({
		simultaneous: simultaneous.id,
		action: "Simultaneous start."
	});
	var simultaneousHistory = []



	//TODO: is information mechanics correct?

	return Promise.all(simultaneous.playableArray.map(function(playable) {

		var branchHistory = history.child();
		simultaneousHistory.push(branchHistory)

		// Information mechanics
		var infoPopulation, parentHistory, infoHistory = branchHistory;
		//compartmentalize if set. "compartmentalize" means pass on information as if this playable is the entire game.
		if (simultaneous.compartmentalize) {
			infoPopulation = simultaneous.compartmentalize.population || information.population;
			parentHistory = simultaneous.compartmentalize.history || information.history;
		} else {
			infoPopulation = information.population;
			parentHistory = information.history
		}
		var simultaneousInformation = new Information(infoHistory, infoPopulation, { parentHistory });



		return playable.play({ history: branchHistory, information: simultaneousInformation });
	})).then(function(resultArray) {

		var resultObject = {
			resultArray,
			playable: simultaneous,
			historyEntry: {
				simultaneous: simultaneous.id,
				action: simultaneousHistory.map(function(history) {
					return history.orphan();
				})
			}
		};
		return resultObject;
	});
};


_Simultaneous.prototype.handleHistory = function({ history = gameHistory } = {}, result) {

	history.log.add({
		simultaneous: this.id,
		action: "Simultaneous complete."
	});

	history.addNoLog(result.historyEntry);

	return Promise.resolve(result);
};

_Simultaneous.prototype.summaryThis = function(summary, entries) {
	summary.action = [];

	this.playableArray.forEach(function(playable, index) {
		summary.action[index] = {}
		playable.summarize(summary.action[index], entries);
	});
}


//Frontend class
function Simultaneous(playableArray, parameters = {}) {
	var id = idHandler(parameters.id, "simultaneous")

	playableArray = playableArray.map(function(playable) {
		return registry.playables[playable.id()];
	});


	//Create backend instance.
	var _simultaneous = new _Simultaneous(id, playableArray, parameters);

	//Return this reference object to the user. Run the function to select a source
	var simultaneous = Playable(_simultaneous);
	return simultaneous;
}


module.exports = { _Simultaneous, Simultaneous };
