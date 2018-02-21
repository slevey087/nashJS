"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler, isFunction}	= require('../helperFunctions').general;

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Game
function _Lambda(id, action, parameters={}){
	_Playable.call(this,id);
	
	this.action = action;
	
	registry.lambdas[id] = this;
}
_Lambda.prototype = Object.create(_Playable.prototype);


_Lambda.registryName = "lambdas";
_Lambda.counterName = "lambda";


_Lambda.prototype.play = function({initializePlayers=false, shortCircuit=false, writeHistory=true}={}){
	
	var lambda = this;
		
	var result = lambda.action()
		
	var resultObject = {
		result,
		'playable':lambda
	};
	
	//History
	var historyEntry = {
		lambda:lambda.id,
		result
	}
	
	if (writeHistory) gameHistory.push(historyEntry);
	resultObject.historyEntry = historyEntry;
	
	return Promise.resolve(resultObject)
	.then(function(result){	
		
		//TODO: add information mechanisms
		
		return Promise.resolve(result)		
	}).then(function(result){
		
		return lambda.proceed(result, shortCircuit);
	});
};



function Lambda(action=function(){}, parameters={}){
	var id = idHandler(parameters.id,"lambda")
	
	if (!isFunction(action)) log("warn",id + ": action should be a function.")

	//Create backend lambda object
	var _lambda = new _Lambda(id, action, parameters);
	
	
	//Return this reference object to the user. Run the function to select a source
	var lambda = Playable(_lambda);	
	return lambda;	
}


module.exports = {_Lambda, Lambda};