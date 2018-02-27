"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory, occupiedPlayers} = require('../state');

//Helper functions
var {idHandler} = require('../helperFunctions').general;
var {chainerGenerator} = require('../helperFunctions').playable;

//Parent class
var {_Playable, Playable} = require('./playable');
var {_Choice, Choice} = require('./choice');


//Backend function class for RPChoice
function _RPChoice(id, options, {playerList, excludePlayers}){
	
	
	this.includePlayers = playerList || "all";
	this.excludePlayers = excludePlayers;
	
	this.generator = Math.random;
	
	var player = null;
	
	
	_Choice.call(this,id, player, options, {});
}

_RPChoice.prototype = Object.create(_Choice.prototype);

_RPChoice.registryName = "choices";
_RPChoice.counterName = "randomPlayerChoice";

_RPChoice.prototype.play = function({initializePlayers=false, usePayoffs=false, shortCircuit=false, writeHistory=true, releasePlayers=true}={}){
	
	this.choosePlayer();
	
	var result = _Choice.prototype.play.call(this, {initializePlayers, usePayoffs, shortCircuit, writeHistory,releasePlayers})
	
	return result;
};


//Select the player to make the choice
_RPChoice.prototype.choosePlayer = function choosePlayer(){
	var rpChoice = this;
	var candidate;
	var randomNumber = 0;
	var playerArray = [];
	
	
	//If there's no pre-defined list of players, then use all players as sample pool.
	if (!rpChoice.playerList) {
		
		randomNumber = Math.floor(rpChoice.generator()*Object.keys(registry.players).length);	//TODO: make exclude work
		for (var player in registry.players) {
			playerArray.push(registry.players[player].id)
		}
		
		candidate = playerArray[randomNumber];
		
	}
	else {
		randomNumber = Math.floor(rpChoice.generator()*rpChoice.playerList.length);
		candidate = rpChoice.playerList[randomNumber].id();
	}
	
	log("silly", "rpChoice.choosePlayer: trying candidate: ", candidate)
	
	if (candidate in rpChoice.excludePlayers || occupiedPlayers.includes(candidate)) return rpChoice.choosePlayer();	//TODO: prevent infinite loop if there are no players to be used
	else {
		rpChoice.player = registry.players[candidate];
		occupiedPlayers.add(candidate);
		log("silly", "rpChoice.choosePlayer: selecting candidate: ", candidate);
	
		return rpChoice.player.id;
	}
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