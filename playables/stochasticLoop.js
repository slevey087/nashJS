"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler} 		= require('../helperFunctions').general;
var {chainerGenerator} 	= require('../helperFunctions').playable;

//Parent classes
var {_Playable,Playable} = require('./playable');
var {_Loop, Loop} 		 = require('./loop');


//Backend function class for StochasticLoop
function _SLoop(id, playable, probability, parameters){
	_Loop.call(this,id, playable, null, parameters);
	
	this.playable = registry.playables[playable.id()];
	
	//This inherits from Loop which uses a count. Delete that and replace with probability.
	delete this.count;			
	this.probability = probability;						
	
	this.generator = Math.random;				//TODO: allow user to specify random number generator
	
	registry.sLoops[id] = this;
}
_SLoop.prototype = Object.create(_Loop.prototype);


_SLoop.registryName = "sLoops";
_SLoop.counterName = "stochasticLoop";


_SLoop.prototype.play = function({initializePlayers=false, shortCircuit=false, writeHistory=true}={}){
	
	var sLoop = this;
	sLoop.counter = 0;
	
	var promise = Promise.resolve({});
	
	//Section that will be looped
	var action = function(result){
		
		sLoop.counter++;
		if (!result) result = {};
		
		
		//Deal with history
		
		var historyEntry = {
			loop:sLoop.id,
			loopTo:sLoop.playable.id,
			count:sLoop.counter
		};
		sLoop.handleHistory(historyEntry, writeHistory, result)
		
		return sLoop.playable.play({shortCircuit:true})
		.then(function(result){
		
			//TODO: add information mechanisms
		
			return Promise.resolve(result)		
		});
	};
	
	
	//Generate random numbers, repeat while number is above halting probability
	while (sLoop.generator() > sLoop.probability) {
		promise = promise.then(action);
	}
	
	
	return promise.then(function(result){
		
		var continueEntry = {};
		
		//Write final entry if logContinue is set to true
		if (sLoop.logContinue) {
			
			continueEntry = {
				loop:sLoop.id,
				loopTo:"Loop finished.",
				count:sLoop.counter
			};
			
			sLoop.handleHistory(continueEntry, writeHistory, result)
		}
		
		return sLoop.proceed(result, shortCircuit)
	});
};



//User interface
function StochasticLoop(playable, probability=.5, {id=null, logContinue=false}={}){
	var id = idHandler(id,"stochasticLoop")
	
	if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');
	
	//Create backend sLoop object
	var _sLoop = new _SLoop(id, playable, probability, {logContinue});
	
	
	//Return this reference object to the user. Run the function to select a source
	var sLoop = Playable(_sLoop);
	return sLoop;	
}



module.exports = {_SLoop, StochasticLoop};