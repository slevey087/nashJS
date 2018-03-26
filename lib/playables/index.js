"use strict";

//Loads the playables that will be used by Nash. This is basically the controller list: if it's not in these lists,
// then it won't be available for us. 


//External dependency
var present = require('present');

var log = require('../logger');

var {applyBind} = require('../helperFunctions')("general");

log("debug", "Loading Playable Classes: ")

//Playables
var {_Playable} 					= require('./playable');
var {_Choice, Choice} 				= require('./choice');
var {_Turn, Turn} 					= require('./turn');
var {_Sequence, Sequence}			= require('./sequence');
var {_Loop, Loop} 					= require('./loop');
var {_SLoop, StochasticLoop}		= require('./stochasticLoop');
var {_Halt, HaltIf}					= require('./halt-if');
var {_SHalt, StochasticHalt}		= require('./stochastic-halt');
var {_Lambda, Lambda}				= require('./lambda');
var {_RPChoice, RandomPlayerChoice} = require('./random-player-choice');
var {_PopulationDynamics, PopulationDynamics} = require('./population-dynamics');
var {_Simultaneous, Simultaneous} 	= require('./simultaneous');

//Runs when loading Playable classes.
function initializePlayableClass(playableClass){
	
	//Replace the .play() method with a wrapper which calls it and a few other functions
	if (playableClass.prototype.hasOwnProperty("play")) {
		playableClass.prototype.play = (function(play){
			return function({history=gameHistory}={}){
	
				var playable = this;
				var args = [].slice.call(arguments);
				if (history.stop) return {playable};
				console.log(args)
				
				return _Playable.prototype._startTimer.apply(playable, args)
					.then(applyBind(playable.prePlay, playable, args))
					.then(applyBind(play, playable, args))
					.then(applyBind(playable.postPlay, playable, args))
					.then(applyBind(_Playable.prototype._stopTimer, playable, args))
					.then(applyBind(playable.handleHistory, playable, args))
					.then(applyBind(_Playable.prototype.proceed,playable,args));
				
			};
		})(playableClass.prototype.play);
	}
	
};


exports.playableClasses = {_Playable, _Choice, _Turn, _Sequence, _Loop, _SLoop, _Halt, _SHalt, _Lambda, _RPChoice, _PopulationDynamics, _Simultaneous};
exports.playableInterfaces = {Choice, Turn, Sequence, Loop, StochasticLoop, HaltIf, StochasticHalt, Lambda, RandomPlayerChoice, PopulationDynamics, Simultaneous};


for (var playableClass in exports.playableClasses){
	if (playableClass != "_Playable")
		initializePlayableClass(exports.playableClasses[playableClass]);
}
