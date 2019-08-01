"use strict";

// When a strategy's .choose() function is called, it is given an information set. That data is a 
// limited map of the internal objects of the game engine, including information on the game history 
// and the players. This is threaded through playables, much like History, so that a parent playable 
// can specify an information set for the playables it calls, or else the default construction will 
// be used. Additionally, the user can provide a filter function, to selectively delete (or add) 
// information elements before they are passed to .choose().

// Settings
var Settings = require("../settings")

//History functions
var { gameHistory, History } = require('./history');

//Population functions
var { gamePopulation, PlayerList } = require('./population');

class Information {
	constructor(history = gameHistory, population = gamePopulation, { parentHistory = [] } = {}) {
		this.history = history;
		this.population = population;

		// Record any history entries that need to be added to the records
		this.parentHistory = parentHistory.slice(0);
		this.playable = null;

		this.additional = [];
		this.compilers = [];

		this.update();
	}

	// Check the source then cache a hard-copy. This is so that information can be behind the latest news, so that 
	// things that are supposed to happen "simultaneously" won't have information from the ones that happen first.
	update(player = null, local = null) {
		this.infoPopulation = this.population().info();
		this.infoHistory = {
			log: this.parentHistory.concat(this.history.log),
			scores: this.history.scores.slice(0)
		};
		this.additional = [];

		//Return value. Mimics .deliver()
		var information = {
			history: { log: this.infoHistory.log, scores: this.infoHistory.scores },
			population: this.infoPopulation
		}
		if (player) information.me = information.population.get(player.id);
		if (local) Object.assign(information, local);

		return information;
	}


	// Clone the cached copies and provide them. Will deliver the same thing every time until update is called.
	// Returns an object that is safe to pass to the player.
	deliver(player = null, local = null) {
		var information = {
			history: { log: this.infoHistory.log, scores: this.infoHistory.scores },
			population: this.infoPopulation
		}

		if (player) information.me = information.population.get(player.id);
		if (local) Object.assign(information, local);
		if (this.additional) this.additional.forEach(entry => Object.assign(information, entry));

		information.game = this.getGameSummary()

		return JSON.parse(JSON.stringify(information));
	}

	//This probably doesn't need to be a separate function, but adding it in case it expands later.
	addAdditional(entry = null) {
		if (entry) this.additional.push(entry)
	}

	//Make copy of this information function, which allows for updating and freezing.
	child() {
		var information = new Information(
			this.history,
			this.population, {
				parentHistory: this.parentHistory,
				playable: this.playable
			});
		return information;
	};


	//Compile. Run any compiler functions, each with a copy of any local info.
	// Compiler functions should mutate "this". Return value will be ignored.
	compile(local) {
		var information = this
		information.compilers.forEach(function (compiler) {
			compiler.call(information, local)
		})
	}

	// Add a compiler to the list of compilers. Compiler is a function that edits the information
	addCompiler(compiler) {
		this.compilers.push(compiler)
	}

	setCallingPlayable(playable) {
		perfectInformation.playable = playable;
		if (Settings["store-game-summary"]) perfectInformation.gameSummary = playable.summarize().print();
	}

	getCallingPlayable() {
		return perfectInformation.playable;
	}

	clearCallingPlayable() {
		perfectInformation.playable = undefined;
	}

	getGameSummary() {
		return perfectInformation.getGameSummary()
	}
}



//Game state, analogous to gameHistory
var perfectInformation = new Information(gameHistory, gamePopulation);

//Overwrite .deliver(). perfectInformation is always up-to-date! Thus no need to do a 2nd JSON.stringify.
perfectInformation.deliver = function (player, local) {

	var information = this.update(player, local);

	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);

	return information;
};

perfectInformation.getGameSummary = function () {
	if (Settings["store-game-summary"]) return this.gameSummary
	return this.getCallingPlayable().summarize().print();
}


module.exports = { Information, perfectInformation };
