"use strict";

// NashJS engine components
var Engine = require("../lib/engine")

// User data
var { Population } = Engine.Frontend

// Playables
var { Lambda, Simultaneous, Sequence, Loop } = Engine.Frontend.Playables;

// Helper functions
var { isFunction } = Engine.Backend.HelperFunctions("general");


//Cultural evolution
//
// TODO: add instructions here
function CulturalEvolution(gameGenerator, numLoops = 1, {
	id = "CulturalEvolution",
	gameProbability = .25,
	pairProbability = .25,
	generatePopulation = null,
	loop = true
} = {}) {

	if (loop && isNaN(numLoops)) throw new Error("CulturalEvolution argument 'numLoops must be a number");
	if (!isFunction(gameGenerator)) throw new Error(
		"CulturalEvolution argument 'gameGenerator' must be a function");
	if (isNaN(gameProbability) || gameProbability < 0 || gameProbability > 1) throw new Error(
		"CulturalEvolution argument 'gameProbability' must be between 0 and 1");
	if (isNaN(pairProbability) || pairProbability < 0 || pairProbability > 1) throw new Error(
		"CulturalEvolution argument 'pairProbability' must be between 0 and 1");

	// Generate population if user wants us to.
	if (isFunction(generatePopulation)) generatePopulation();

	//Reset the scores each round.
	var ResetScores = Lambda(function() {
		Population().onlyAlive().resetScores();
	});

	// Calculate number of matches
	var n = Math.floor(Population().onlyAlive().length * gameProbability);

	// Create matches.
	var matches = [...Array(n)]
	for (var i = 0; i < n; i++) {
		matches[i] = gameGenerator();
		if (!matches[i].play) throw new Error("CulturalEvolution argument 'gameGenerator' must return a Playable");
	}

	//Run all matches simultaneously
	var Round = Simultaneous(matches);

	//Calculate number of pairings
	var n = Math.floor(Population().onlyAlive().length * pairProbability)

	//Create pairings
	var pairings = [...Array(n)];
	for (i = 0; i < n; i++) {

		pairings[i] = Lambda(function() {

			//Find some available players
			var pool = Population().onlyAlive().onlyAvailable();
			var p1 = pool[Math.floor(Math.random() * pool.length)];
			var p2 = pool[Math.floor(Math.random() * pool.length)];

			//Mark them busy
			p1.busy();
			p2.busy();

			// Assign strategy of player with higher score
			if (p1.score() > p2.score()) p2.assign(p1.strategy());
			else if (p1.score() == p2.score()) null;
			else p1.assign(p2.strategy());

			//Return value of player ids, so the log makes some sense.
			return [p1.id(), p2.id()];
		});
	}

	// Run pairings simultaneously
	var Pairing = Simultaneous(pairings);

	// After pairings, mark all players as available.
	var ReleasePlayers = Lambda(function() {
		Population().onlyAlive().release();
	});

	// Define the game.
	Round(ResetScores);
	Pairing(Round);
	ReleasePlayers(Pairing);
	var Iteration = Sequence(ResetScores, ReleasePlayers);

	// User can set loop parameter to false, to avoid wrapping this in a loop.
	if (loop)
		var CE = Loop(Iteration, numLoops, { playableParameters: { initializePlayers: true } });
	else
		var CE = Iteration;

	return CE;
}


module.exports = CulturalEvolution;
