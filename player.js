"use strict";

var log = require('./logger');

//Game state controllers
var {registry} = require('./state');

//Helper functions
var {idHandler} 		= require('./helperFunctions').general;
var {chainerGenerator} 	= require('./helperFunctions').playable;



//Backend for Player
function _Player(id, parameters){
	log('debug','Creating interal player object.');
	
	this.id = id
	this.score = 0
	this.name = parameters.name || "";
	
	this.alive = true;
	
	registry.players[id] = this;
}


//Assign strategy to player
_Player.prototype.assign = function(strategy){
	
	//TODO: very strategy type
		
	this.strategy = new registry.strategies[strategy];
	this.strategy._id = strategy
};


//Call strategy to make a choice
_Player.prototype.choose = function(options, information={}){			//TODO: check that there's a strategy assigned before trying to play
	var player = this;
	return new Promise(function(resolve, reject){resolve(player.strategy.choose(options, information).toString());});
};



//Frontend for Player
function Player(parameters={}){
	var id = idHandler(parameters.id,"player");
	
	//Create backend player object
	var _player = new _Player(id, parameters);
	
	
	//Return this reference object to the user
	var player = function(){};		//Probably add functionality here
	
	//Tag-back. Store the front-end object in the back-end object, for retrieval
	_player.interface = player;
	
	player.id = function(){return id;};
	
	player.score = function(){
			return registry.players[id].score;
	};
	
	player.assign = function(strategy){
		_player.assign(strategy);
	};
	
	player.strategy = function(){
		return _player.strategy._id;
	};
	
	return player	
}


module.exports = {
	'_Player':_Player,
	'Player':Player
}