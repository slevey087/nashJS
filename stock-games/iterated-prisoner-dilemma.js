"use strict";

<<<<<<< HEAD
// game engine
var { Loop } = require("../lib/engine").Playables;

// The actual game
var prisonerDilemma = require("./prisoner-dilemma");

module.exports = function(players, parameters = {}) {
	var {
		numberIterations = 50,
			id = "Iterated-Prisoner-Dilemma",
			turnParameters = {}
	} = parameters;

	turnParameters.id = "Prisoner-Dilemma";
	parameters.id = parameters.id || id;

	return Loop(
		prisonerDilemma(players, turnParameters),
		numberIterations,
		parameters
	);
};
=======
// Base game
var prisonerDilemma = require("./prisoner-dilemma").createGenerator();

// game engine
var { Loop } = require("../lib/engine").Playables;

// Game utility
var Iterated = require("./iterated")

// helper functions
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")

var IteratedPrisonerDilemma = gameWrapper(function(players, numberIterations = 50, parameters = {}) {
	return Iterated(players, prisonerDilemma, "Prisoner-Dilemma", numberIterations, parameters)
});
// TODO validate arguments

module.exports = IteratedPrisonerDilemma
>>>>>>> bce4b1691360cbe1cd1d4a07b91526e40cc1346f
