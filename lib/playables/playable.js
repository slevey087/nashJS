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
var { reinitializePlayers } = require("../helper-functions")("player");

//To return to user
var { Population, PlayerList } = require("../population");

// For better object preview summaries.
var beautify = require("json-beautify")


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

	toString() {
		return "Branch"
	}

	payoff(payoff) {
		return this;
	}
};


// Base class for system-side _Playables
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
		if (path == "all") this.next.push(nextPlayable); // works whether this.next is array or OutcomeTree
		else {
			this.next.getValue(path).push(nextPlayable); // only works for OutcomeTree. Overwrite for other types.
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
	prePlay({ } = {}, result) {
		return Promise.resolve(result);
	};

	// The main attraction. Each class should overwrite this.(And it will get wrapped anyway. This mostly exists for testing purposes)
	play({ } = {}, result) {
		return Promise.resolve(result)
	}

	//Called after .play(), overwritable.
	postPlay({ } = {}, result) {
		return Promise.resolve(result);
	};

	//Called after .postPlay() to stop timer and log.
	_stopTimer({ } = {}, result) {
		if (result.historyEntry)
			result.historyEntry.duration = present() - this._timer;
		delete this._timer;

		return Promise.resolve(result);
	};

	//Called after timer stops, to write log. Overwiteable if playable has specific logging behavior.
	handleHistory({ history = gameHistory } = {},
		result
	) {
		return Promise.resolve(result).then(function (result) {
			if (result.historyEntry) history.add(result.historyEntry);
			return Promise.resolve(result);
		});
	};

	//Determine whether to play next, and if so, do.
	proceed({ shortCircuit } = {}, result) {
		var playable = this;

		return Promise.resolve(result).then(function (result) {
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

		return Promise.resolve(result).then(function (result) {
			//Find out where to go next
			var next = playable.findNext({ result });

			//If there's somewhere to go, then go.
			if (next[0] instanceof _Playable)
				return Promise.all(
					next.map(function (playable) {
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
		summary = this.summaryThis(summary);

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
			summary.array("next", this.next, function (playable, summary) {
				return playable.summarize(summary)
			})
		}

		return summary;
	};

}
_Playable.registryName = "playables";
_Playable.counterName = "playable";


// Base class for playable user-interfaces
let Playable = (function () {
	//  private data. Hide the internal _playable from the user access.
	let _playables = new WeakMap();

	class Playable extends CallableInstance {
		//override this on each class. return a new instance of the class, to avoid the 'new' keyword
		static creator(...args) {
			return new Playable(...args)
		}

		static toString() {
			return "Playable"
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
			clearHistory = registry.Settings["clear-history-on-play"],
			releasePlayers = true
		} = {}) {

			var _playable = _playables.get(this)

			if (clearHistory) gameHistory.clearHistory();

			var history = writeHistory ?
				_playable.history || gameHistory :
				new History();

			var returnValue = Promise.resolve()
				.then(function (result) {
					return _playable.play({ initializePlayers, usePayoffs, shortCircuit, history, releasePlayers });
				})
				.catch(function (reason) {
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
				.then(function (result) {
					//Replace result, so that user can't get access to _playables

					return Promise.resolve({
						Population: Population(),
						gameHistory
					});
				});

			// SynchronousPromise reveals too much data. Gotta just return the results.
			if (registry.Promise.mode == "sync") return returnValue._data
			return returnValue
		}

		summarize() {
			return _playables.get(this).summarize().print()
		}

		toString() {

			// this function will edit the summaries.
			var replacer = function replacer(key, value) {
				// if set, shorten summaries
				if (registry.Settings["condense-next-summary-preview"] && key == "next") return "..."
				return value
			}

			return beautify(this.summarize(), replacer, 2, 60)
		}
	}
	// default branching (probably not strictly necessary.)
	Playable.prototype.path = "all";

	return Playable;
})();



module.exports = { Branch, _Playable, Playable };
