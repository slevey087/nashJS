"use strict";

var log = require('./logger');


//Game state controllers
var { registry } = require('./state');
var Promise = registry.Promise

//Helper functions
var { idHandler } = require('./helper-functions')("state");

var { UserHistory } = require('./history');

// Plugins
var PluginManager = require("./plugin-manager")


// Internal player object
class _Player {
	constructor(id, { role = "", assign = null } = {}) {
		log('silly', 'Creating interal player object.');

		this.id = id
		this.role = role.toString();

		this.history = [];
		this.score = 0
		this.alive = true;
		this.available = true;

		if (assign) this.assign(assign);

		registry.players[id] = this;
	}

	//Assign strategy to player
	assign(strategy, ...args) {

		//TODO: verify strategy type
		if (registry.strategies[strategy]) {

			// don't allow incorrect roles, but only if roles exist for both player and strategy
			if (registry.strategies[strategy].role && this.role && registry.strategies[strategy].role != this.role) {
				throw new Error(
					"Cannot assign strategy ${strategy} (role ${registry.strategies[strategy].role}) to player ${this.id} (role ${this.role})"
				)
			}

			// assign strategy
			this.strategy = new registry.strategies[strategy](...args);
			this.strategy._id = strategy
			this.strategy._args = args
		} else throw new Error("Strategy '" + strategy + "' is not defined");
	};

	//Call strategy to make a choice
	choose(options, information = {}, playerMethod = "choose") {
		var player = this;
		if (player.strategy) {
			let result = player.strategy[playerMethod](options, information)
			if (result) return Promise.resolve(result.toString());
			// If no response, give warning
			else log("warning", "No response from player " + player.id + ". Using default option.")
		}
		// If no strategy, give warning
		else
			log("warning", "No strategy assigned to player " + player.id + ". Using default option.");
		return Promise.resolve(null);
	};

	//Takes a JSON.parse(JSON.stringify()) copy of _player. Returns a cleaned up version
	infoClean(infoObject) {
		delete infoObject.interface;
		infoObject.strategy = infoObject.strategy ? infoObject.strategy._id : null;

		return infoObject;
	};

	//Kill player. TODO: add player to some sort of "dead" list to avoid being picked to do things.
	kill() {
		this.alive = false;
	};
}


//Make a copy of the player, in order to take a snapshot. ////TODO try this again sometime.
/*
_Player.prototype.clone = function(){
	//Make new copy. Don't keep more than one.
	delete this.copy

	var clone = new _Player(this.id);

	//Loop through properties and assign them.
	for (var key in this){
		clone[key] = this[key];
	}
	//Do not add to registry. This will keep duplicates out of population.

	//Do add reference so we can find it again.
	this.copy = clone;

	return clone;
};
*/

class Player {
	constructor(parameters = {}) {
		var id = idHandler(parameters.id, "player");

		//Create backend player object
		var _player = new _Player(id, parameters);

		//Return this reference object to the user
		var playerInterface = this;

		//Tag-back. Store the front-end object in the back-end object, for retrieval
		_player.interface = playerInterface;

		playerInterface.alive = function () {
			return registry.players[id].alive;
		}

		playerInterface.assign = function (strategy, ...args) {
			registry.players[id].assign(strategy, ...args);
		};

		playerInterface.history = function () {
			return new UserHistory(registry.players[id].history);
		};

		playerInterface.id = function () { return id; };

		playerInterface.isAvailable = function () {
			return registry.players[id].available
		};

		playerInterface.kill = function () {
			registry.players[id].kill();
		}

		playerInterface.markAvailable = function () {
			registry.players[id].available = true;
		};

		playerInterface.markBusy = function () {
			registry.players[id].available = false;
		};

		playerInterface.role = function (role) {
			if (role) registry.players[id].role = role.toString();
			return registry.players[id].role
		}

		playerInterface.resetScore = function () {
			registry.players[id].score = 0;
		}

		playerInterface.score = function () {
			return registry.players[id].score;
		};

		playerInterface.strategy = function () {
			return registry.players[id].strategy._id;
		};

		// PLUGIN: run after player creation
		PluginManager.hook("player-create", _player)

	}
}

// create an initializer that doesn't have to use "new"
Player.creator = new Proxy(Player, {
	apply: function (target, thisArg, argumentsList) {
		return new target(...argumentsList)
	}
})



module.exports = { _Player, Player: Player.creator };
