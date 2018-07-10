"use strict";

// Base game
var prisonerDilemma = require("./prisoner-dilemma").createGenerator();

// NashJS engine components
var Engine = require("../lib/engine")

// game engine
var { Loop } = Engine.Frontend.Playables;

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Game utility
var Iterated = require("./iterated")



var IteratedPrisonerDilemma = gameWrapper(function(players, numberIterations = 50, parameters = {}) {
	return Iterated(players, prisonerDilemma, "Prisoner-Dilemma", numberIterations, parameters)
}, {
	queryLoader() {
		return [{
				name: "@IPD-choices",
				query: "$map($.[action].results, function($l){$l.result})",
				description: "Results, organized by round."
			},
			{
				name: "@IPD-players",
				query: "$map($.[action].results, function($l){$l.player})",
				description: "Players, organized by round."
			},
			{
				name: "@IPD-payouts",
				query: "$.action.payouts",
				description: "Payouts, as array of objects."
			}
		]
	},
	strategyLoader() {
		return [{
				name: "Tit For Tat",
				description: "Do whatever your opponent did last turn. Cooperate if this is the first turn.",
				strategy: function titForTat() {
					this.choose = function(choices, information) {
						if (information.opponent.history.length) return information.opponent.history[information.opponent
								.history.length - 1]
							.result
						else return "Cooperate";
					}
				}
			},
			{
				name: "Grudger",
				description: "Cooperate until your opponent doesn't, then Defect.",
				strategy: function grudger() {
					this.cooperating = true

					this.choose = function(choices, information) {

						// If opponent just defected, then stop cooperating
						if (information.opponent.history.length) {
							if (information.opponent.history[information.opponent.history.length - 1].result == "Defect") this
								.cooperating = false;
						}

						if (this.cooperating) return "Cooperate";
						else return "Defect";
					}
				}
			},

			{
				name: "Naive Prober",
				description: "Like Tit For Tat, but occasionally Defects with small probability",
				strategy: function prober(probability = 0.1) {
					this.choose = function(choices, information) {
						if (Math.random() < probability) return "Defect";

						if (information.opponent.history.length) return information.opponent.history[information.opponent
								.history.length - 1]
							.result
						else return "Cooperate";
					}
				}
			},

			{
				name: "Tit For Two Tats",
				description: "Cooperates on the first move, then Defects only when the opponent Defects two times",
				strategy: function TF2T() {
					this.choose = function(choices, information) {
						if (information.opponent.history.length > 1) {
							if (information.opponent.history[information.opponent.history.length - 1].result == "Defect" &&
								information.opponent.history[information.opponent.history.length - 2].result == "Defect") return "Defect";
							else return "Cooperate";
						} else return "Cooperate";
					}
				}
			}

		]
	}
});
// TODO validate arguments

module.exports = IteratedPrisonerDilemma
