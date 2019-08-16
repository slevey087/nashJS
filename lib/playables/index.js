"use strict";

//Loads the playables that will be used by Nash. This is basically the controller list: if it's not in these lists,
// then it won't be available for us.
//
// This also does some processing to the playables to make them usable. It replaces the .play() function
// on each playable with a wrapper which calls the various steps in the play-cycle, (including the 
// original .play()) and deals with arguments and halting. It also replaces the user playable with a 
// "creator", which is just so you don't have to call "new" to make a playable, since I already had code that
// didn't do that when I re-factored into es6 classes.

var log = require("../logger");
log("debug", "Loading Playable Classes: ");


// history controller
var { gameHistory, History } = require("../history")

//Playables
var { _Playable } = require("./playable");
var { _Choice, Choice } = require("./choice");
var { _Range, Range } = require("./range");
var { _Turn, Turn } = require("./turn");
var { _Sequence, Sequence } = require("./sequence");
var { _Consecutive, Consecutive } = require("./consecutive");
var { _Loop, Loop } = require("./loop");
var { _SLoop, StochasticLoop } = require("./stochastic-loop");
var { _Halt, Halt } = require("./halt");
var { _HaltIf, HaltIf } = require("./halt-if");
var { _StochasticHalt, StochasticHalt } = require("./stochastic-halt");
var { _Lambda, Lambda } = require("./lambda");
var { _RandomPlayerChoice, RandomPlayerChoice } = require("./random-player-choice");
var { _PopulationDynamics, PopulationDynamics } = require("./population-dynamics");
var { _Simultaneous, Simultaneous } = require("./simultaneous");
var { _Stochastic, Stochastic } = require("./stochastic");

//Runs when loading Playable classes.
function initializePlayableClass(playableClass) {

	//Replace the .play() method with a wrapper which calls it and a few other functions
	if (playableClass.prototype.hasOwnProperty("play")) {
		playableClass.prototype.play = (function (play) {
			return function (...args) {
				if (!args[0]) args[0] = {}
				var playable = this;

				// Merge default values with freshly provided ones.
				args[0] = { ...playable.playParameters, ...args[0] }

				// Use default histories if none supplied. 
				if (args[0].writeHistory)
					args[0].history = args[0].history || playable.history || gameHistory

				// If not writing the history, use a blank placeholder.
				else args[0].history = new History()

				// how to halt the game without errors. TODO this seems to work, but could use more testing (is the return value appropriate?)
				if (args[0].history.stop) return { playable };

				return _Playable.prototype._startTimer.apply(playable, args)
					.then(playable.checkInit.bind(playable, ...args))
					.then(playable.prePlay.bind(playable, ...args))
					.then(play.bind(playable, ...args))
					.then(playable.postPlay.bind(playable, ...args))
					.then(_Playable.prototype._stopTimer.bind(playable, ...args))
					.then(playable.handleHistory.bind(playable, ...args))
					.then(_Playable.prototype.proceed.bind(playable, ...args));
			};
		})(playableClass.prototype.play);
	}
}

function initializePlayableInterface(playableInterface) {

	// create an initializer that doesn't have to use "new"
	playableInterface.creator = new Proxy(playableInterface, {
		apply: function (target, thisArg, argumentsList) {
			return new target(...argumentsList)
		}
	})

	playableInterface.creator.toString = () => playableInterface.description || "A NashJS Playable."
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
	_HaltIf,
	_StochasticHalt,
	_Lambda,
	_RandomPlayerChoice,
	_PopulationDynamics,
	_Simultaneous,
	_Stochastic
};
exports.playableInterfaces = {
	Choice,
	Range,
	Turn,
	Sequence,
	Consecutive,
	Loop,
	StochasticLoop,
	Halt,
	HaltIf,
	StochasticHalt,
	Lambda,
	RandomPlayerChoice,
	PopulationDynamics,
	Simultaneous,
	Stochastic
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
