"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler} = require('../helperFunctions').general;
var {chainerGenerator} = require('../helperFunctions').playable;

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Loop

function _Loop(id, playable, count, {logContinue=false}){
	_Playable.call(this,id);
	
	this.playable = registry.playables[playable.id()];
	this.logContinue = logContinue;
	
	this.count = count;
	
	registry.loops[id] = this;
}
_Loop.prototype = Object.create(_Playable.prototype);


_Loop.registryName = "loops";
_Loop.counterName = "loop";


_Loop.prototype.handleHistory = function(historyEntry, writeHistory, previousResult){
			
	// If writing history, then write it and replace result property
	if (writeHistory) {
		gameHistory.push(historyEntry)
		previousResult.historyEntry = historyEntry
	}
		
	//If not writing history, then assume it will be written later, and we should keep previous result. Previous result might not be an array, so turn it into one if not. If blank, start with current data.
	else {
	//If blank, start from here
		if (!previousResult.historyEntry) result.historyEntry = historyEntry;
		//If not blank and array, add to array
		else if (Array.isArray(previousResult.historyEntry)) previousResult.historyEntry.push(historyEntry);
		//If not blank and not array, take previous value, put it in an array. and add new entry.
		else previousResult.historyEntry = [previousResult.historyEntry, historyEntry];
	}
};


_Loop.prototype.play = function({initializePlayers=false, shortCircuit=false, writeHistory=true}={}){
	
	var loop = this;
	loop.counter = 0;
	
	
	var promise = Promise.resolve()
	
	var action = function(result){
		
		loop.counter++;
		if (!result) result = {};
		
		
		//Deal with history
		
		var historyEntry = {
			loop:loop.id,
			loopTo:loop.playable.id,
			count:loop.counter
		};
		loop.handleHistory(historyEntry, writeHistory, result)
		
		return loop.playable.play({shortCircuit:true, writeHistory:writeHistory})
		.then(function(result){
		
			//Re-format result, replace Turn playable with Loop playable
			result.playable = loop;
			
			//TODO: add information mechanisms
		
			return Promise.resolve(result)		
		});
	};
	
	//Repeat the playable loop.count times, by chaining promises.
	for (var i = 0; i < loop.count; i++) {
		
		promise = promise.then(action);
	}
	
	
	return promise.then(function(result){
		
		var continueEntry = {};
		
		//Write final entry if logContinue is set to true
		if (loop.logContinue) {
			
			continueEntry = {
				loop:loop.id,
				loopTo:"Loop finished.",
				count:loop.counter
			};
			
			loop.handleHistory(continueEntry, writeHistory, result)
		}
		
		return loop.proceed(result, shortCircuit);
	});
};



function Loop(playable, count=1, {logContinue=false, id=null}={}){
	var id = idHandler(id,"loop")
	

	//Create backend loop object
	var _loop = new _Loop(id, playable, count, {logContinue});
	
	
	//Return this reference object to the user. Run the function to select a source
	var loop = Playable(_loop);	
	return loop;	
}


module.exports = {_Loop, Loop};