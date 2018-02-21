"use strict";

var log = require('./logger');

log("debug", "state: Creating game state variables.")


var registry = {}
registry._addType_ = function(type){	
	registry[type] = {};
	log("silly", "state: adding registry entry: ", type)
};


var idCounters = {}
idCounters._addType_ = function(type){
	idCounters[type] = 0
	log("silly", "state: adding counter entry: ", type)
};


var gameHistory = [];						//TODO: add choice-only history
gameHistory.clearHistory = function(){
	this.splice(0,this.length)
};


//This assists with randomly assigning players. 
var occupiedPlayers = [];
occupiedPlayers.add = function(player){
	this.push(player);
};
occupiedPlayers.remove = function(player){
	var index = this.indexOf(player)
	if (index || index===0) this.splice(index,1);
};



module.exports = {registry, idCounters, gameHistory, occupiedPlayers};