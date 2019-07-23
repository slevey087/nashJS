"use strict";

var log = require("../logger");
log("debug", "Loading Class: Range");

// External base class
var CallableInstance = require("callable-instance")

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode
var { gameHistory } = require("../history");
var { PerfectInformation } = require("../information");

//Helper functions
var { idHandler } = require("../helper-functions")("state");
var { isFunction } = require("../helper-functions")("general");

//base Classes
var { Branch, _Playable, Playable } = require("./playable")

// Class to hold user-defined evaluator functions, mostly for speedy type comparisons
class Evaluator extends CallableInstance {
	constructor(func, parameters = {}) {
		super("test")
		this.func = func
		this.id = parameters.id || func.name || "evaluator"
		var evaluator = this;
		this.toString = function () { return evaluator.id }
	}
	test(value) {
		return this.func(value)
	}
}


// Branch subclass
var RangeOutcome = (function () {
	// Private data
	var _ranges = new WeakMap();

	class RangeOutcome extends Branch {
		constructor(evaluator, _range) {
			super(evaluator, _range.interface)
			_ranges.set(this, _range)

			_range.next.set(evaluator, []) // add blank nextmap once the branch is defined
		}

		// The __call__ function, this will set the payoff of the branch
		payoff(payoff) {
			var _range = _ranges.get(this)
			if (!isNaN(payoff)) _range.payoffs.set(this.path, payoff);
			return super.payoff()
		}
	}

	return RangeOutcome;
})()


class _Range extends _Playable {
	constructor(id, player, bounds, parameters = {}) {
		super(id, parameters)

		this.player = registry.players[player];
		this.bounds = bounds;
		this.defaultOption = parameters.defaultOption || bounds[0];
		this.playerMethod = parameters.playerMethod || "range"
		this.informationFilter = parameters.informationFilter || null;

		this.next = new Map([
			["all", []]
		]) // all is for any-outcome cases
		this.payoffs = new Map()
	}

	addNext(nextPlayable, path = "all") {
		if (path == "all") this.next.get("all").push(nextPlayable)
		else if (this.next.has(path)) this.next.get(path).push(nextPlayable)
		else throw new Error("Invalid path: ".concat(path))
	}

	findNext({ result } = {}) {
		// return the "any outcome" cases
		var next = this.next.get("all").slice()

		// For each evaluator, run it with the result, and if true, add those playables to the list
		for (var [evaluator, playables] of this.next) {
			if (evaluator !== "all" && evaluator(result.result) === true) next.push(...playables)
		}
		return next
	}

	play({
		usePayoffs,
		history,
		information: rawInformation,
		releasePlayer = true,
		informationFilter = this.informationFilter,
		_compileInformation = null
	} = {}) {
		var range = this;

		if (!range.player.alive)
			return Promise.reject({
				result: range.id + ": Player " + range.player.id + " is dead."
			});

		//While this range is happening, don't allow other choices to use this player.
		range.player.available = false;

		//Information mechanics. If we're dealing with PerfectInformation, this won't get delivered, so we'll include it in the call to .deliver(). If we're using an information supplied from some other playable, then they can do what they like with it.
		var rangeInfo = {
			range: {
				id: range.id,
				player: range.player.id,
				bounds: range.bounds
			}
		};
		rawInformation.addAdditional(rangeInfo);
		//Perform some data processing if other playables need it.
		if (_compileInformation) _compileInformation(rawInformation);

		return Promise.resolve()
			.then(function () {
				//Prep information
				var information = rawInformation.deliver(range.player, rangeInfo);
				if (informationFilter) information = informationFilter(information);

				return range.player.choose(range.bounds.slice(0), information, range.playerMethod);
			})
			.then(function (result) {
				var player = range.player;
				var id = range.id;

				//Add to player's individual history;
				player.history.push({
					range: id,
					bounds: range.bounds,
					result
				});

				result = result || range.defaultOption;

				// Enforce some rules on responses
				var bounds = range.bounds
				if (result < bounds[0]) result = bounds[0]
				if (result > bounds[1]) result = bounds[1]
				// If we have an increment (bounds[2]) round to the nearest increment
				if (range.bounds[2]) {
					result = Math.round(result / range.bounds[2]) * range.bounds[2]
				}

				var resultObject = {
					result,
					historyEntry: {
						range: id,
						player: player.id,
						result
					}
				};


				//This will probably only happen if it's a single-player game, otherwise we'll use playoffs defined in a Turn
				if (usePayoffs) {
					var payout = 0;
					for (var [evaluator, payoff] of range.payoffs.entries()) {
						if (evaluator == "all") payout += payoff
						else if (evaluator(result)) payout += payoff
					}

					player.score += payout;

					//track the payoff
					var scoreEntry = {
						range: id,
						payouts: {
							[player.id]: payout
						}
					};
					history.addScores(scoreEntry);

					resultObject.historyEntry.payouts = {
						[player.id]: payout
					};
				}

				log(
					"silly",
					"_Choice.play: removing from occupiedPlayers: ",
					range.player.id
				);
				if (releasePlayer) range.releasePlayer();

				return Promise.resolve(resultObject); //TODO: add information mechanisms
			});
	}

	//Release player from excluded players list, so that other objects can use it.
	releasePlayer() {
		this.player.available = true;
	};


	summaryThis(summary) {
		summary("player", this.player.id);
		summary("bounds", this.bounds.slice());

		return summary;
	};


	summaryNext(summary) {
		// construct the tree in the summary based on available bounds
		summary.mapArray("next", this.next, function (playable, summary) {
			return playable.summarize(summary)
		})

		// if there's no result, delete the tag to avoid clutter
		if (summary("next") === undefined) summary.delete("next")

		return summary;
	};

}
_Range.registryName = "decisions";
_Range.counterName = "range";


// User object for Range.
class Range extends Playable {
	constructor(player, bounds, parameters = {}) {
		var id = idHandler(parameters.id, "range");

		//If informationFilter was supplied, it must be a function
		if (parameters.informationFilter && !isFunction(parameters.informationFilter))
			throw new Error("informationFilter must be a function");

		//Create backend range object
		var _range = new _Range(id, player.id(), bounds, parameters);

		// Run Playable constructor
		super(_range)
	}

	// User can supply a function to evaluate what to do next
	outcome(func, parameters) {
		var evaluator = new Evaluator(func, parameters)
		return new RangeOutcome(evaluator, registry.decisions[this.id()])
	}

	// Function to see the results of a particular result
	payoff() {
		var range = this;
		return function (result) {
			var _range = registry.decisions[range.id()]

			var payout = 0;
			for (var [evaluator, payoff] of _range.payoffs.entries()) {
				if (evaluator == "all") payout += payoff
				else if (evaluator(result)) payout += payoff
			}
			return payout
		}
	}
}



module.exports = { Evaluator, RangeOutcome, _Range, Range }
