"use strict";

//Loads the playables that will be used by Nash. This is basically the controller list: if it's not in these lists,
// then it won't be available for us.

var log = require("../logger");
log("debug", "Loading Playable Classes: ");

//External dependency
var present = require("present");

// Utility function
var { applyBind } = require("../helper-functions")("general");

// history controller
var { gameHistory } = require("../history")

//Playables
var { _Playable } = require("./playable");
var { _Choice, Choice } = require("./choice");
var { _Range, Range } = require("./range");
var { _Turn, Turn } = require("./turn");
var { _Sequence, Sequence } = require("./sequence");
var { _Consecutive, Consecutive } = require("./consecutive");
var { _Loop, Loop } = require("./loop");
var { _SLoop, StochasticLoop } = require("./stochasticLoop");
var { _Halt, HaltIf } = require("./halt-if");
var { _SHalt, StochasticHalt } = require("./stochastic-halt");
var { _Lambda, Lambda } = require("./lambda");
var { _RPChoice, RandomPlayerChoice } = require("./random-player-choice");
var { _PopulationDynamics, PopulationDynamics } = require("./population-dynamics");
var { _Simultaneous, Simultaneous } = require("./simultaneous");

//Runs when loading Playable classes.
function initializePlayableClass(playableClass) {

	//Replace the .play() method with a wrapper which calls it and a few other functions
	if (playableClass.prototype.hasOwnProperty("play")) {
		playableClass.prototype.play = (function(play) {
			return function(...args) {
				if (!args[0]) args[0] = {}
				var playable = this;

				// Set our history
				args[0].history ? null : args[0].history = this.history || gameHistory

				// how to halt the game without errors. TODO this is probably fucked
				if (args[0].history.stop) return { playable };


				return _Playable.prototype._startTimer
					.apply(playable, args)
					.then(applyBind(playable.checkInit, playable, args))
					.then(applyBind(playable.prePlay, playable, args))
					.then(applyBind(play, playable, args))
					.then(applyBind(playable.postPlay, playable, args))
					.then(applyBind(_Playable.prototype._stopTimer, playable, args))
					.then(applyBind(playable.handleHistory, playable, args))
					.then(applyBind(_Playable.prototype.proceed, playable, args));
			};
		})(playableClass.prototype.play);
	}
}

function initializePlayableInterface(playableInterface) {

	// create an initializer that doesn't have to use "new"
	playableInterface.creator = new Proxy(playableInterface, {
		apply: function(target, thisArg, argumentsList) {
			return new target(...argumentsList)
		}
	})

}

exports.playableClasses = {
	_Playable,
	_Choice,
	_Range,
	_Turn,
	_Sequence,
	_Consecutive,
	_Loop,
	_SLoop,
	_Halt,
	_SHalt,
	_Lambda,
	_RPChoice,
	_PopulationDynamics,
	_Simultaneous
};
exports.playableInterfaces = {
	Choice,
	Range,
	Turn,
	Sequence,
	Consecutive,
	Loop,
	StochasticLoop,
	HaltIf,
	StochasticHalt,
	Lambda,
	RandomPlayerChoice,
	PopulationDynamics,
	Simultaneous
};


for (var playableClass in exports.playableClasses) {
	if (playableClass != "_Playable") {
		initializePlayableClass(exports.playableClasses[playableClass]);
	}
}

for (var playableInterface in exports.playableInterfaces) {
	if (playableInterface != "Playable") {
		initializePlayableInterface(exports.playableInterfaces[playableInterface])
		exports.playableInterfaces[playableInterface] = exports.playableInterfaces[playableInterface].creator
	}
}
