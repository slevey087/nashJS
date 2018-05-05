"use strict";

// Base game
var prisonerDilemma = require("./prisoner-dilemma").createGenerator();

// NashJS engine components
var Engine = require("../lib/engine")

// game engine
var { Loop } = Engine.FrontEnd.Playables;

// helper functions
var { gameWrapper } = Engine.BackEnd.HelperFunctions("stock-games")

// Game utility
var Iterated = require("./iterated")



var IteratedPrisonerDilemma = gameWrapper(function(players, numberIterations = 50, parameters = {}) {
	return Iterated(players, prisonerDilemma, "Prisoner-Dilemma", numberIterations, parameters)
}, {
	strategyLoader: function() {
		return [{
			strategy: function() {
				this.choose = function(choices, information) {
					if (information.opponent.history.length) return information.opponent.history[information.opponent
							.history.length - 1]
						.result
					else return "Cooperate";
				}
			},
			name: "Tit-For-Tat"
		}]
	}
});
// TODO validate arguments

module.exports = IteratedPrisonerDilemma
