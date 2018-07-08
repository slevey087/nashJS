"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

//NashJS engine components
var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");

// play-time logic
var { Variable, Expression } = Engine.Frontend;


var prisonerDilemma = gameWrapper(function(players, parameters = {}) {
	parameters.id = parameters.id || "Prisoner-Dilemma";
	var payoffs = parameters.payoffs || [Variable(1), Variable(2), Variable(3), Variable(4)];


	// sort numbers because the wrong order would screw up the game
	payoffs.sort()
	var sucker = payoffs[0]
	var punishment = payoffs[1]
	var reward = payoffs[2]
	var temptation = payoffs[3]


	var choices = [
		["Cooperate", "Defect"],
		["Cooperate", "Defect"]
	];
	var gamePayoffs = [
		[
			[reward, reward],
			[sucker, temptation]
		],
		[
			[temptation, sucker],
			[punishment, punishment]
		]
	];

	return TwoPlayerNormal(players, choices, gamePayoffs, parameters);
});


module.exports = prisonerDilemma;
