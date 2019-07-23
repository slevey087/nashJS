"use strict";

var log = require('../logger');
log("debug", "Loading Class: HaltIf")

//Game state controllers
var { registry } = require('../state');
var Promise = registry.Promise; // For sync mode
var { gameHistory } = require('../history');

//Helper functions
var { isFunction } = require('../helper-functions')("general");
var { idHandler } = require('../helper-functions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');

//Backend function class for Halt
class _Halt extends _Playable {
	constructor(id, testCondition, parameters) {
		super(id, parameters)

		this.testCondition = testCondition;
		this.logContinue = false || parameters.logContinue;
	}

	play({ history }) {
		var halt = this;

		var resultObject = {
			'playable': halt,
			'historyEntry': {
				'halt': halt.id
			}
		};

		if (halt.testCondition()) {
			log("info", "Halting at " + halt.id)

			resultObject.historyEntry.action = "halt";
			resultObject.result = "Halt";

			history.end();
			return Promise.reject(resultObject);
		}

		//Halt probably gets used for loops, and we might not want to see lots of continue messages, so "logContinue" will omit them.
		if (halt.logContinue) {
			resultObject.historyEntry.action = "continue";
		} else delete resultObject.historyEntry


		return Promise.resolve(resultObject)
	}

	summaryThis(summary) {
		summary("condition") = this.testCondition.toString();
	}
}


_Halt.registryName = "halts";
_Halt.counterName = "haltIf";


class HaltIf extends Playable {
	constructor(testCondition = function () { }, parameters = {}) {
		var id = idHandler(parameters.id, "haltIf")

		if (!isFunction(testCondition)) log("warn", id +
			": testCondition should be a function, or else game will not halt.")

		//Create backend _halt object
		var _halt = new _Halt(id, testCondition, parameters);
		super(_halt);
	}
}


module.exports = { _Halt, HaltIf };
