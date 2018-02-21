"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler, isFunction}	= require('../helperFunctions').general;

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Game
function _Halt(id,testCondition, {logContinue = false}){
	_Playable.call(this,id);
	
	this.testCondition = testCondition;
	this.logContinue = logContinue;
	
	registry.halts[id] = this;
}

_Halt.prototype = Object.create(_Playable.prototype);

_Halt.registryName = "halts";
_Halt.counterName = "haltIf";

_Halt.prototype.play = function({initializePlayers=false, shortCircuit=false, writeHistory=true}={}){
	
	var halt = this;
	var historyEntry = {halt:halt.id};
	
	var test = halt.testCondition();
	
	var resultObject = {'playable':halt};
	
	if (test) {
		log("info", "Halting at " + halt.id)
		
		historyEntry.action = "halt";
		if (writeHistory) gameHistory.push(historyEntry)
		
		resultObject.result = "Halt";
		resultObject.historyEntry = historyEntry;
	
		return Promise.reject(resultObject);
	}
	
	var resultObject = {
		'result':"Continued",
		'playable':halt
	};
	
	//Halt probably gets used for loops, and we might not want to see lots of continue messages, so "logContinue" will omit them.
	if (!halt.logContinue) return Promise.resolve(resultObject)
	
	//Otherwise Log the continue action.
	historyEntry.action = "continue";
	if (writeHistory) gameHistory.push(historyEntry)
	
	resultObject.historyEntry = historyEntry;
	
	return Promise.resolve(resultObject)
	.then(function(result){	
		
		//TODO: add information mechanisms
		
		return Promise.resolve(result)		
	}).then(function(result){
		
		return halt.proceed(result, shortCircuit);
	});
};





function HaltIf(testCondition=function(){}, {id=null, logContinue=false}={}){
	var id = idHandler(id,"haltIf")
	
	if (!isFunction(testCondition)) log("warn",id + ": testCondition should be a function, or else game will not halt.")

	//Create backend loop object
	var _halt = new _Halt(id, testCondition, {logContinue});
	
	
	//Return this reference object to the user. Run the function to select a source
	var halt = Playable(_halt);	
	return halt;	
}


module.exports = {_Halt, HaltIf};