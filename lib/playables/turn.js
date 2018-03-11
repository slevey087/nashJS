"use strict";

var log = require('../logger');
log("debug", "Loading Class: Turn")

//Game state controllers
var {registry} = require('../state');
var {gameHistory} = require('../history');

//Helper functions
var {isObject}				= require('../helperFunctions')("general");
var {chainerGenerator, 
	outcomeTreeGetValue,
	outcomeTreeSetValue} 	= require('../helperFunctions')("playable");
var {recurse} 				= require('../helperFunctions')("turn");
var {idHandler} 				= require('../helperFunctions')("state");

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



_Turn.prototype.play = function({usePayoffs=true, initializePlayers=false, shortCircuit=false, history=gameHistory, releasePlayers=true}={}){
	
	var turn = this;
	var choiceHistory = history.child();
	
	history.log.add({
		turn:turn.id,
		choices:turn.choices.map(function(choice){
			return choice.id;
		})
	});
	
	return Promise.all(turn.choices.map(function(choice){
		
		return choice.play({shortCircuit:true, history:choiceHistory, releasePlayers:false});
	
	})).then(function(result){
		
		
		//Re-format output from array of Choice results to single Turn result
		//And release players
		var resultPath = result.map(function(choice, index){
			if (releasePlayers) turn.choices[index].releasePlayer();
			return choice.result;
		});
		
		//Pass along results and record history
		var resultObject = {
			'result':resultPath,
			'playable':turn,
			'historyEntry':{
				turn:turn.id,
				results: choiceHistory.orphan()
			}
		};
		
		
		
		return Promise.resolve(resultObject);
	}).then(function(result){
	
		//Implement payoffs
		if (usePayoffs) {
			var payoffs = outcomeTreeGetValue(turn.payoffs, result.result);
			var implicitPayoffs = outcomeTreeGetValue(turn.payoffsImplicit, result.result);
			var explicitPayoffs = outcomeTreeGetValue(turn.payoffsExplicit, result.result);
			
			implicitPayoffs.forEach(function(payoff, index){
				turn.choices[index].player.score += payoff;
				
				//track the payoff
				var scoreEntry = {
					turn:turn.id,
					player:turn.choices[index].player.id,
					scoreChange:Number(payoff)
				};
			
				gameHistory.scores.add(scoreEntry);
			});
			
			
			for (var player in explicitPayoffs) {
				registry.players[player].score += explicitPayoffs[player];
				
				//track the payoff
				var scoreEntry = {
					turn:turn.id,
					player:registry.players[player].id,
					scoreChange:Number(explicitPayoffs[player])
				};
			
				gameHistory.scores.add(scoreEntry);
			}
			
		}
		
		
		return Promise.resolve(result)		//TODO: add information mechanisms
	});
};


//Overwrite default history handler, because we don't want a second entry in the tree
_Turn.prototype.handleHistory = function({history=gameHistory}={},result){
	history.addNoLog(result.historyEntry);
	
	return Promise.resolve(result);
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