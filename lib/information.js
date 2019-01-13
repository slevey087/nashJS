"use strict";

//When a strategy's .choose() function is called, it is given an information set. That data is a limited map of the internal objects of the game engine, including information on the game history and the players. This is threaded through playables, much like History, so that a parent playable can specify an information set for the playables it calls, or else the default construction will be used. Additionally, the user can provide a filter function, to selectively delete (or add) information elements before they are passed to .choose().

//History functions
var { gameHistory, History } = require('./history');

//Population functions
var { gamePopulation, PlayerList } = require('./population');


function Information(history = gameHistory, population = gamePopulation, { parentHistory = [] } = {}) {
	this.history = history;
	this.population = population;

	// Record any history entries that need to be added to the records
	this.parentHistory = parentHistory.slice(0);

	this.additional = [];
	this.compilers = [];

	this.update();
};

//Check the source then cache a hard-copy.
Information.prototype.update = function (player, local) {
	this.infoPopulation = this.population().info();

	this.infoHistory = {
		log: this.parentHistory.concat(this.history.log),
		scores: this.history.scores.slice(0)
	};

	this.additional = [];

	//Return value. Mimics .deliver()
	var information = {
		history: { log: this.infoHistory.log, scores: this.infoHistory.scores },
		population: this
			.infoPopulation
	}
	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);

	return information;
};

//Clone the cached copies and provide them. Will deliver the same thing every time until update is called.
Information.prototype.deliver = function (player, local) {
	var information = {
		history: { log: this.infoHistory.log, scores: this.infoHistory.scores },
		population: this
			.infoPopulation
	}


	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);
	if (this.additional) this.additional.forEach(function (entry) { Object.assign(information, entry) });

	return JSON.parse(JSON.stringify(information));
};

//This probably doesn't need to be a separate function, but adding it in case it expands later.
Information.prototype.addAdditional = function (entry = null) {
	if (entry) this.additional.push(entry);
};

//Make copy of this information function, which allows for updating and freezing.
Information.prototype.child = function () {
	var information = new Information(this.history, this.population, { parentHistory: this.parentHistory });

	return information;
};


//Compile. Run the compiler functions, each with a copy of any local info.
Information.prototype.compile = function (local) {
	var information = this
	information.compilers.forEach(function (compiler) {
		compiler.call(information, local)
	})
}

// Add a compiler to the list of compilers. Compiler is a function that edits the information
Information.prototype.addCompiler = function (compiler) {
	if (this.compiling)
		this.compilers.push(compiler)
}


//Game state, analogous to gameHistory
var PerfectInformation = new Information(gameHistory, gamePopulation);

//Overwrite .deliver(). PerfectInformation is always up-to-date! Thus no need to do a 2nd JSON.stringify.
PerfectInformation.deliver = function (player, local) {

	var information = this.update(player, local);

	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);

	return information;
};


module.exports = { Information, PerfectInformation };
