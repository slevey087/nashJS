"use strict";

var log = require('./logger');

//Helper functions
var {isFunction, isObject} = require('./helperFunctions')("general");

//Game state controllers
var {registry} = require('./state');

var {_Player} 	 = require('./player');


//Class PlayerList is a list of players which includes some extra functionality. UserPlayerList takes a playerList and
//sanitizes it for the user (ie returns .interface for each player). 

function PlayerList(...args) {
	if (Array.isArray(args[0])) args = args[0];
	if (args == "all") return gamePopulation();
	
	Object.setPrototypeOf(args, PlayerList.prototype);
	return args;
}

PlayerList.prototype = Object.create(Array.prototype);
PlayerList.prototype.constructor = PlayerList;


//Return a playerList with only the players who are available
PlayerList.prototype.onlyAlive = function(){
	return new PlayerList(this.filter(function(player){
			return player.alive;
	}));
};

//Return a playerList with only the players who are available
PlayerList.prototype.onlyAvailable = function(){
	return new PlayerList(this.filter(function(player){
			return player.available;
	}));
};

//Kill all players in the playerList
PlayerList.prototype.kill = function(){
	this.forEach(function(player){
		player.kill();
	});
};

//Return array of ids of each player in the list
PlayerList.prototype.ids = function(){
	return this.map(function(player){
		return player.id;
	});
}

//Return a PlayerList minus the specified players.
//Argument can be _player, interface, or a player's id.
PlayerList.prototype.exclude = function(playerArg){
	if (Array.isArray(playerArg)) return playerArg.reduce(function(running, item){
		return running.exclude(item);
	}, this);
	
	return new PlayerList(this.filter(function(player){
		if (playerArg === player || playerArg == player.interface || playerArg == player.id || (isObject(playerArg) && playerArg.id == player.id))
			return false;
		else return true;
	}));
}

//Create an InfoPlayerList out of this PlayerList. Useful for getting summary view.
PlayerList.prototype.info = function(){
	return new InfoPlayerList(this);
};

//Return an array of the strategy of each player in the list
PlayerList.prototype.strategies = function(){
	return this.map(function(player){
		return player.strategy ? player.strategy._id : ""
	});
}

//Return a PlayerList with only players using a given strategy
PlayerList.prototype.usingStrategy = function(strategy){
	return new PlayerList(this.filter(function(player){
		if (player.strategy == strategy || player.strategy._id == strategy || (isFunction(strategy) && player.strategy instanceof strategy)) 
			return true;
		else return false;
	}));
};

/*

TODO figure out how to make this work

//Returns an object where the keys are strategy names and the values are arrays of players.
//This needs to be overridden on the UserPlayerList prototype, because the normal wrapper logic 
//for UserPlayerList cannot sanitize this.
PlayerList.prototype.byStrategy = function(){
	var list = this;
	var data = {};
	
	Object.keys(registry.strategies).forEach(function(strategy){
		data[strategy] = list.usingStrategy(strategy);
	});
	
	return data;
};
*/


//Returns an object where the keys are each strategy and the values
//are the number of players in the list who are using it.
PlayerList.prototype.strategyDistribution = function(){
	var counts = {};
	
	this.forEach(function(player){
		var s = player.strategy._id
		counts[s] = (counts[s] || 0) +1;
	});
	
	return counts;
};

//Returns an array of scores of each player in the list
PlayerList.prototype.scores = function(){
	var scores = [];
	
	this.forEach(function(player){
		scores.push(player.score);		//Use the interface function to avoid users re-assigning the reference
	});
	return scores;
}

//Returns an object where the keys are the player ids and the values
//are the players' score
PlayerList.prototype.scoresObject = function(){
	var scores = {};
	
	this.forEach(function(player){
		scores[player.id] = player.score;
	});
	
	return scores;
};

//Mean of the scores
PlayerList.prototype.scoresMean = function(){
	var scores = this.scores();
	
	var mean = scores.reduce(function(sum, value){
		return sum+value;
	},0)/scores.length;
	
	return mean;
};

//Array with 2 entries, the lowest and highest score
PlayerList.prototype.scoresRange = function(){
	var scores = this.scores();
	
	scores.sort(function(a,b){return a-b;});
	
	return [scores[0], scores[scores.length-1]];
};

//The standard deviation of the scores
PlayerList.prototype.scoresStd = function(){
	var scores = this.scores();
	var mean = this.scoresMean();
	
	var variance = scores.reduce(function(sum,value){
		return sum + Math.pow(value - mean,2);
	},0)/scores.length;
	
	var std = Math.sqrt(variance);
	
	return std;
};

//Returns the single player with the highest score
PlayerList.prototype.leader = function(){
	var players = this.slice();
	
	players.sort(function(a,b){return b.score-a.score;});
	
	return players[0];
}




//Accept a PlayerList and return one suitable for the user
function UserPlayerList(playerList){
	var userPlayerList = playerList.map(function(player){
		return player.interface;
	});
	
	Object.setPrototypeOf(userPlayerList, UserPlayerList.prototype);
	
	//Attach methods from PlayerList, wrapped in a function. If those methods return a playerList,
	//then the function will convert that to a UserPlayerList.
	for (var method in PlayerList.prototype){
		if (isFunction(playerList[method])){
			if (method != "constructor") userPlayerList[method] = (function(method){
	
				return function(){
					var result = playerList[method].apply(playerList,arguments);
					if (result instanceof PlayerList) return new UserPlayerList(result);
					else if (result instanceof _Player) return result.interface;
					else return result;
				};
			})(method);
		}
	}
	

	return userPlayerList;
}

UserPlayerList.prototype = Object.create(PlayerList.prototype);
UserPlayerList.prototype.constructor = UserPlayerList;



//Accept a PlayerList and return one suitable for a strategy information set.
function InfoPlayerList(playerList){
	var infoPlayerList = playerList.map(function(player){
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
	
	for (var method in PlayerList.prototype){
		if (isFunction(playerList[method])){
			if (methodsToInclude.indexOf(method) >-1) infoPlayerList[method] = (function(method){
	
				return function(){
					var result = playerList[method].apply(playerList,arguments);
					if (result instanceof PlayerList) return new InfoPlayerList(result);
					else if (result instanceof _Player) return result.infoClean(JSON.parse(JSON.stringify(result)));
					else return result;
				};
				
			})(method);
		}
	}
	

	return infoPlayerList;
}

InfoPlayerList.prototype = Object.create(Array.prototype);
InfoPlayerList.prototype.constructor = InfoPlayerList;

//Extra method to return a single player from an infoPlayerList
InfoPlayerList.prototype.get = function(playerID){
	return this.find(function(player){
		return (player.id == playerID);
	});
};



//Generates a PlayerList containing all players.
var gamePopulation = function(){
	var population = [];
	
	for (var player in registry.players) {
		population.push(registry.players[player]);
	}
	
	
	return new PlayerList(population);
}


//Does the same, but a UserPlayerList
var Population = function(){
	return new UserPlayerList(gamePopulation());
}

//Does the same, but an InfoPlayerList
var InfoPopulation = function(){
	return new InfoPlayerList(gamePopulation());
}

//A short-hand to return total population size without creating a PlayerList
Population.size = function(){
	return Object.keys(registry.players).length;
};



module.exports = {PlayerList, UserPlayerList, InfoPlayerList, gamePopulation, Population, InfoPopulation};