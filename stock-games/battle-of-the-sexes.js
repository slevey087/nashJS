"use strict";

//base game
var TwoPlayerNormal = require("./simple-normal");

// helper functions
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")

// Battle of the Sexes
module.exports = gameWrapper(function(players, parameters = {}) {
	parameters.id = parameters.id || "Battle-of-the-Sexes";

	var choices = [
		["Opera", "Football"],
		["Opera", "Football"]
	];
	var payoffs = [
		[
			[2, 1],
			[0, 0]
		],
		[
			[0, 0],
			[1, 2]
		]
	];

	return TwoPlayerNormal(players, choices, payoffs, parameters);
});
