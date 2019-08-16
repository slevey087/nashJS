"use strict";

var log = require('../logger');
log("debug", "Loading Class: RandomPlayerChoice")

//Game state controllers
var { registry, gameHistory, occupiedPlayers } = require('../state');
var Promise = registry.Promise; // For sync mode

//Helper functions
var { idHandler } = require('../helper-functions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');
var { _Choice, Choice } = require('./choice');

//Population helpers
var { Player } = require("../player")
var { _PlayerList, PlayerList } = require('../population');


class _RandomPlayerChoice extends _Choice {
	constructor(id, options, parameters = {}) {
		super(id, null, options, parameters)

		//If they specify players to draw from, use only that list. Otherwise, use whoever's around.
		// we can make exclude a playerlist now, have to wait on include because it can be "all"
		this.playerList = parameters.playerList || "all";
		this.excludePlayers = parameters.excludePlayers ? new _PlayerList(parameters.excludePlayers) : new _PlayerList()
		this.generator = Math.random;
	}

	prePlay({ history }) {
		var result = this.choosePlayer()
		if (result === "No available players.") {
			history.end();
			return Promise.reject("No available players.")
		}
		return Promise.resolve(result)
	}

	//Select the player to make the choice
	choosePlayer() {

		var rpChoice = this;

		//Find players to choose from
		var pool = new _PlayerList(rpChoice.playerList).onlyAlive().onlyAvailable().exclude(rpChoice.excludePlayers)
		if (pool.length == 0) return "No available players.";

		log("silly", "rpChoice.choosePlayer: choosing froom pool: " + pool.ids());

		var randomNumber = Math.floor(rpChoice.generator() * pool.length);
		var candidate = pool[randomNumber];

		log("silly", "rpChoice.choosePlayer: selecting player ", candidate.id)

		rpChoice.player = candidate;
		candidate.available = false;

		return candidate.id;
	}


	summaryThis(summary) {
		summary("options", this.options.slice());
		if (this.player) summary("player", this.player.id)

		return summary;
	}
}


_RandomPlayerChoice.registryName = "decisions";
_RandomPlayerChoice.counterName = "randomPlayerChoice";


class RandomPlayerChoice extends Playable {
	constructor(options, parameters = {}) {
		var id = idHandler(parameters.id, "randomPlayerChoice")

		//Create backend choice object
		var _rpChoice = new _RandomPlayerChoice(id, options.slice(), parameters);
		super(_rpChoice);

		_rpChoice.generateBranches();
	}

	playerList(playerList) {
		if (playerList === "all"
			|| playerList instanceof PlayerList
			|| (Array.isArray(playerList) && playerList.every(player => player instanceof Player)))
			registry.playables[this.id()].playerList = playerList.slice();

		else if (playerList instanceof Player)
			registry.playables[this.id()].playerList = playerList;

		else throw new Error("Invalid playerList");
	}

	excludePlayers(playerList) {
		if (playerList instanceof Player
			|| playerList instanceof PlayerList
			|| (Array.isArray(playerList) && playerList.every(player => player instanceof Player)))
			registry.playables[this.id()].excludePlayers = new _PlayerList(playerList);

		else throw new Error("Invalid playerList");
	}
}

// Copy properties from the Choice prototype (essentially, this is using Choice as a mixin)
for (var key of Object.getOwnPropertyNames(Choice.prototype))
	if (key !== "constructor") RandomPlayerChoice.prototype[key] = Choice.prototype[key]


/*

//Function to set all payoffs at once
rpChoice.setAllPayoffs = function (payoffs) {
	//TODO: make this work. Include error handling if array given isn't expected dimensions.
};


//Way for user to interact with payoffs
rpChoice.payoffs = function () { return registry.decisions[id].payoffs; };

*/

module.exports = { _RandomPlayerChoice, RandomPlayerChoice };
