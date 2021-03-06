"use strict";

var log = require('./logger');

//Game state controllers
var { registry } = require('./state');

//Helper functions
var { idHandler } = require('./helper-functions')("state");
var { chainerGenerator } = require('./helper-functions')("playable");

var { UserHistory } = require('./history');

// Plugins
var PluginManager = require("./plugin-manager")

//Backend for Player
function _Player(id, { name = "", assign = null } = {}) {
	log('silly', 'Creating interal player object.');

	this.id = id
	this.score = 0
	this.name = name;

	this.history = [];

	if (assign) this.assign(assign);

	this.alive = true;
	this.available = true;

	registry.players[id] = this;
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


//Assign strategy to player
_Player.prototype.assign = function(strategy, ...args) {

	//TODO: verify strategy type
	if (registry.strategies[strategy]) {
		this.strategy = new registry.strategies[strategy](...args);
		this.strategy._id = strategy
		this.strategy._args = args
	} else throw new Error("Strategy '" + strategy + "' is not defined");
};


//Call strategy to make a choice
_Player.prototype.choose = function(options, information = {}) { //TODO: check that there's a strategy assigned before trying to play
	var player = this;
	if (player.strategy) {
		let result = player.strategy.choose(options, information)
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
_Player.prototype.infoClean = function(infoObject) {
	delete infoObject.interface;
	infoObject.strategy = infoObject.strategy ? infoObject.strategy._id : null;

	return infoObject;
};


//Kill player. TODO: add player to some sort of "dead" list to avoid being picked to do things.
_Player.prototype.kill = function() {
	this.alive = false;
};



//Class that is the reference for the user to hold onto
function player() {}


//Frontend for Player
function Player(parameters = {}) {
	var id = idHandler(parameters.id, "player");

	//Create backend player object
	var _player = new _Player(id, parameters);


	//Return this reference object to the user
	var playerInterface = new player(); //Probably add functionality here

	//Tag-back. Store the front-end object in the back-end object, for retrieval
	_player.interface = playerInterface;

	playerInterface.alive = function() {
		return registry.players[id].alive;
	}

	playerInterface.assign = function(strategy, ...args) {
		registry.players[id].assign(strategy, ...args);
	};

	playerInterface.available = function() {
		return registry.players[id].available
	};

	playerInterface.busy = function() {
		registry.players[id].available = false;
	};

	playerInterface.history = function() {
		return new UserHistory(registry.players[id].history);
	};

	playerInterface.id = function() { return id; };

	playerInterface.kill = function() {
		registry.players[id].kill();
	}

	playerInterface.release = function() {
		registry.players[id].available = true;
	};

	playerInterface.resetScore = function() {
		registry.players[id].score = 0;
	}

	playerInterface.score = function() {
		return registry.players[id].score;
	};

	playerInterface.strategy = function() {
		return registry.players[id].strategy._id;
	};

	// PLUGIN: run after player creation
	PluginManager.run("player-create", _player)

	return playerInterface
}




module.exports = { _Player, Player };
