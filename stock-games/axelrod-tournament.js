"use strict";

// game pieces
var prisonerDilemma = require("./iterated-prisoner-dilemma").createGenerator;
var roundRobin = require("./round-robin");
var { Loop } = require("../lib/engine").Playables;

// helper functions
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")

// Population interfaces
var { Population } = require("../lib/population");
var { generatePopulation } = require("../lib/helperfunctions")("tournament");

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
