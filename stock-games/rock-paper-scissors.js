"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Play-time logic
var { Expression } = Engine.Frontend


// Rock-Paper-Scissors
var RockPaperScissors = gameWrapper(function(players, parameters = {}) {
	parameters.id = parameters.id || "Rock-Paper-Scissors";
	parameters.payoff = parameters.payoff || 1;

	var win = parameters.payoff;
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
