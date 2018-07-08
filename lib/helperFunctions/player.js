"use strict";

//  Game state
var { registry } = require("../state");

// helper function
var { isFunction } = require("./general");

// Player claass
var { _Player } = require("../player");

// Population
var { gamePopulation } = require("../population")

// Plugins
var PluginManager = require("../plugin-manager/")

var player = {

	//reset all players. Recreate from class, re-assign strategy, loop through objects that reference player to set new reference. result argument is only for pass-through.
	reinitializePlayers(population = "all", result = null) {
		return Promise.resolve().then(function() {
			var oldPlayer, strategy, strategyArgs, parameters;

			// if no population is supplied, fetch everybody
			if (population === "all") population = Object.keys(registry.players)
			else(population = population.ids())

			//Redefine each player
			for (var i = 0; i < population.length; i++) {
				var player = population[i];

				oldPlayer = registry.players[player];
				strategy = oldPlayer.strategy ? oldPlayer.strategy._id : null;
				strategyArgs = strategy ? oldPlayer.strategy._args : [];
				parameters = {}; //TODO: when adding player parameters, be sure they're included here

				registry.players[player] = new _Player(oldPlayer.id, parameters);
				registry.players[player].interface = oldPlayer.interface;
				strategy && registry.players[player].assign(strategy, ...strategyArgs);

				// Plugin, to alter players in re-initialization
				PluginManager.run("player-reinitialize", registry.players[player]);
			}

			//For each choice, recreate player references
			for (var choice in registry.choices) {
				if (registry.choices[choice].player)
					registry.choices[choice].player = registry.players[registry.choices[choice].player.id];
			}

			return Promise.resolve(result);
		});
	}
};

module.exports = player;
