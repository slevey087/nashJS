"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler}	= require('../helperFunctions').general;

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Game
function _Game(id, playableStart, playableFinish, parameters={}){
	_Playable.call(this,id);
	
	this.playableStart = registry.playables[playableStart.id()];
	this.playableFinish = registry.playables[playableFinish.id()];
	
	registry.games[id] = this;
	
}
_Game.prototype = Object.create(_Playable.prototype);

_Game.registryName = "games";
_Game.counterName = "game";


_Game.prototype.play = function({initializePlayers=false, shortCircuit=false, writeHistory=true}={}){
	
	var game = this;
	
	//Log the history appropriately
	var startEntry = {
		game:game.id,
		action:"start"
	};
	if (writeHistory) gameHistory.push(startEntry);
	var thisHistory = [startEntry];
	
	var action = function action(result){
		
		if (Array.isArray(result)) {			
			log('silly', "game.play: Next-item is an array, splitting into pieces.")
			
			return Promise.all(result.map(function(item){
				log('silly', "game.play: recursing on" ,item)
				return action(item);
			}));
		}
		
		if (result.playable !== game.playableFinish) {
			log("silly",result)
			
			if (result.playable.findNext({result}).length > 0) {
				log("silly", "Playable has next-item, recursing");
				
				return result.playable.playNext(result, {shortCircuit:true, writeHistory:writeHistory})
				.then(function(result){
					
					//Log histories
					thisHistory.push(result.historyEntry);
					
					return Promise.resolve(result);
				})
				.then(action);		//Repeat for next playable in chain
			}
			return Promise.resolve(result);
		}
		return Promise.resolve(result);
	}
	
	
	return game.playableStart.play({shortCircuit:true, writeHistory:writeHistory}) 
	.then(action)
	.then(function(result){	
		
		var finishEntry = {
			game:game.id,
			action:"finish"
		};
		thisHistory.push(finishEntry);
		result.historyEntry = thisHistory;
		
		if (writeHistory) gameHistory.push(finishEntry);
		
		
		//TODO: add information mechanisms
		
		return Promise.resolve(result)		
	}).then(function(result){
		
		return game.proceed(result, shortCircuit);
		console.log(result);
		return Promise.resolve(result);
	});
};





function Game(playableStart, playableFinish, parameters={}){
	var id = idHandler(parameters.id,"game")
	

	//Create backend loop object
	var _game = new _Game(id, playableStart, playableFinish, parameters);
	
	
	//Return this reference object to the user. Run the function to select a source
	var game = Playable(_game);	
	return game;	
}


module.exports = {_Game, Game};