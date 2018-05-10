"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

// NashJS components
var Engine = require("../lib/engine")

// Game state controller
var { registry } = Engine.Backend.State
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");

// Play-time logic
var { Variable, Expression } = Engine.Frontend;

/* beautify preserve:start */
var SimpleZeroSum = gameWrapper(function(players, choices, payoffs = [[0, 0],	[0, 0]], parameters={}) {
/* beautify preserve:end */

	var game = TwoPlayerNormal(players, choices, null, parameters)

	var e;

	choices[0].forEach(function(choice0, index0) {
		choices[1].forEach(function(choice1, index1) {

			// Set expression
			e = Expression(function() {
				//Return the negative payoff, or zero
				return (0 - registry.turns[game.id()].payoffsImplicit[choice0][choice1][0] || 0);
			});

			//Set payoffs
			game[choice0][choice1]([payoffs[index0][index1], e]);
		});
	});

	return game;
}); //					TODO: validate arguments



module.exports = SimpleZeroSum;
