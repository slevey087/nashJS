"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Play-time logic
var { Expression } = Engine.Frontend


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
