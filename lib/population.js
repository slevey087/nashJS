"use strict";

var log = require("./logger");

//Helper functions
var { isFunction, isObject } = require("./helper-functions")("general");

//Game state controllers
var { registry } = require("./state");

var { _Player, Player } = require("./player");

//Class _PlayerList is a list of players which includes some extra functionality. PlayerList takes a _playerList and
//sanitizes it for the user (ie returns .interface for each player).


class _PlayerList extends Array {
	static get [Symbol.species]() { return Array }

	constructor(...args) {
		if (Array.isArray(args[0])) args = args[0].slice(0);
		if (args == "all") return gamePopulation();

		super();

		// We'll need to retain the original arguments in order to create the generator
		var originalArgs = []

		// Loop over the arguments, save the originals, parse them to _players and push them to the list
		for (var i = 0, len = args.length; i < len; i++) {
			originalArgs.push(args[i]);
			if (isFunction(args[i].id)) args[i] = registry.players[args[i].id()];
			else if (typeof args[i] === 'string') args[i] = registry.players[args[i]]

			this.push(args[i])
		}

		// returns the same _playerlist, but updated, using the original args.
		this.generator = function () {
			return new _PlayerList(originalArgs);
		};
	}


	// Assign a strategy en masse
	assign(strategyName, ...args) {
		this.forEach(function (player) {
			player.assign(strategyName, ...args)
		})
		return this;
	}

	//Return a _PlayerList minus the specified players.
	//Argument can be _player, interface, or a player's id.
	exclude(...playerArg) {
		if (playerArg.length == 1) playerArg = playerArg[0]

		if (Array.isArray(playerArg))
			return playerArg.reduce(function (running, item) {
				return running.exclude(item);
			}, this);

		return new _PlayerList(
			this.filter(function (player) {
				if (
					playerArg === player ||
					playerArg == player.interface ||
					playerArg == player.id ||
					(isObject(playerArg) && playerArg.id == player.id)
				)
					return false;
				else return true;
			})
		);
	};

	// Placeholder for generator method.
	generator() {
		// This will get shadowed when the constructor is called, but it needs to be here so that the
		// PlayerList and InfoPlayerList constructors can see it.
	}

	//Return array of ids of each player in the list
	ids() {
		return this.map(function (player) {
			return player.id;
		});
	};

	//Create an InfoPlayerList out of this _PlayerList. Useful for getting summary view.
	info() {
		return new InfoPlayerList(this);
	};

	//Kill all players in the _playerList
	kill() {
		this.forEach(function (player) {
			player.kill();
		});
		return this;
	};


	//Returns the single player with the highest score
	leader() {
		var players = this.slice();

		players.sort(function (a, b) {
			return b.score - a.score;
		});

		players = players.filter(function (player) {
			return player.score == players[0].score
		})

		return players.length > 1 ? new _PlayerList(players) : players[0];
	};

	// Mark all players as available
	markAvailable() {
		this.forEach(function (player) {
			player.available = true;
		});
		return this;
	};

	// Mark all players as unavailable
	markBusy() {
		this.forEach(function (player) {
			player.available = false;
		});
		return this;
	}

	//Return a _playerList with only the players who are available
	onlyAlive() {
		return new _PlayerList(
			this.filter(function (player) {
				return player.alive;
			})
		);
	};


	//Return a _playerList with only the players who are available
	onlyAvailable() {
		return new _PlayerList(
			this.filter(function (player) {
				return player.available;
			})
		);
	};


	// reset the score of each player to zero
	resetScores() {
		this.forEach(function (player) {
			player.score = 0;
		});
		return this;
	};

	// Return an array of scores
	scores() {
		var scores = [];

		this.forEach(function (player) {
			scores.push(player.score);
		});
		return scores;
	};

	// Returns an object where each key is a strategy and each value is an array of the scores of players with that strategy.
	scoresByStrategy() {
		var scores = {};
		var list = this;

		list.strategies().map(function (strategy) {
			scores[strategy] = list.usingStrategy(strategy).scores();
		});

		scores.totals = function () {
			var score = {};
			var scores = this;
			Object.keys(scores).forEach(function (strategy) {
				if (Array.isArray(scores[strategy])) score[strategy] = scores[strategy].reduce(function (a, b) {
					return a + b;
				}, 0);
			});
			return score;
		};

		return scores;
	};

	// Returns an object where each key is a strategy and each value is the sum of scores of all players with that value
	scoresByStrategyTotals() {
		var scores = {};
		var list = this;

		list.strategies().map(function (strategy) {
			scores[strategy] = list
				.usingStrategy(strategy)
				.scores()
				.reduce(function (a, b) {
					return a + b;
				}, 0);
		});

		return scores;
	};

	//Returns an object where the keys are the player ids and the values
	//are the players' score
	scoresObject() {
		var scores = {};

		this.forEach(function (player) {
			scores[player.id] = player.score;
		});

		return scores;
	};

	//Mean of the scores
	scoresMean() {
		var scores = this.scores();

		var mean = scores.reduce(function (sum, value) {
			return sum + value;
		}, 0) / scores.length;

		return mean;
	};

	//Array with 2 entries, the lowest and highest score
	scoresRange() {
		var scores = this.scores();

		scores.sort(function (a, b) {
			return a - b;
		});

		return [scores[0], scores[scores.length - 1]];
	};

	//The standard deviation of the scores
	scoresStd() {
		var scores = this.scores();
		var mean = this.scoresMean();

		var variance = scores.reduce(function (sum, value) {
			return sum + Math.pow(value - mean, 2);
		}, 0) / scores.length;

		var std = Math.sqrt(variance);

		return std;
	};


	//Return an array of the strategy of each player in the list
	strategies() {
		return this.map(function (player) {
			return player.strategy ? player.strategy._id : "";
		});
	};

	//Returns an object where the keys are each strategy and the values
	//are the number of players in the list who are using it.
	strategyDistribution() {
		var counts = {};

		this.forEach(function (player) {
			var s = player.strategy._id;
			counts[s] = (counts[s] || 0) + 1;
		});

		return counts;
	};

	//Return a _PlayerList with only players using a given strategy
	usingStrategy(strategy) {
		return new _PlayerList(
			this.filter(function (player) {
				if (
					player.strategy == strategy ||
					player.strategy._id == strategy ||
					(isFunction(strategy) && player.strategy instanceof strategy)
				)
					return true;
				else return false;
			})
		);
	};

}


/*

TODO figure out how to make this work

//Returns an object where the keys are strategy names and the values are arrays of players.
//This needs to be overridden on the PlayerList prototype, because the normal wrapper logic
//for PlayerList cannot sanitize this.
_PlayerList.prototype.byStrategy = function(){
	var list = this;
	var data = {};

	Object.keys(registry.strategies).forEach(function(strategy){
		data[strategy] = list.usingStrategy(strategy);
	});

	return data;
};
*/



class PlayerList extends Array {
	static get [Symbol.species]() { return Array }

	constructor(..._playerList) {
		if (Array.isArray(_playerList[0])) _playerList = _playerList[0];

		super();
		var playerList = this;

		// If _playerList isn't already a _PlayerList, create one.
		if (!(_playerList instanceof _PlayerList)) _playerList = new _PlayerList(_playerList)

		// fetch the .interface for each _player
		_playerList.forEach(function (player) {
			playerList.push(player.interface);
		});

		//Attach methods from _PlayerList, wrapped in a function. If those methods return a _playerList,
		//then the function will convert that to a PlayerList.
		Object.getOwnPropertyNames(_PlayerList.prototype).forEach(function (method) {
			if (isFunction(_PlayerList.prototype[method])) {
				if (method != "constructor")
					playerList[method] = (function (method) {
						return function (...args) {
							var result = _playerList[method](...args);
							if (result instanceof _PlayerList) return new PlayerList(result);
							else if (result instanceof _Player) return result.interface;
							else return result;
						};
					})(method);
			}
		})
	}
}


//Accept a _PlayerList and return an object suitable for a strategy information set.
class InfoPlayerList extends Array {
	static get [Symbol.species]() { return Array }

	constructor(_playerList) {
		super()
		var infoPlayerList = this;

		_playerList.forEach(function (player) {
			if (player instanceof Player)
				player = registry.players[player.id()]
			infoPlayerList.push(player.infoClean(JSON.parse(JSON.stringify(player))))
		})

		//Attach selected methods from PlayerList, wrapped in a function. If those methods return a playerList,
		//then the function will convert that to an InfoPlayerList.
		var methodsToInclude = [
			"onlyAlive",
			"onlyAvailable",
			"ids",
			"exclude",
			"generator",
			"strategies",
			"usingStrategy",
			"strategyDistribution",
			"scores",
			"scoresObject",
			"scoresMean",
			"scoresRange",
			"scoresStd",
			"leader"
		];

		methodsToInclude.forEach(function (method) {
			infoPlayerList[method] = (function (method) {
				return function (...args) {
					var result = _playerList[method](...args);
					if (result instanceof PlayerList || result instanceof _PlayerList) return new InfoPlayerList(result);
					else if (result instanceof _Player)
						return result.infoClean(JSON.parse(JSON.stringify(result)));
					else return result;
				};
			})(method);
		});
	}
}

/*
//Accept a PlayerList and return one suitable for a strategy information set.
function InfoPlayerList(playerList) {
	var infoPlayerList = playerList.map(function (player) {
		return player.infoClean(JSON.parse(JSON.stringify(player)));
	});

	Object.setPrototypeOf(infoPlayerList, InfoPlayerList.prototype);

	//Attach selected methods from PlayerList, wrapped in a function. If those methods return a playerList,
	//then the function will convert that to an InfoPlayerList.
	var methodsToInclude = [
		"onlyAlive",
		"onlyAvailable",
		"ids",
		"exclude",
		"generator",
		"strategies",
		"usingStrategy",
		"strategyDistribution",
		"scores",
		"scoresObject",
		"scoresMean",
		"scoresRange",
		"scoresStd",
		"leader"
	];

	for (var method in PlayerList.prototype) {
		if (isFunction(playerList[method])) {
			if (methodsToInclude.indexOf(method) > -1)
				infoPlayerList[method] = (function (method) {
					return function () {
						var result = playerList[method].apply(playerList, arguments);
						if (result instanceof PlayerList) return new InfoPlayerList(result);
						else if (result instanceof _Player)
							return result.infoClean(JSON.parse(JSON.stringify(result)));
						else return result;
					};
				})(method);
		}
	}

	return infoPlayerList;
}

InfoPlayerList.prototype = Object.create(Array.prototype);
InfoPlayerList.prototype.constructor = InfoPlayerList;

*/

//Extra method to return a single player from an infoPlayerList
InfoPlayerList.prototype.get = function (playerID) {
	return this.find(function (player) {
		return player.id == playerID;
	});
};



//Generates a _PlayerList containing all players.
var gamePopulation = function () {
	var population = [];

	for (var player in registry.players) {
		population.push(registry.players[player]);
	}

	return new _PlayerList(population);
};


//Does the same, but a PlayerList
var Population = function () {
	return new PlayerList(gamePopulation());
};

//A short-hand to return total population size to users without creating a PlayerList
Population.size = function () {
	return Object.keys(registry.players).length;
};


//Does the same, but an InfoPlayerList
var InfoPopulation = function () {
	return new InfoPlayerList(gamePopulation());
};





module.exports = {
	_PlayerList,
	PlayerList,
	InfoPlayerList,
	gamePopulation,
	Population,
	InfoPopulation
};
