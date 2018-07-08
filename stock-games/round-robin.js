"use strict";

//NashJS Engine
var Engine = require("../lib/engine")

// helper function
var { shuffle } = Engine.Backend.HelperFunctions("general");
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// nashJS engine component
var { Sequence, Simultaneous } = Engine.Frontend.Playables;

//for information mechanics
var { Information, History, PlayerList } = Engine.Backend.Classes;


// gameGenerator should be a function whose first argument is an array of players
var RoundRobin = gameWrapper(function(players, gameGenerator, parameters = {}) {
	parameters.id = parameters.id || "Round-Robin";
	parameters.initializePlayers = parameters.initializePlayers && true;

	// Create array of each combination of players
	var matches = [];

	players.forEach(function(player1, index1) {
		for (var index2 = 0; index2 < index1; index2++) {
			matches.push([players[index2], player1]);
		}

		// optional parameter 'copies.' Pass an extra copy of each player, to play themselves
		if (parameters.copies) matches.push([parameters.copies[index1], player1]);
	});

	//randomize the order
	shuffle(matches);

	// Track scores
	var scoresRecord = [];

	//
	var addRound = function(players, parameters = {}) {
		// information mechanics and other parameters
		var population = new PlayerList(players).generator
		parameters.compartmentalize = { population }
		parameters.initializePlayers = population;

		// generate round
		var round = gameGenerator(players, parameters);

		// track the scores
		var recordScores = Lambda(function() {
			var score = {}
			for (let [strategy, scores] of Object.entries(population().scoresByStrategy())) {
				if (Array.isArray(scores)) {
					if (scores.length == 1) scores = scores[0]
					score[strategy] = scores;
				}
			}
			scoresRecord.push(score);

			//return score for history
			return score;
		}, { id: "Record-Scores" });

		//Chain together
		recordScores(round);

		// return both
		return [round, recordScores
			// ,Sequence(round, recordScores) // Uncomment for Simultaneous implementation
		];
	};



	// Sequential implementation
	// load the first match manually
	var [firstRound, firstRecord] = addRound(
		matches.shift(),
		parameters.parameters
	);

	//then load subsequent matches
	var record = firstRecord;
	var lastRecord, lastRound;

	matches.forEach(function(match) {
		[lastRound, lastRecord] = addRound(match, parameters.parameters);

		lastRound(record);
		record = lastRecord;
	});


	return Sequence(firstRound, lastRecord, parameters);

	/* // Simultaneous implementation
	var rounds = [];
	matches.forEach(function(match) {
	  rounds.push(addRound(match, parameters.gameParameters)[2]);
	});

	return Simultaneous(rounds, parameters); */
});

module.exports = RoundRobin;
