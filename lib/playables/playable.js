"use strict";

var log = require("../logger");
log("debug", "Loading Class: Playable");

var { SynchronousPromise } = require("synchronous-promise");
var present = require("present");
var CallableInstance = require('callable-instance');

// Data structure for summaries
var { Summary } = require("../summary")


//Game state controllers
var { registry, idCounters } = require("../state");
var Promise = registry.Promise; // For sync mode
var { gameHistory, History } = require("../history");

//Helper functions
var { isFunction } = require("../helper-functions")("general");
var { outcomeTreeAddAll, outcomeTreeGetValue } = require("../helper-functions")("playable");
var { reinitializePlayers } = require("../helper-functions")("player");

//To return to user
var { Population, PlayerList } = require("../population");


// branch class, for the user to interact with when tree-branching, to replace promises
// Extend this branch and add a payoff function for each case (Turn, Choice, etc)
// path is an ordered array of branches; playable is a user interface
var Branch = class Branch extends CallableInstance {
	constructor(path, playable) {
		super("payoff");
		this.path = path;
		this.playable = playable;
		return
	}

	payoff(payoff) {
		return this;
	}
};

class _Playable {
	constructor(id, parameters = {}) {
		this.id = id;
		this.next = []; // Default next-map is an array, but certain playables might use something else
		registry.playables[id] = this;
		if (this.constructor.registryName != "playables") registry[this.constructor.registryName][id] = this;
		idCounters.playable++;

		parameters.compartmentalize ? this.compartmentalize = parameters.compartmentalize : null;
		parameters.history ? (this.history = parameters.history) : null;
		parameters.information ? (this.information = parameters.information) : null;
		parameters.initializePlayers ? (this.initializePlayers = parameters.initializePlayers) : null;
	}

	//Called before .play() to start timing.
	_startTimer() {
		this._timer = present();
		return Promise.resolve();
	};


	//Add reference to next playable branch, to chain playables together.
	addNext(nextPlayable, path = "all") {
		if (path == "all") outcomeTreeAddAll(this.next, nextPlayable);
		else {
			outcomeTreeGetValue(this.next, path).push(nextPlayable);
		}
	};


	//Called before prePlay, initialize players if true.
	checkInit({ initializePlayers = this.initializePlayers } = {}, result) {
		// if we get something
		if (initializePlayers) {
			// if it's just true, then reinitialize everybody
			if (initializePlayers === true) return reinitializePlayers("all", result)

			// if it's a playerList, use that
			else if (initializePlayers instanceof PlayerList) return reinitializePlayers(initializePlayers)

			// if we get a function, then run the function and check that it's returning a playerList
			else if (isFunction(initializePlayers)) {
				var list = initializePlayers()
				if (list instanceof PlayerList) return reinitializePlayers(list, result);
			}

			// otherwise, convert it to a playerList and let PlayerList deal with it.
			else return reinitializePlayers(new PlayerList(initializePlayers), result);
		}

		// if we didn't get anything or got false, we're done here.
		else return Promise.resolve(result);
	};


	//Called before .play() but after _startTimer, overwriteable
	prePlay({} = {}, result) {
		return Promise.resolve(result);
	};

	// The main attraction. Each class should overwrite this.(And it will get wrapped anyway. This mostly exists for testing purposes)
	play({} = {}, result) {
		return Promise.resolve(result)
	}

	//Called after .play(), overwritable.
	postPlay({} = {}, result) {
		return Promise.resolve(result);
	};

	//Called after .postPlay() to stop timer and log.
	_stopTimer({} = {}, result) {
		if (result.historyEntry)
			result.historyEntry.duration = present() - this._timer;
		delete this._timer;

		return Promise.resolve(result);
	};

	//Called after timer stops, to write log. Overwiteable if playable has specific logging behavior.
	handleHistory({ history = gameHistory } = {},
		result
	) {
		return Promise.resolve(result).then(function(result) {
			if (result.historyEntry) history.add(result.historyEntry);
			return Promise.resolve(result);
		});
	};

	//Determine whether to play next, and if so, do.
	proceed({ shortCircuit } = {}, result) {
		var playable = this;

		return Promise.resolve(result).then(function(result) {
			//Replace reported playable with latest running playable (this is necessary for short-circuit logic)
			result.playable = playable;

			//Short-circuit logic allows higher-order playable to figure out what to do next.
			if (shortCircuit) return Promise.resolve(result);

			return playable.playNext(result);
		});
	};

	//Play next.
	playNext(result, parameters = {}) {
		var playable = this;

		return Promise.resolve(result).then(function(result) {
			//Find out where to go next
			var next = playable.findNext({ result });

			//If there's somewhere to go, then go.
			if (next[0] instanceof _Playable)
				return Promise.all(
					next.map(function(playable) {
						return playable.play(parameters);
					})
				);

			//Otherwise, we're done here
			return Promise.resolve(result);
		});
	};

	// Return the next playable in the sequence. Overwriteable for playables with more complicated branching.
	findNext() {
		return this.next;
	};


	// Summarize the game structure. Calls summaryThis and summaryNext, which are overwritable.
	summarize(
		summary = new Summary(),
		shortCircuit = false,
		maxEntries = 10
	) {
		// Start summary for this playable
		summary(this.constructor.counterName, this.id);

		// Track how many times we've been here before, to avoid circular recursion
		summary.entries[this.id] ? ++summary.entries[this.id] : (summary.entries[this.id] = 1);
		if (summary.entries[this.id] > maxEntries) shortCircuit = true;

		// Add summary
		this.summaryThis(summary);

		// Proceed to next steps
		if (!shortCircuit || shortCircuit !== this)
			this.summaryNext(summary);

		return summary;
	};

	// Adds the summary information on this playable. Overwrite this in order to add specific information.
	summaryThis(summary = {}) {
		return summary;
	};

	// Adds summary information down the next-path. Overwite this for playables with more complex branching.
	summaryNext(summary = new Summary()) {
		// If there's a next-entry
		if (this.next.length > 0) {
			// Loop over each next-item, and summarize it.
			summary.array("next", this.next, function(playable, summary) {
				return playable.summarize(summary)
			})
		}

		return summary;
	};

}
_Playable.registryName = "playables";
_Playable.counterName = "playable";

/*
//_playable class, superclass for objects which can execute game steps (choice, turn, game)
function _Playable(id, parameters = {}) {
	this.id = id;
	this.next = [];
	registry.playables[id] = this;
	idCounters.playable++;

	parameters.compartmentalize ? this.compartmentalize = parameters.compartmentalize : null;
	parameters.history ? (this.history = parameters.history) : null;
	parameters.information ? (this.information = parameters.information) : null;
	parameters.initializePlayers ? (this.initializePlayers = parameters.initializePlayers) : null;
}

_Playable.registryName = "playables";
_Playable.counterName = "playable";

//Add reference to next playable branch, to chain playables together.
_Playable.prototype.addNext = function(nextPlayable) {
	outcomeTreeAddAll(this.next, nextPlayable);
};

//Called before .play() to start timing.
_Playable.prototype._startTimer = function() {
	this._timer = present();
	return Promise.resolve();
};

//Called before prePlay, initialize players if true.
_Playable.prototype.checkInit = function({ initializePlayers = this.initializePlayers } = {}, result) {
	// if we get something
	if (initializePlayers) {
		// if it's just true, then reinitialize everybody
		if (initializePlayers === true) return reinitializePlayers("all", result)

		// if it's a playerList, use that
		else if (initializePlayers instanceof PlayerList) return reinitializePlayers(initializePlayers)

		// if we get a function, then run the function and check that it's returning a playerList
		else if (isFunction(initializePlayers)) {
			var list = initializePlayers()
			if (list instanceof PlayerList) return reinitializePlayers(list, result);
		}

		// otherwise, convert it to a playerList and let PlayerList deal with it.
		else return reinitializePlayers(new PlayerList(initializePlayers), result);
	}

	// if we didn't get anything or got false, we're done here.
	else return Promise.resolve(result);
};


//Called before .play() but after _startTimer
_Playable.prototype.prePlay = function({} = {}, result) {
	return Promise.resolve(result);
};

//Called after .play(), overwritable.
_Playable.prototype.postPlay = function({} = {}, result) {
	return Promise.resolve(result);
};

//Called after .postPlay() to stop timer and log.
_Playable.prototype._stopTimer = function({} = {}, result) {
	if (result.historyEntry)
		result.historyEntry.duration = present() - this._timer;
	delete this._timer;

	return Promise.resolve(result);
};

//Called after timer stops, to write log. Overwiteable if playable has specific logging behavior.
_Playable.prototype.handleHistory = function({ history = gameHistory } = {},
	result
) {
	return Promise.resolve(result).then(function(result) {
		if (result.historyEntry) history.add(result.historyEntry);
		return Promise.resolve(result);
	});
};

//Determine whether to play next, and if so, do.
_Playable.prototype.proceed = function({ shortCircuit } = {}, result) {
	var playable = this;

	return Promise.resolve(result).then(function(result) {
		//Replace reported playable with latest running playable (this is necessary for short-circuit logic)
		result.playable = playable;

		//Short-circuit logic allows higher-order playable to figure out what to do next.
		if (shortCircuit) return Promise.resolve(result);

		return playable.playNext(result);
	});
};

//Play next.
_Playable.prototype.playNext = function(result, parameters = {}) {
	var playable = this;

	return Promise.resolve(result).then(function(result) {
		//Find out where to go next
		var next = playable.findNext({ result });

		//If there's somewhere to go, then go.
		if (next[0] instanceof _Playable)
			return Promise.all(
				next.map(function(playable) {
					return playable.play(parameters);
				})
			);

		//Otherwise, we're done here
		return Promise.resolve(result);
	});
};

// Return the next playable in the sequence. Overwriteable for playables with more complicated branching.
_Playable.prototype.findNext = function() {
	return this.next;
};

_Playable.prototype._summarize = function() {};

// Summarize the game structure. Calls summaryThis and summaryNext, which are overwritable.
_Playable.prototype.summarize = function(
	summary = {},
	entries = {},
	shortCircuit = false,
	maxEntries = 10
) {
	// Start summary for this playable
	summary[this.constructor.counterName] = this.id;

	// Track how many times we've been here before, to avoid circular recursion
	entries[this.id] ? ++entries[this.id] : (entries[this.id] = 1);
	if (entries[this.id] > maxEntries) shortCircuit = true;

	// Add summary
	this.summaryThis(summary, entries);

	// Proceed to next steps
	if (!shortCircuit || shortCircuit !== this)
		this.summaryNext(summary, entries);

	return summary;
};

// Adds the summary information on this playable. Overwrite this in order to add specific information.
_Playable.prototype.summaryThis = function(summary = {}, entries = {}) {
	return summary;
};

// Adds summary information down the next-path. Overwite this for playables with more complex branching.
_Playable.prototype.summaryNext = function(summary = {}, entries = {}) {
	// If there's a next-entry
	if (this.next.length > 0) {
		// Loop over each next-item, and summarize it.
		summary.next = this.next.map(function(playable) {
			return playable.summarize({}, entries);
		});

		// If there's only one item, no need for an array.
		if (summary.next.length == 1) summary.next = summary.next[0];
	}
};
*/

// New in-progress implementation here.

let Playable = (function() {
	//  private data. Hide the internal _playable from the user access.
	let _playables = new WeakMap();

	class Playable extends CallableInstance {
		//override this on each class. return a new instance of the class, to avoid the 'new' keyword
		static creator(...args) {
			return new Playable(...args)
		}

		constructor(_playable) {
			super("chain")
			_playables.set(this, _playable); // this is private
			_playable.interface = this
		}
		chain(source) {
			var previousPlayable, path

			// Act according to source type
			if (source instanceof Playable) {
				previousPlayable = registry.playables[source.id()]

			} else if (source instanceof Branch) {
				previousPlayable = registry.playables[source.playable.id()]

			} else throw new Error("Can only chain playables.")

			path = source.path
			var _playable = _playables.get(this)

			log("debug", "Adding next playable to " + previousPlayable.id + ", node " + _playable.id);

			previousPlayable.addNext(_playable, path);

			return this;
		}

		id() {
			return _playables.get(this).id
		}

		play({
			initializePlayers = false,
			usePayoffs = true,
			shortCircuit = false,
			writeHistory = true,
			clearHistory = true,
			releasePlayers = true
		} = {}) {

			var _playable = _playables.get(this)

			if (clearHistory) gameHistory.clearHistory();

			var history = writeHistory ?
				_playable.history || gameHistory :
				new History();

			return Promise.resolve()
				.then(function(result) {
					return _playable.play({ initializePlayers, usePayoffs, shortCircuit, history, releasePlayers });
				})
				.catch(function(reason) {
					console.log(reason);

					//If the game was stopped by a Halt playable or everybody's dead, we'll end up here, and things are fine. Just log it.
					if (reason.result == "Halt") {
						gameHistory.add(reason.historyEntry);
						return Promise.resolve(reason.result);
					} else if (reason.result == "Population Collapse")
						return Promise.resolve(reason.result);
					else {
						history.log.add({ error: reason });
						return Promise.reject(reason);
					}
				})
				.then(function(result) {
					//Replace result, so that user can't get access to _playables

					return Promise.resolve({
						Population: Population(),
						gameHistory
					});
				});
		}

		summarize() {
			return _playables.get(this).summarize().print()
		}
	}
	Playable.prototype.path = "all";

	return Playable;
})();




// original version here


/*
//Convoluted code here to produce the object that user interacts with (ie c1 in 'c1 = Choice()')
//This mimics creating a class that inherits from Function. First define the "prototype", which includes
//a "constructor", a "call" method that will get called, and any other properties and methods.
//Then 'classFactory' produces the class/constructing object (see below), which you can use to
//produce the actual objects.

var playablePrototype = Object.create(Function.prototype);

playablePrototype.constructor = function(_playable) {
	var playable = this;

	//Tag-back. Store the front-end object in the back-end object, for retrieval
	_playable.interface = playable;

	this.call = function(source) {
		var previousPlayable, path;

		//TODO: verify that source is the right type

		return SynchronousPromise.all([
			(function() {
				if (source instanceof Promise || source instanceof SynchronousPromise) {
					source.then(function(result) {
						previousPlayable = registry.playables[result.playable.id()];
						path = result.path;
						console.log(path);
						return SynchronousPromise.resolve();
					});
				}
				return SynchronousPromise.resolve();
			})(),
			(function() {
				if (!(source instanceof Promise || source instanceof SynchronousPromise)) {
					previousPlayable = registry.playables[source.id()];
					path = source.path;
				}

				return SynchronousPromise.resolve();
			})()
		]).then(function(result) {
			console.log(path);
			log(
				"debug",
				"Adding next playable to " +
				previousPlayable.id +
				", node " +
				_playable.id
			);

			if (path == "all") previousPlayable.addNext(_playable);
			else {
				outcomeTreeGetValue(previousPlayable.next, path).push(_playable);
			}

			log("silly", previousPlayable.next);
			//previousPlayable.next[selected].push(_choice);

			return SynchronousPromise.resolve({
				playable: playable,
				path: "all"
			});
		});
	};

	this.id = function() {
		return _playable.id;
	};

	this.play = function({
		initializePlayers = false,
		usePayoffs = true,
		shortCircuit = false,
		writeHistory = true,
		clearHistory = true,
		releasePlayers = true
	} = {}) {

		if (clearHistory) gameHistory.clearHistory();

		var history = writeHistory ?
			_playable.history || gameHistory :
			new History();

		return Promise.resolve()
			.then(function(result) {
				return _playable.play({ initializePlayers, usePayoffs, shortCircuit, history, releasePlayers });
			})
			.catch(function(reason) {
				console.log(reason);

				//If the game was stopped by a Halt playable or everybody's dead, we'll end up here, and things are fine. Just log it.
				if (reason.result == "Halt") {
					gameHistory.add(reason.historyEntry);
					return Promise.resolve(reason.result);
				} else if (reason.result == "Population Collapse")
					return Promise.resolve(reason.result);
				else {
					history.log.add({ error: reason });
					return Promise.reject(reason);
				}
			})
			.then(function(result) {
				//Replace result, so that user can't get access to _playables

				return Promise.resolve({
					Population: Population(),
					gameHistory
				});
			});
	};

	this.summarize = function() {
		return _playable.summarize({});
	};
};

playablePrototype.call = function() {
	//This will get overwritten when the "constructor" is called, but leaving it here so you can figure out how the hell this works.
};

playablePrototype.path = "all";

//Produces the function that will produce the end result. This part is reusable if you need to do this again.
var classFactory = function(proto) {
	return function() {
		var f = function() {
			return f.call.apply(f, arguments);
		};

		Object.defineProperty(f, "constructor", {
			configurable: true,
			writable: true
		});
		Object.defineProperty(f, "call", { writable: true });

		Object.keys(proto).forEach(function(key) {
			f[key] = proto[key];
		});

		f.constructor.apply(f, arguments);

		delete f.constructor; //Added this bit here, to prevent the user from trying to create new objects.

		return f;
	};
};

var Playable = classFactory(playablePrototype);
// called as: var instance = Playable(/* some internal object like _choice );
**/

module.exports = { Branch, _Playable, Playable };
