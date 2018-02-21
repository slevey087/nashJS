"use strict";

var log = require('../logger');

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {idHandler, isObject}	= require('../helperFunctions').general;
var {chainerGenerator, 
	outcomeTreeGetValue,
	outcomeTreeSetValue} 	= require('../helperFunctions').playable;
var {recurse} 				= require('../helperFunctions').turn;

//Parent class
var {_Playable, Playable} = require('./playable');


//Backend function class for Turn
function _Turn(id, choices, parameters={}){
	_Playable.call(this,id);
	
	this.payoffs = {};
	this.payoffsImplicit = {};
	this.payoffsExplicit = {};
	
	this.next = {};
	
	this.choices = choices.map(function(choice){
		return registry.choices[choice.id()];
	});;
	
	registry.turns[id] = this;
	
	var turn = this;
	
	this.choiceMap = this.choices.map(function(item){
		return item.options;
	});
	
	
	recurse(turn.choiceMap, turn.payoffs,0).then(function(result){
		log("silly","Added 0 payoffs to turn.");
		return recurse(turn.choiceMap, turn.payoffsImplicit,[]);
	}).then(function(result){
		log("silly","Added implicit payoffs map to turn.");
		return recurse(turn.choiceMap, turn.payoffsExplicit,{});
	}).then(function(result){
		log("silly","Added explicit payoffs map to turn.");
		return recurse(turn.choiceMap, turn.next,new Array);
	}).then(function(result){
		log("silly","Added blank next map to turn.");
		return Promise.resolve(result);
	}).catch();							//TODO: error handling here
}
_Turn.prototype = Object.create(_Playable.prototype);

_Turn.registryName = "turns";
_Turn.counterName = "turn";



_Turn.prototype.play = function({usePayoffs=true, initializePlayers=false, shortCircuit=false, writeHistory=true, releasePlayers=true}={}){
	
	var turn = this;
	
	return Promise.all(turn.choices.map(function(choice){
		
		return choice.play({shortCircuit:true, writeHistory:false, releasePlayers:false});
	
	})).then(function(result){
		
		//Re-format output from array of Choice results to single Turn result
		//And release players
		var resultPath = result.map(function(choice, index){
			if (releasePlayers) turn.choices[index].releasePlayer();
			return choice.result;
		});
		
		var resultObject = {
			'result':resultPath,
			'playable':turn
		};
		
		//Write history if necessary
		var historyEntry = {
			turn:turn.id,
			results: result.map(function(result){
				return result.historyEntry;
			})
		};
		resultObject.historyEntry = historyEntry;
		
		if (writeHistory) {
			gameHistory.push(historyEntry)
		}
		
		return Promise.resolve(resultObject)
	}).then(function(result){
	
		//Implement payoffs
		if (usePayoffs) {
			var payoffs = outcomeTreeGetValue(turn.payoffs, result.result);
			var implicitPayoffs = outcomeTreeGetValue(turn.payoffsImplicit, result.result);
			var explicitPayoffs = outcomeTreeGetValue(turn.payoffsExplicit, result.result);
			
			implicitPayoffs.forEach(function(payoff, index){
				turn.choices[index].player.score += payoff;
			});
			
			for (var player in explicitPayoffs) {
				registry.players[player].score += explicitPayoffs[player];
			}
			
			/*
			for (var player in payoffs){
				registry.players[player].score += payoffs[player];
			} */
		}
		
		
		return Promise.resolve(result)		//TODO: add information mechanisms
	}).then(function(result){
		
		return turn.proceed(result, shortCircuit);
		
	});
};

_Turn.prototype.findNext = function({result}={}){
	return outcomeTreeGetValue(this.next, result.result);
}


_Turn.prototype.generateChainingFunctions = function(){
	var _turn = this;
	var turn = _turn.interface;
	
	//Create payoff setter/branch router functions.
	//recurse adds a wrapper around this function which supplies the path.
	recurse(_turn.choiceMap,turn, function(path, payoffs){
		
		//If user supplied payoffs in array form, then translate to object based on which players are involved in the choices
		if (Array.isArray(payoffs)){
			
			if (payoffs.length !== _turn.choices.length) {		//If array isn't right length, then this is unintelligible.
				log("error","Payoff array does not match Turn dimensions, cannot assign payoffs.");
				return Promise.reject(new Error("Payoff array is not correct length"))
			}
			
			
			
			var originalPayoffs = payoffs.slice();
			payoffs = {};
			
			outcomeTreeSetValue(_turn.payoffsImplicit, path, originalPayoffs);
			
			/*
			originalPayoffs.forEach(function(payoff, index){
				payoffs[_turn.choices[index].player.id] = payoff;
			});
			*/
		}		
		else if (isObject(payoffs)) {
			//TODO: clone user supplied payoffs here, so that they don't retain access.
			outcomeTreeSetValue(_turn.payoffsExplicit, path, payoffs);
		}
		
		
		return Promise.resolve({
			playable:turn,
			'path':path
		});
	});
	
};

function Turn(choices, parameters={}){
	var id = idHandler(parameters.id,"turn")
	
	
	//Create backend choice object
	var _turn = new _Turn(id, choices, parameters);
	
	
	//Return this reference object to the user. Run the function to select a source
	var turn = Playable(_turn);
	
	_turn.generateChainingFunctions();
	
	
	//Function to set all payoffs at once
	turn.setAllPayoffs = function(payoffs){
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};
		
	//Way for user to interact with payoffs
	turn.payoffs = function(){return Object.assign({}, registry.turns[id].payoffs);};

	
	return turn;	
}


module.exports = {_Turn, Turn};