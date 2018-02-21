"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory, occupiedPlayers} = require('../state');

//Helper functions
var {idHandler} = require('../helperFunctions').general;
var {chainerGenerator} = require('../helperFunctions').playable;

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Choice
function _Choice(id, player, options, parameters={}){
	_Playable.call(this,id);
	
	this.next = {}
	
	this.player = registry.players[player];
	this.options = options;
	this.defaultOption = parameters.defaultOption || options[0];		//TODO: make defaultOption functional
	
	registry.choices[id] = this;
	
	var choice = this;
	this.options.forEach(function(item){
		choice.next[item] = [];
	});
}

_Choice.prototype = Object.create(_Playable.prototype);

_Choice.registryName = "choices";
_Choice.counterName = "choice";

_Choice.prototype.play = function({initializePlayers=false, usePayoffs=false, shortCircuit=false, writeHistory=true, releasePlayer=true}={}){
	
	var choice = this;
	
	//While this choice is happening, don't allow other choices to use this player.
	occupiedPlayers.add(choice.player.id);
	
	return Promise.resolve().then(function(){
		if (initializePlayers) return reinitializePlayers();
		return Promise.resolve();
	}).then(function(result){
		return choice.player.choose(choice.options);
	}).then(function(result){
		result = result || choice.defaultOption;
		
		//This will probably only happen if it's a single-player game, otherwise we'll use playoffs defined in a Turn
		if (usePayoffs) {	
			choice.player.score += choice.payoffs[result];
		}
		
		var historyEntry = {
			player:choice.player.id,
			move:result,
			choice:choice.id
		}
		if (writeHistory) gameHistory.push(historyEntry);
		
		var resultObject = {
			result,
			historyEntry
		};
		
		return Promise.resolve(resultObject)		//TODO: add information mechanisms
	})
	.then(function(result){
	
		log("silly","_Choice.play: removing from occupiedPlayers: ", choice.player.id)
		if (releasePlayer) choice.releasePlayer();
	
		return choice.proceed(result, shortCircuit);
		
	});
};

//Release player from excluded players list, so that other objects can use it.
_Choice.prototype.releasePlayer = function(){
	occupiedPlayers.remove(this.player.id);
};


_Choice.prototype.findNext = function({result}={}){
	return this.next[result.result];
}

_Choice.prototype.generateChainingFunctions = function(choice){
	var _choice = this;
	
	_choice.options.forEach(function(option){
		_choice.payoffs[option] = 0;			//Start payoffs at zero
		
		choice[option] = function(payoff){					//Create functions for user to assign payoffs
			if (!isNaN(payoff))_choice.payoffs[option] = payoff;			
			return Promise.resolve({
				playable:choice,
				path:[option]
			})
		};
	});
};

//Set all payoffs to zero.
_Choice.prototype.zeroPayoffs = function(){
	var choice = this;
	
	choice.payoffs = {};
	
	choice.options.forEach(function(option){
		choice.payoffs[option] = 0;	
	});
};



function Choice(player, options, {id=null, initializePlayers=false, usePayoffs=false, shortCircuit=false, writeHistory=true, releasePlayer=true}={}){
	var id = idHandler(id,"choice")
	
	//Create backend choice object
	var _choice = new _Choice(id, player.id(), options, {initializePlayers, usePayoffs, shortCircuit, writeHistory, releasePlayer});
	
	//Return this reference object to the user. Run the function to select a source
	var choice = Playable(_choice)
	
	
	//Interface to specify single-player payoffs in single-player/single-choice games
	_choice.zeroPayoffs();       
	
	_choice.generateChainingFunctions(choice);
	
	/*
	options.forEach(function(option){
		_choice.payoffs[option] = 0;			//Start payoffs at zero
		
		choice[option] = function(payoff){					//Create functions for user to assign payoffs
			if (!isNaN(payoff))_choice.payoffs[option] = payoff;			
			return Promise.resolve({
				playable:choice,
				path:[option]
			})
		};
	});
	*/
	
	
	//Function to set all payoffs at once
	choice.setAllPayoffs = function(payoffs){
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};
	
	
	//Way for user to interact with payoffs
	choice.payoffs = function(){return registry.choices[id].payoffs;};
	
	return choice;	
}



module.exports = {_Choice, Choice};