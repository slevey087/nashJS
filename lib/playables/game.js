"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler}	= require('../helperFunctions').general;

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Game
function _Sequence(id, playableStart, playableFinish, parameters={}){
	_Playable.call(this,id);
	
	this.playableStart = registry.playables[playableStart.id()];
	this.playableFinish = registry.playables[playableFinish.id()];
	
	registry.sequences[id] = this;
	
}
_Sequence.prototype = Object.create(_Playable.prototype);
_Sequence.prototype.constructor = _Sequence;

_Sequence.registryName = "sequences";
_Sequence.counterName = "sequence";


_Sequence.prototype.play = function({initializePlayers=false, shortCircuit=false, writeHistory=true}={}){
	
	var sequence = this;
	
	//Log the history appropriately
	var startEntry = {
		sequence:sequence.id,
		action:"start"
	};
	if (writeHistory) gameHistory.push(startEntry);
	var thisHistory = [startEntry];
	
	var action = function action(result){
		
		if (Array.isArray(result)) {			
			log('silly', "sequence.play: Next-item is an array, splitting into pieces.")
			
			return Promise.all(result.map(function(item){
				log('silly', "sequence.play: recursing on" ,item)
				return action(item);
			}));
		}
		
		if (result.playable !== sequence.playableFinish) {
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
	
	
	return sequence.playableStart.play({shortCircuit:true, writeHistory:writeHistory}) 
	.then(action)
	.then(function(result){	
		
		var finishEntry = {
			sequence:sequence.id,
			action:"finish"
		};
		thisHistory.push(finishEntry);
		result.historyEntry = thisHistory;
		
		if (writeHistory) gameHistory.push(finishEntry);
		
		
		//TODO: add information mechanisms
		
		return Promise.resolve(result)		
	}).then(function(result){
		
		return sequence.proceed(result, shortCircuit);
		console.log(result);
		return Promise.resolve(result);
	});
};


_Sequence.prototype.summarize = function(summary){
	_Playable.call(this.summarize, summary);
	
	var next = this.playableStart
	do {
		
	}
	while (next && next != this.playableFinish)
}


function Sequence(playableStart, playableFinish, parameters={}){
	var id = idHandler(parameters.id,"game")
	

	//Create backend loop object
	var _sequence = new _Sequence(id, playableStart, playableFinish, parameters);
	
	
	//Return this reference object to the user. Run the function to select a source
	var sequence = Playable(_sequence);	
	return sequence;	
}


module.exports = {_Sequence, Sequence};