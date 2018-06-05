"use strict";

// Strategy registration
var { registerStrategyObject } = require("../engine").Frontend;

// Helper functions
var { isFunction, once } = require("./general");

//External dependency
var esprima = require("esprima");

var stockGames = {
	// utility function to create two ways to call a game, either with all the arguments, or curried, where the returned function takes players and parameters
	// The combineParameters setting will
	gameWrapper(game, {
		argumentValidator = function() { return true; },
		combineParameters = true,
		strategyLoader = null
	} = {}) {

		var generate;

		// If there's a strategy loader, make sure it only runs once
		var loadStrategies
		if (isFunction(strategyLoader)) loadStrategies = once(function() {
			return registerStrategyObject(strategyLoader());
		});
		else loadStrategies = function() {}

		// run the game. Optionally, validate the arguments and load strageies first
		generate = function(...args) {
			var result = argumentValidator(...args)
			if (result === true) {
				loadStrategies();
				return game(...args);
			} else throw new Error(result);
		}

		// creates a wrapper around the game, which accepts the first argument (players) and last argument (parameters), and passes it forward.
		// If combineParameters is set to true, then the second argument of the returned function will get merged with the last argument
		// given when generator is called.
		generate.createGenerator = function(...args) {

			var gameCode = esprima.parseScript("(" + game.toString() + ")")

			var gameArgs = gameCode.body[0].expression.params
			var lastArg = gameArgs[gameArgs.length - 1]

			var originalParameters
			if ((lastArg.name && lastArg.name.toLowerCase() === "parameters") || lastArg.type === "ObjectPattern" ||
				(lastArg.type == "AssignmentPattern" && lastArg.left.type == "ObjectPattern")) {
				// Check that the game arguments and createGenerator arguments are the correct lengths. createGenerator should be
				// 1 less than game, because players is omitted.
				// TODO: use esprima to allow players to be anywhere in the game definition (or even omitted) rather than first
				if (args.length == gameArgs.length - 1) originalParameters = args.pop();
			}


			return function(players, parameters = {}) {

				// If combining parameters, merge and remove from arguments
				if (combineParameters && originalParameters) parameters = Object.assign({}, originalParameters,
					parameters)

				return generate(players, ...args, parameters)
			}
		}

		return generate;
	}


}

module.exports = stockGames;
