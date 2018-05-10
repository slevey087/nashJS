"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

//NashJS engine components
var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");

// play-time logic
var { Variable, Expression } = Engine.Frontend;


var prisonerDilemma = gameWrapper(function(players, {
	id = "Prisoner-Dilemma",
	payoffScale = Variable(1),
	payoffSpread = Variable(4)
} = {}) {
	//TODO: fix the case of negative scale.

	var lowerMiddle = Expression(function() {
		return payoffScale * (1 + (payoffSpread - 1) * 1 / 3);
	});
	var upperMiddle = Expression(function() {
		return payoffScale * (1 + (payoffSpread - 1) * 2 / 3);
	});
	var upper = Expression(function() {
		return payoffScale * payoffSpread;
	});

	// Pass along parameters, be sure to include id.
	var parameters = arguments[1] || {};
	parameters.id = parameters.id || id;

	var choices = [
		["Cooperate", "Defect"],
		["Cooperate", "Defect"]
	];
	var payoffs = [
		[
			[upperMiddle, upperMiddle],
			[payoffScale, upper]
		],
		[
			[upper, payoffScale],
			[lowerMiddle, lowerMiddle]
		]
	];

	return TwoPlayerNormal(players, choices, payoffs, parameters);
});


module.exports = prisonerDilemma;
