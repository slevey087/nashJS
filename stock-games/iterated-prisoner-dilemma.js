"use strict";

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
