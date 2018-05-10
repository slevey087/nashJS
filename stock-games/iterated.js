"use strict";

// NashJS engine components
var Engine = require("../lib/engine")

// game engine
var { Loop } = Engine.Frontend.Playables;

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")


var Iterated = gameWrapper(function(players, gameGenerator, gameName, numberIterations = 50, parameters = {}) {

	var { parameters: gameParameters = {} } = parameters

	gameParameters.id = gameParameters.id || gameName
	parameters.id = parameters.id || "Iterated-" + gameName;

	return Loop(gameGenerator(players, gameParameters), numberIterations, parameters);
})

// TODO validate arguments

module.exports = Iterated;
