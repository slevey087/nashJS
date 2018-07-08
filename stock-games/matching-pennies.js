"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

// NashJS engine components
var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Play-time logic
var { Expression } = Engine.Frontend


var MatchingPennies = gameWrapper(function(players, parameters = {}) {
	parameters.id = parameters.id || "Matching-Pennies";
	payoff = parameters.payoff || 1;

	var win = payoff;
	var lose = Expression(function() {
		return -payoff;
	});

	var choices = [
		["Heads", "Tails"],
		["Heads", "Tails"]
	];

	var payoffs = [
		[win, lose],
		[lose, win]
	];

	return SimpleZeroSum(players, choices, payoffs, parameters);
});

// Matching Pennies
module.exports = MatchingPennies;
