"use strict";

// Strategy registration
var { registerStrategyObject } = require("../engine").Frontend;

// Helper functions
var { isFunction, once } = require("./general");

//External dependency
var esprima = require("esprima");


// For handling queries
var { registry } = require("../engine").Backend.State
var { idHandler } = require("./state")

var registerQueryObject = function(queryObject, gameName) {
	// If there are multiple queries, recurse
	if (Array.isArray(queryObject)) return queryObject.map(function(query) {
		return registerQueryObject(query)
	});

	var { shortcut, query, description = "No description given." } = queryObject;
	// Enforce naming convention, first character '@'
	if (shortcut[0] != "@") shortcut = "@".concat(shortcut)

	// Check for duplicates. Abort if so, but return the data for display purposes.
	if (registry.queries[shortcut] && registry.queries[shortcut].query == query &&
		registry.queries[shortcut].description == description)
		return { shortcut, description };

	// assign id and add to registry
	var id = idHandler(shortcut, "query")
	registry.queries[id] = { query, description }

	//return the data for display purposes
	return { id, description }
}



var stockGames = {
	// utility function to create two ways to call a game, either with all the arguments, or curried, where the returned function takes players and parameters
	// The combineParameters setting will
	gameWrapper(game, {
		argumentValidator = function() { return true; },
		combineParameters = true,
		gameDescription = "No description given.",
		strategyLoader = null,
		queries = null
	} = {}) {

		var generate;

		// If there's a strategy loader, make sure it only runs once
		var loadStrategies
		if (isFunction(strategyLoader)) loadStrategies = once(function() {
			return registerStrategyObject(strategyLoader());
		});
		else loadStrategies = function() {}

		// If there's a query loader, make sure it only runs once
		var loadQueries
		if (queries) loadQueries = once(function() {
			return registerQueryObject(queries);
		});
		else loadQueries = function() {}

		// run the game. Optionally, validate the arguments and load strageies first
		generate = function(...args) {
			var result = argumentValidator(...args)
			if (result === true) {
				loadStrategies();
				loadQueries();
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

		// Allow for game description feature
		generate.description = function() {
			return gameDescription;
		};

		// Display any queries
		generate.queries = function() {
			return queries;
		}

		return generate;
	}


}

module.exports = stockGames;
