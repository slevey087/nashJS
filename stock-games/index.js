"use strict";

var StockGames = {
	//Game skeletons
	"Two-Player Normal": require("./simple-normal").TwoPlayerNormal,
	"Normal": require("./simple-normal").Normal,
	"Simple Zero-Sum": require("./simple-zero-sum"),

	// Classic games
	"Battle Of The Sexes": require("./battle-of-the-sexes"),
	"Matching Pennies": require("./matching-pennies"),
	"Prisoner's Dilemma": require("./prisoner-dilemma"),
	"Rock-Paper-Scissors": require("./rock-paper-scissors"),

	// Iterated games
	"Iterated": require("./iterated"),
	"Iterated Prisoner's Dilemma": require("./iterated-prisoner-dilemma"),

	// Evolutionary games
	"Cultural Evolution": require("./cultural-evolution"),

	//Tournaments
	"Round Robin": require("./round-robin"),
	"Axelrod Tournament": require("./axelrod-tournament"),

	// Probability Theory
	"Monty Hall": require("./monty-hall"),

	//Neoclassical economics
	"Exchange": require("./exchange-complex"),

	// Function to display loaded query shortcuts.
	queries() {
		return Object.keys(registry.queries).map(function(query) {
			return {
				[query]: registry.queries[query].description
			}
		})
	}
};



module.exports = StockGames;
