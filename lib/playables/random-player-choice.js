"use strict";

var log = require('../logger');
log("debug", "Loading Class: RandomPlayerChoice")

//Game state controllers
var {registry, gameHistory, occupiedPlayers} = require('../state');

//Helper functions
var {idHandler} = require('../helperFunctions')("state");
var {chainerGenerator} = require('../helperFunctions')("playable");

//Parent class
var {_Playable, Playable} = require('./playable');
var {_Choice, Choice} = require('./choice');

//Population helpers
var {PlayerList} = require('../population');


//Backend function class for RPChoice
function _RPChoice(id, options, {includePlayers, excludePlayers=new PlayerList()}){
	
	//If they specify players to draw from, use only that list. Otherwise, use whoever's around.
	this.includePlayers = includePlayers || "all";
	
	this.excludePlayers = new PlayerList(excludePlayers);
	
	this.generator = Math.random;
	
	var player = null;
	
	
	_Choice.call(this,id, player, options, {});
}

_RPChoice.prototype = Object.create(_Choice.prototype);

_RPChoice.registryName = "choices";
_RPChoice.counterName = "randomPlayerChoice";



//Select the player to make the choice
_RPChoice.prototype.choosePlayer = function choosePlayer(){
	
	var rpChoice = this;
	
	return Promise.resolve().then(function(){
		
		//Find players to choose from
		var pool = new PlayerList(rpChoice.includePlayers).onlyAlive().onlyAvailable().exclude(rpChoice.excludePlayers)
		if (pool.length == 0) return Promise.reject("No available players.");
	
		log("silly", "rpChoice.choosePlayer: choosing froom pool: " + pool.ids());
	
		var randomNumber = Math.floor(rpChoice.generator()*pool.length);
		var candidate = pool[randomNumber];
	
	
		log("silly", "rpChoice.choosePlayer: selecting player ", candidate.id)
	
		rpChoice.player = candidate;
		candidate.available = false;
	
		return Promise.resolve(candidate.id);
	});
};

_RPChoice.prototype.prePlay = function(){
	return this.choosePlayer();
};


function RandomPlayerChoice(options, {id=null, excludePlayers=[], playerList=null}={}){
	var id = idHandler(id,"randomPlayerChoice")
	
	//Create backend choice object
	var _rpChoice = new _RPChoice(id, options, {playerList, excludePlayers});
	
	//Return this reference object to the user. Run the function to select a source
	var rpChoice = Playable(_rpChoice)
	
	rpChoice.playerList = function(playerList){
		if (Array.isArray(playerList)) _rpChoice.playerList = playerList;
		return 	_rpChoice.playerList 
	};
	
	rpChoice.excludePlayers = function(excludePlayers){
		if (Array.isArray(excludePlayers)) {
			_rpChoice.excludePlayers = [];
			
			excludePlayers.forEach(function(player){
				_rpChoice.excludePlayers.push(player.id());
			});
			
		}
		return 	_rpChoice.excludePlayers 
	};
	
	//Interface to specify single-player payoffs in single-player/single-choice games
	_rpChoice.zeroPayoffs();       
	
	_rpChoice.generateChainingFunctions(rpChoice);
	
	//Function to set all payoffs at once
	rpChoice.setAllPayoffs = function(payoffs){
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};
	
	
	//Way for user to interact with payoffs
	rpChoice.payoffs = function(){return registry.choices[id].payoffs;};
	
	return rpChoice;	
}



module.exports = {_RPChoice, RandomPlayerChoice};