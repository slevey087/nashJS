"use strict";

// game pieces
var prisonerDilemma = require("./iterated-prisoner-dilemma").createGenerator;
var roundRobin = require("./round-robin");

// NashJS engine components
var Engine = require("../lib/engine")

var { Loop } = Engine.Frontend.Playables;

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")
var { generatePopulation } = Engine.Backend.HelperFunctions("tournament");

// Population interfaces
var { Population } = Engine.Frontend.Population;


var AxelrodTournament = gameWrapper(function(players, parameters = {}) {
	var { generatePlayers = true, repeats = 5, gameLength = 200 } = parameters;

	// Either create an entire population
	if (generatePlayers) {
		// Get two sets of players. The second is so players can play themselves
		players = generatePopulation();
		var copies = generatePopulation();
		parameters.copies = copies;
	}

	// or use the supplied players
	else if (players) {
		// do nothing
	} else {
		// or use the players already present
		players = Population().onlyAlive().onlyAvailable();
	}

	// assign parameters and generate the game
	parameters.initializePlayers = players;
	var iteration = roundRobin(players, prisonerDilemma(gameLength), parameters);

	return Loop(iteration, repeats, { id: "Axelrod-Tournament" });
});



module.exports = AxelrodTournament;
