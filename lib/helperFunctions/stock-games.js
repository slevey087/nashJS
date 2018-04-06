"use strict";


var stockGames = {
	// utility function to create two ways to call a game, either with all the arguments, or curried, where the returned function takes players and parameters
	// The combineParameters setting will
	gameWrapper: function(gameGenerator, argumentValidator = function() { return true; }, { combineParameters =
		true } = {}) {

		// run the game. Optionally, validate the arguments first.
		var generate = function(...args) {
			var result = argumentValidator(...args)
			if (result === true) return gameGenerator(...args);
			else throw new Error(result);
		}

		// creates a wrapper around the game, which accepts the first argument (players) and last argument (parameters), and passes it forward.
		// If combineParameters is set to true, then the second argument of the returned function will get merged with the last argument
		// given when generator is called.
		generate.createGenerator = function(...args) {
			return function(players, parameters = {}) {

				// If combining parameters, merge and remove from arguments
				if (combineParameters) parameters = Object.assign({}, args.pop(), parameters)

				return generate(players, ...args, parameters)
			}
		}

		return generate;
	}


}

module.exports = stockGames;
