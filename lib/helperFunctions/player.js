var { registry } = require("../state.js");
var { _Player } = require("../player.js");

var player = {

	//reset all players. Recreate from class, re-assign strategy, loop through objects that reference player to set new reference. result argument is only for pass-through.
	reinitializePlayers: function(result) {
		return Promise.resolve().then(function() {
			var oldPlayer, strategy, parameters;

			//Redefine each player
			for (var player in registry.players) {
				oldPlayer = registry.players[player];
				strategy = oldPlayer.strategy._id;
				parameters = {}; //TODO: when adding player parameters, be sure they're included here

				registry.players[player] = new _Player(oldPlayer.id, parameters);

				registry.players[player].assign(strategy);
			}

			//For each choice, recreate player references
			for (var choice in registry.choices) {
				if (registry.choices[choice].player)
					registry.choices[choice].player =
					registry.players[registry.choices[choice].player.id];
			}

			return Promise.resolve(result);
		});
	}
};

module.exports = player;
