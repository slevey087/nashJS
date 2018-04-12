"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

// helper functions
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")

// Play-time logic
var { Expression } = require("../lib/logic");

// Rock-Paper-Scissors
var RockPaperScissors = gameWrapper(function(players, payoff = 1, parameters = {}) {
	parameters.id = parameters.id || "Rock-Paper-Scissors";

	var win = payoff;
	var lose = Expression(function() {
		return -payoff;
	});

	var choices = [
		["Rock", "Paper", "Scissors"],
		["Rock", "Paper", "Scissors"]
	];
	var payoffs = [
		[0, lose, win],
		[win, 0, lose],
		[lose, win, 0]
	];

	return SimpleZeroSum(players, choices, payoffs, parameters);
});

module.exports = RockPaperScissors
