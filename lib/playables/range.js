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
var { chainerGenerator } = require("../helper-functions")("playable");

//base Classes
var { Branch, _Playable, Playable } = require("./playable")

// Class to hold user-defined evaluator functions, mostly for speedy type comparisons
class Evaluator extends CallableInstance {
	constructor(func, parameters = {}) {
		super("test")
		this.func = func
		this.id = parameters.id || func.name || "evaluator";
	}
	test(value) {
		return this.func(value)
	}
}


// Branch subclass
var RangeOutcome = (function() {
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
	constructor(id, player, bounds, parameters) {
		super(id, parameters)

		this.player = registry.players[player];
		this.bounds = bounds;
		this.defaultOption = parameters.defaultOption || bounds[0];
		this.playerMethod = parameters.playerMethod || "range"
		this.informationFilter = parameters.informationFilter || null;
		this.usePayoffs = parameters.usePayoffs || false;

		this.next = new Map([
			["all", []]
		]) // all is for any-outcome cases
		this.payoffs = new Map()
	}

	addNext(nextPlayable, path) {
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

	summaryThis(summary) {
		summary.player = this.player.id;
		summary.bounds = this.bounds.slice();

		return summary;
	};

	summaryNext(summary) {
		// construct the tree in the summary based on available options
		summary.mapArray("next", this.next, function(playable, summary) {
			return playable.summarize(summary)
		})

		// if there's no result, delete the tag to avoid clutter
		if (summary("next") === undefined) summary.delete("next")

		return summary;
	};

}
_Range.registryName = "Ranges";
_Range.counterName = "range";



var Range = (function() {
	// Private data
	var _ranges = new WeakMap();

	class Range extends Playable {
		constructor(_range) {
			super()
		}
		// User can supply a function to evaluate what to do next
		outcome(func) {
			// TODO: figure out a way to test the func
			var evaluator = new Evaluator(func)
			return new RangeOutcome()
		}
	}
})()


module.exports = { Evaluator, RangeOutcome, _Range, Range }
