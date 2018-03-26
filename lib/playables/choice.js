"use strict";

var log = require('../logger');
log("debug", "Loading Class: Choice")

// External dependency
var {SynchronousPromise} = require('synchronous-promise');

//Game state controllers
var {registry} = require('../state');
var {gameHistory} = require('../history');
var {PerfectInformation} = require('../information');

//Helper functions
var {idHandler} = require('../helperFunctions')("state");
var {isFunction} = require('../helperFunctions')("general");
var {chainerGenerator} = require('../helperFunctions')("playable");

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Choice
function _Choice(id, player, options, parameters={}){
	_Playable.call(this,id);
	
	this.next = {}
	
	this.player = registry.players[player];
	this.options = options;
	this.defaultOption = parameters.defaultOption || options[0];		//TODO: make defaultOption functional
	this.informationFilter = parameters.informationFilter || null;
	
	registry.choices[id] = this;
	
	var choice = this;
	this.options.forEach(function(item){
		choice.next[item] = [];
	});
}

_Choice.prototype = Object.create(_Playable.prototype);
_Choice.prototype.constructor = _Choice;

_Choice.registryName = "choices";
_Choice.counterName = "choice";



_Choice.prototype.play = function({usePayoffs=false, history=gameHistory, information:rawInformation=PerfectInformation, releasePlayer=true, informationFilter = this.informationFilter, _compileInformation=null}={}){
	
	var choice = this;
	
	if (!choice.player.alive) return Promise.reject({result: choice.id + ": Player " +choice.player.id + " is dead."})
	
	//While this choice is happening, don't allow other choices to use this player.
	choice.player.available = false;
	
	//Information mechanics. If we're dealing with PerfectInformation, this won't get delivered, so we'll include it in the call to .deliver(). If we're using an information supplied from some other playable, then they can do what they like with it.
	var choiceInfo = {
		choice: {
			id:choice.id,
			player:choice.player.id,
			options:choice.options
		}
	};
	rawInformation.addAdditional(choiceInfo)
	//Perform some data processing if other playables need it.
	if (_compileInformation) _compileInformation(rawInformation);
	
	return Promise.resolve().then(function(){
		//Prep information
		var information = rawInformation.deliver(choice.player, choiceInfo);
		if (informationFilter) information = informationFilter(information);
			
		return choice.player.choose(choice.options, information);
	}).then(function(result){
		
		var player = choice.player;
		var id = choice.id
		
		//Add to player's individual history;
		player.history.push({
			choice:id,
			options:choice.options,
			result
		});
		
		result = result || choice.defaultOption;
		
		var resultObject = {
			result,
			historyEntry:{
				choice:id,
				player:player.id,
				move:result
			}
		};
		
		//This will probably only happen if it's a single-player game, otherwise we'll use playoffs defined in a Turn
		if (usePayoffs) {
			var payout = choice.payoffs[result]
			
			player.score += payout;
			
			//track the payoff
			var scoreEntry = {
				choice:id,
				payouts:{
					[player.id]: Number(payout)
				}
			}
			
			gameHistory.scores.add(scoreEntry);
			resultObject.historyEntry.payouts =  {[player.id]: payout};
		}
		  
		
		
		log("silly","_Choice.play: removing from occupiedPlayers: ", choice.player.id)
		if (releasePlayer) choice.releasePlayer();
		
		return Promise.resolve(resultObject)		//TODO: add information mechanisms
	});
};

//Release player from excluded players list, so that other objects can use it.
_Choice.prototype.releasePlayer = function(){
	this.player.available = true;
};


_Choice.prototype.findNext = function({result}={}){
	return this.next[result.result];
}

_Choice.prototype.generateChainingFunctions = function(choice){
	var _choice = this;
	
	_choice.options.forEach(function(option){
		_choice.payoffs[option] = 0;			//Start payoffs at zero
		
		choice[option] = function(payoff){					//Create functions for user to assign payoffs
			if (!isNaN(payoff))_choice.payoffs[option] = payoff;			
			return SynchronousPromise.resolve({
				playable:choice,
				path:[option]
			})
		};
	});
};

_Choice.prototype.summaryThis = function(summary){
	summary.player = this.player.id;
	summary.options = this.options.slice();
	
	return summary;
}

//TODO: un-fuck this.
_Choice.prototype.summaryNext = function(summary, entries={}, shortCircuit=false, maxEntries=10){
		
		// Copy over the choice options
		summary.next = Object.assign({}, this.next);
		
		// Loop through them and summarize at each step. 
		var count = 0;
		for (var key in summary.next){
			summary.next[key] = summary.next[key].map(function(playable){
				count++;
				return playable.summarize({}, entries);
			});
		}
		
		// If there weren't any next steps, delete the next key, to reduce clutter.
		if (count == 0) delete summary.next;
	
	return summary;
}



//Set all payoffs to zero.
_Choice.prototype.zeroPayoffs = function(){
	var choice = this;
	
	choice.payoffs = {};
	
	choice.options.forEach(function(option){
		choice.payoffs[option] = 0;	
	});
};



function Choice(player, options, parameters={}){
	var id = idHandler(parameters.id,"choice")
	
	//If informationFilter was supplied, it must be a function
	if (parameters.informationFilter && !isFunction(parameters.informationFilter)) throw new Error("informationFilter must be a function");
	
	//Create backend choice object
	var _choice = new _Choice(id, player.id(), options, parameters);
	
	//Return this reference object to the user. Run the function to select a source
	var choice = Playable(_choice)
	
	
	//Interface to specify single-player payoffs in single-player/single-choice games
	_choice.zeroPayoffs();       
	
	_choice.generateChainingFunctions(choice);
	
	/*
	options.forEach(function(option){
		_choice.payoffs[option] = 0;			//Start payoffs at zero
		
		choice[option] = function(payoff){					//Create functions for user to assign payoffs
			if (!isNaN(payoff))_choice.payoffs[option] = payoff;			
			return Promise.resolve({
				playable:choice,
				path:[option]
			})
		};
	});
	*/
	
	
	//Function to set all payoffs at once
	choice.setAllPayoffs = function(payoffs){
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};
	
	
	//Way for user to interact with payoffs
	choice.payoffs = function(){return registry.choices[id].payoffs;};
	
	return choice;	
}



module.exports = {_Choice, Choice};