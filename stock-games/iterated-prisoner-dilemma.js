"use strict";

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
