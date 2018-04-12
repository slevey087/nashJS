"use strict";

// game engine
var { Loop } = require("../lib/engine").Playables;

// helper functions
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")


var Iterated = gameWrapper(function(players, gameGenerator, gameName, numberIterations = 50, parameters = {}) {

	var { parameters: gameParameters = {} } = parameters

	gameParameters.id = gameParameters.id || gameName
	parameters.id = parameters.id || "Iterated-" + gameName;

	return Loop(gameGenerator(players, gameParameters), numberIterations, parameters);
})

// TODO validate arguments

module.exports = Iterated;
