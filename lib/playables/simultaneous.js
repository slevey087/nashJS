"use strict";

var log = require('../logger');

//Helper functions
var {isObject} 		  = require('../helperFunctions')("general");
var {idHandler} 	= require('../helperFunctions')("state");

//Parent class
var {_Playable, Playable} = require('./playable');

// Information mechanics
var {Information, PerfectInformation} = require('../information');


//Backend class
function _Simultaneous(id, playableArray, {playableParameters={}}={}){
	_Playable.call(this,id);
	
	this.playableArray = playableArray;
	this.playableParameters = playableParameters;
	
	registry.controllers[id] = this;
}

_Simultaneous.prototype = Object.create(_Playable.prototype);

_Simultaneous.registryName = "controllers";
_Simultaneous.counterName = "simultaneous";


//Simultaneous Promise.all's the playables, which causes them to run meshed. 
_Simultaneous.prototype.play = function({history=gameHistory, information=PerfectInformation}={}){
	
	var simultaneous = this;
	
	history.log.add({
		simultaneous:simultaneous.id,
		action: "Simultaneous start."
	});
	var simultaneousHistory = history.child();
	
	var simultaneousInformation = new Information();
	
	//TODO: create Information object here.
	
	return Promise.all(simultaneous.playableArray.map(function(playable){
		return playable.play({history:simultaneousHistory});
	})).then(function(resultArray){
		
		var resultObject = {
			resultArray,
			playable:simultaneous,
			historyEntry:{
				simultaneous:simultaneous.id,
				action:simultaneousHistory.orphan()
			}
		};
		return resultObject;
	});
};


_Simultaneous.prototype.handleHistory = function({history=gameHistory}={},result){
	
	history.log.add({
		simultaneous:this.id,
		action: "Simultaneous complete."
	});
	
	history.addNoLog(result.historyEntry);
	
	return Promise.resolve(result);
};

//Frontend class
function Simultaneous(playableArray, parameters={}){
	var id = idHandler(parameters.id,"simultaneous")
	
	playableArray = playableArray.map(function(playable){
		return registry.playables[playable.id()];
	});
	
	
	//Create backend instance.
	var _simultaneous = new _Simultaneous(id, playableArray, parameters);
	
	//Return this reference object to the user. Run the function to select a source
	var simultaneous = Playable(_simultaneous);
	return simultaneous;
}


module.exports = {_Simultaneous, Simultaneous};