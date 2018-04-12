"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

// helper functions
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")

// Play-time logic
var { Expression } = require("../lib/logic");


var MatchingPennies = gameWrapper(function(players, payoff = 1, parameters = {}) {
	parameters.id = parameters.id || "Matching-Pennies";

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
