"use strict";

var log = require('../logger');
log("debug", "Loading Class: HaltIf")

//Game state controllers
var {registry} = require('../state');
var {gameHistory} = require('../history');

//Helper functions
var {isFunction}	= require('../helper-functions')("general");
var {idHandler} 	= require('../helper-functions')("state");

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
_Halt.prototype.constructor = _Halt;

_Halt.registryName = "halts";
_Halt.counterName = "haltIf";

_Halt.prototype.play = function({initializePlayers=false, shortCircuit=false, history=gameHistory}={}){
	
	var halt = this;
	
	var resultObject = {
		'playable':halt,
		'historyEntry':{
			'halt':halt.id
		}
	};
	
	
	var test = halt.testCondition();
	
	
	if (test) {
		log("info", "Halting at " + halt.id)
		
		resultObject.historyEntry.action = "halt";
		resultObject.result = "Halt";
	
		return Promise.reject(resultObject);
	}
	
	//Halt probably gets used for loops, and we might not want to see lots of continue messages, so "logContinue" will omit them.
	if (halt.logContinue) {
		resultObject.historyEntry.action = "continue";
	}
	else delete resultObject.historyEntry
	
	
	return Promise.resolve(resultObject)
};


_Halt.prototype.summaryThis = function(summary){
	summary.condition = this.testCondition.toString();
}



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