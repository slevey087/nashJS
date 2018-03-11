"use strict";

var log = require('../logger');
log("debug", "Loading Class: Playable")

var {SynchronousPromise} = require('synchronous-promise');
var present = require('present');

//Game state controllers
var {registry, idCounters} = require('../state');
var {gameHistory, History} 		= require('../history');

//Helper functions
var {isFunction} 		  = require('../helperFunctions')("general");
var {outcomeTreeAddAll}   = require('../helperFunctions')("playable");
var {reinitializePlayers} = require('../helperFunctions')("player");

//To return to user
var {Population}		= require('../population');


//_playable class, superclass for objects which can execute game steps (choice, turn, game)
function _Playable(id){
	this.id = id;
	this.next = [];
	registry.playables[id] = this;
	idCounters.playable++;
};

_Playable.registryName = "playables";
_Playable.counterName = "playable";

//Add reference to next playable branch, to chain playables together.
_Playable.prototype.addNext = function(nextPlayable){
	outcomeTreeAddAll(this.next,nextPlayable);
};

_Playable.prototype._startTimer = function(){
	this._timer = present();
	return Promise.resolve();
};

_Playable.prototype.prePlay = function({initializePlayers=false}={}){
	return initializePlayers ? reinitializePlayers() : Promise.resolve();
};

_Playable.prototype.handleHistory = function({history=gameHistory}={}, result){
	return Promise.resolve(result).then(function(result){
		if (result.historyEntry) history.add(result.historyEntry);
		return Promise.resolve(result)
	})
	
}

_Playable.prototype.postPlay = function({}={}, result){
	return Promise.resolve(result);
};

_Playable.prototype._stopTimer = function({}={}, result){
	if (result.historyEntry) result.historyEntry.duration = present() - this._timer;
	delete this._timer;
	
	return Promise.resolve(result);
};



_Playable.prototype.findNext = function(){
	return this.next;
};

//Determine whether to play next, and if so, do.
_Playable.prototype.proceed = function({shortCircuit}={}, result){
	var playable = this;
	
	return Promise.resolve(result).then(function(result){
		//Replace reported playable with latest running playable (this is necessary for short-circuit logic)
		console.log(result);
		result.playable = playable;
		
		
		//Short-circuit logic allows higher-order playable to figure out what to do next.
		if (shortCircuit) return Promise.resolve(result);
		
		return playable.playNext(result);
	});
};


//Play next.
_Playable.prototype.playNext = function(result, parameters={}){
	
	var playable = this;
	
	return Promise.resolve(result).then(function(result){
		//Find out where to go next
		var next = playable.findNext({result});	

		//If there's somewhere to go, then go.
		if (next[0] instanceof _Playable) return Promise.all(next.map(function(playable){return playable.play(parameters);}));
		
		//Otherwise, we're done here
		return Promise.resolve(result);	
	});
};





//Convoluted code here to produce the object that user interacts with (ie c1 in 'c1 = Choice()')
//This mimics creating a class that inherits from Function. First define the "prototype", which includes
//a "constructor", a "call" method that will get called, and any other properties and methods.
//Then 'classFactory' produces the class/constructing object (see below), which you can use to
//produce the actual objects.

var playablePrototype = Object.create(Function.prototype);


playablePrototype.constructor = function (_playable) {
	
	var playable = this;
	
	//Tag-back. Store the front-end object in the back-end object, for retrieval
	_playable.interface = playable;
	
	
	this.call = function(source){
		var previousPlayable, path;
	
		//TODO: verify that source is the right type
	
		return SynchronousPromise.all([function(){
			if (source instanceof Promise || source instanceof SynchronousPromise) {
				source.then(function(result){
					previousPlayable = registry.playables[result.playable.id()];
					path = result.path
					return SynchronousPromise.resolve();
				});				
			}
			return SynchronousPromise.resolve()
		}(), function(){
			if (!(source instanceof Promise || source instanceof SynchronousPromise)) {
				previousPlayable = registry.playables[source.id()];	
				path = source.path;
			}
			return SynchronousPromise.resolve();
		}()]).then(function(result){
			
			log("debug","Adding next playable to " + previousPlayable.id + ", node " +_playable.id)
			
			if (path == "all") previousPlayable.addNext(_playable);
			else {
				
				outcomeTreeGetValue(previousPlayable.next, path).push(_playable); 
			}
			
			log("silly",previousPlayable.next);
				//previousPlayable.next[selected].push(_choice);
		
			return SynchronousPromise.resolve({
				'playable':playable,
				path:"all"
			});
		});
	};
	
	this.id = function(){return _playable.id;};
	
	this.play = function({initializePlayers=false,usePayoffs=true, shortCircuit=false, writeHistory=true, clearHistory=true, releasePlayers=true}={}){
		
		if (clearHistory) gameHistory.clearHistory();
		var history = writeHistory ? gameHistory : new History();
		
		return Promise.resolve()
		.then(function(result){
			return _playable.play({
				initializePlayers, 
				usePayoffs, 
				shortCircuit,
				history,
				releasePlayers
			});
		})
		.catch(function(reason){
			console.log(reason)
			
			//If the game was stopped by a Halt playable or everybody's dead, we'll end up here, and things are fine. Just log it.
			if (reason.result == "Halt") {
				gameHistory.add(reason.historyEntry);
				return Promise.resolve(reason.result)	
			}
			else if (reason.result == "Population Collapse") return Promise.resolve(reason.result);
			else {
				history.log.add({error: reason});
				return Promise.reject(reason);
			}
		}).then(function(result){
			//Replace result, so that user can't get access to _playables
			
			return Promise.resolve({
				Population:Population(), 
				gameHistory
			});
		});
	};
};


playablePrototype.call = function () {
		//This will get overwritten when the "constructor" is called, but leaving it here so you can figure out how the hell this works.
};

	
playablePrototype.path = "all";



//Produces the function that will produce the end result. This part is reusable if you need to do this again.
var classFactory = function (proto) {
	return function () {
		
		var f = function () {
			return f.call.apply(f, arguments);      
		};
		
		Object.defineProperty(f, "constructor", {configurable:true, writable:true});
		Object.defineProperty(f, "call", {writable:true});
		
		Object.keys(proto).forEach(function (key) {
			f[key] = proto[key];
		});
		
		f.constructor.apply(f, arguments);
		
		delete f.constructor;		//Added this bit here, to prevent the user from trying to create new objects.
		
		return f;
	}
};


var Playable = classFactory(playablePrototype);
// called as: var instance = Playable(/* some internal object like _choice */);




module.exports = {_Playable, Playable};