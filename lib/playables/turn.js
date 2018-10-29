"use strict";

var log = require("../logger");
log("debug", "Loading Class: Turn");

//External dependency
var { SynchronousPromise } = require("synchronous-promise");

//Helper functions
var { isObject, once } = require("../helper-functions")("general");
var { chainerGenerator, outcomeTreeGetValue, outcomeTreeSetValue } = require("../helper-functions")(
	"playable");
var { recurse } = require("../helper-functions")("turn");
var { idHandler } = require("../helper-functions")("state");

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode
var { gameHistory } = require("../history");
var { Information, PerfectInformation } = require("../information");

//Parent classes
var { Branch, _Playable, Playable } = require("./playable");
var { Evaluator } = require("./range")


// Turn has the most complex branching of any Playable, because its sub-playables can be
// either Choice or Range. If they are all Choices, it uses branching like Choice does.
// There is an outcomeTree, an object of objects, where the path through them, (eg. left->right->down)
// defines the responses of the players in each respective Choice. Like ChoiceBranch, this uses the
// TurnBranch class to generate chaining objects and set payoffs.
//
// However, if any of the sub-playables are Range, then Turn uses a branching system more
// like that of Range, ie analogous to RangeOutcome, we'll use TurnOutcome. This creates
// branches and payoffs in the form of a Map, where the keys in the Map are Evaluators,
// and the values are for branching an array of next playables, and for payoffs a value for the
// payout. The Evaluator will be a function which takes a "result" argument, which is an array of the
// responses from each player, and should return true if the outcome branch/payoff is supposed to be
// triggered for this result.
//
// Turn also allows for both implicit and explicit payoffs. The latter names players by id, ie.
// p1 gets 2, while the former refers to players who are used by the sub-playables (Choice or Range)
// that are assigned to the Turn. Implicit payoffs allow for a more dynamic game (ie using RandomPlayerChoice,
// the player can change) while explicit payoffs allow players who aren't involved in the decision to still
// receive a payout or penalty.
//
// Soooo... good luck.


// Branch subclass
var TurnBranch = (function() {
	// Private data
	var _turns = new WeakMap();

	class TurnBranch extends Branch {
		constructor(path, _turn) {
			super(path, _turn.interface)
			_turns.set(this, _turn)
		}

		payoff(payoffs) {
			// Payoffs need to be array
			if (!Array.isArray(payoffs)) throw new Error("Argument must be payoffs array.")

			var _turn = _turns.get(this);
			var numPlayers = _turn.decisions.length
			var path = this.path

			//Allow the first few array elements to be implicit payoffs. Check that they are actually there and are numbers or null
			var implicit = payoffs.slice(0, numPlayers);
			if (implicit.length == numPlayers && implicit.every(function(payoff) {
					return (!isNaN(payoff) || payoff == null);
				})) {
				outcomeTreeSetValue(_turn.payoffsImplicit, path, implicit);
			} else throw new Error("Turn implicit payoffs must be correct size and each must be a number or null.")


			//Any remaining should be assigned as explicit payoffs, if they're objects.
			payoffs.slice(numPlayers).forEach(function(explicit) {
				if (isObject(explicit))
					outcomeTreeSetValue(_turn.payoffsExplicit, path, explicit);
			});

			return super.payoff();
		}

	}
	return TurnBranch;
})()




// Branch subclass
var TurnOutcome = (function() {
	// Private data
	var _turns = new WeakMap();

	class TurnOutcome extends Branch {
		constructor(evaluator, _turn) {
			super(evaluator, _turn)
			_turns.set(this, _turn)

			_turn.next.set(evaluator, []) // add blank nextmap once the branch is defined
		}

		payoff(payoffs) {
			// Payoffs need to be array
			if (!Array.isArray(payoffs)) throw new Error("Argument must be payoffs array.")

			var _turn = _turns.get(this);
			var numPlayers = _turn.decisions.length
			var path = this.path

			//Allow the first few array elements to be implicit payoffs. Check that they are actually there and are numbers or null
			var implicit = payoffs.slice(0, numPlayers);
			if (implicit.length == numPlayers && implicit.every(function(payoff) {
					return (!isNaN(payoff) || payoff == null);
				})) {
				_turn.payoffsImplicit.set(path, implicit)
			} else throw new Error("Turn implicit payoffs must be correct size and each must be a number or null.")


			//Any remaining should be assigned as explicit payoffs, if they're objects.
			payoffs.slice(numPlayers).forEach(function(explicit) {
				if (isObject(explicit)) {

					// Don't use the original object because then user could still have a reference
					// to it. Instead, copy over keys/values that are numbers (this will work for Variables)
					var obj = {}
					for (var key in explicit) {
						if (!isNaN(explicit[key])) obj[key] = explicit[key]
					}
					_turn.payoffsExplicit.set(path, obj)

				}

			});

			return super.payoff();
		}
	}

	return TurnOutcome;
})()



class _Turn extends _Playable {
	constructor(id, decisions, parameters = {}) {
		super(id, parameters)

		var turn = this;

		turn.decisions = decisions;

		// the decisionMap is an array of arrays, each corresponding to the options in a choice.
		turn.decisionMap = turn.decisions.map(function(item) {
			return item.options ? item.options : item.bounds;
		});

		// If any of the sub-playables are Range, or if set to forceOutcomeMode,
		//then we'll use Maps/Outcomes instead of objects/Branches
		if (parameters.forceOutcomeMode || turn.decisions.some(function(decision) {
				return decision.constructor.name == "_Range"
			})) {
			turn.branchMode = "outcome"
			turn.payoffsImplicit = new Map();
			turn.payoffsExplicit = new Map();
			turn.next = new Map([
				["all", []]
			]) // all is for any-outcome cases
		}
		// If no Range's, just use objects for simplicity
		else {
			turn.branchMode = "tree"
			turn.payoffsImplicit = {};
			turn.payoffsExplicit = {};
			turn.next = {};

			// Now let's fill those in with blank values.

			log("silly", "Adding implicit payoffs map to turn.");
			recurse(turn.decisionMap, turn.payoffsImplicit, null, function() {
				return Array(turn.decisionMap.length).fill(0);
			})

			log("silly", "Adding explicit payoffs map to turn.");
			recurse(turn.decisionMap, turn.payoffsExplicit, null, function() {
				return {}
			});

			log("silly", "Adding blank next map to turn.");
			recurse(turn.decisionMap, turn.next, null, function() {
				return [];
			});
		}
		//TODO: error handling here

	}

	addNext(nextPlayable, path = "all") {
		// The normal Playable addNext already suports tree mode.
		if (this.branchMode == "tree") return super.addNext(nextPlayable, path)
		// in outcome mode:
		else {
			if (path == "all") this.next.get("all").push(nextPlayable)
			else if (this.next.has(path)) this.next.get(path).push(nextPlayable)
			else throw new Error("Invalid path: ".concat(path))
		}
	}


	// Adding more complicated summary entry
	summaryThis(summary) {
		// Fetch summaries for each choice.
		summary.array("decisions", this.decisions, function(decision, summary) {
			return decision.summarize(summary, true) // short-circuit summary
		});

		// Include payoffs
		if (this.branchMode == "tree")
			summary("payoffs", JSON.parse(
				JSON.stringify({
					implicit: this.payoffsImplicit,
					explicit: this.payoffsExplicit
				})
			))
		// TODO: make payoff summary work for outcome mode.

		return summary;
	};


	summaryNext(summary) {
		var turn = this;
		var count = 0;

		// If using only Choices
		if (this.branchMode == "tree") {
			summary.treeArray("next", this.decisionMap, this.next, function(playable, path, summary) {
				count++;
				return playable.summarize(summary)
			})
		}

		// If using some Ranges
		else if (this.branchMode == "outcome") {
			summary.mapArray("next", this.next, function(playable, summary) {
				count++;
				return playable.summarize(summary)
			})
		}

		// if there's no result, delete the tag to avoid clutter
		if (count == 0) summary.delete("next")

		return summary
	};


	play({
		usePayoffs = true,
		history = gameHistory,
		information = PerfectInformation,
		releasePlayers = true
	} = {}) {
		var turn = this;
		var choiceHistory = history.child();
		var choiceInformation = information.child();

		if (turn.compartmentalize) {
			choiceInformation = new Information(turn.compartmentalize.history || choiceHistory,
				turn.compartmentalize.population || information.population);
		}

		history.log.add({
			turn: turn.id,
			decisions: turn.decisions.map(function(decision) {
				return decision.id;
			})
		});

		var compileInformation = function(ri) {
			//If there's no turn entry, create one.
			if (!choiceInformation.additional[0].turn) {
				var turnInfo = {
					turn: {
						id: turn.id,
						decisions: [],
						exclude(player) {
							return this.decisions.filter(function(decision) {
								return decision.player == player;
							});
						}
					}
				};
				// Stick turn info in before decision infos
				choiceInformation.additional.unshift(turnInfo);
			}
			// move decision infos into turn info.
			choiceInformation.additional[0].turn.decisions.push(
				choiceInformation.additional.pop()
			);

			// Copy additional information from information to choiceInformation
			information.additional.forEach(
				choiceInformation.addAdditional.bind(choiceInformation)
			);
		};

		return Promise.all(
				turn.decisions.map(function(choice) {
					return choice.play({
						shortCircuit: true,
						history: choiceHistory,
						information: choiceInformation,
						_compileInformation: compileInformation,
						releasePlayers: false
					});
				})
			)
			.then(function(result) {
				//Re-format output from array of Choice results to single Turn result
				//And release players
				var resultPath = result.map(function(choice, index) {
					if (releasePlayers) turn.decisions[index].releasePlayer();
					return choice.result;
				});

				//Pass along results and record history
				var resultObject = {
					result: resultPath,
					playable: turn,
					historyEntry: {
						turn: turn.id,
						results: choiceHistory.orphan(),
						payouts: {}
					}
				};

				return Promise.resolve(resultObject);
			})
			.then(function(result) {
				//Implement payoffs
				if (usePayoffs) {
					var implicitPayoffs = outcomeTreeGetValue(
						turn.payoffsImplicit,
						result.result
					);
					var explicitPayoffs = outcomeTreeGetValue(
						turn.payoffsExplicit,
						result.result
					);

					// For the log
					var payouts = {};

					implicitPayoffs.forEach(function(payoff, index) {
						// Do nothing if payoff is zero.
						if (payoff == 0) return;

						// fetch player and increment score
						var player = turn.decisions[index].player;
						player.score += payoff;

						//And include it in the log entry
						payouts[player.id] = Number(payoff);
					});

					for (var player in explicitPayoffs) {
						registry.players[player].score += explicitPayoffs[player];

						//And include it in the log entry
						payouts[player] = Number(explicitPayoffs[player]);
					}

					//Log for the scores log
					var scoreEntry = {
						turn: turn.id,
						result: result.result,
						payouts: payouts
					};
					history.addScores(scoreEntry);


					// Log for the game history
					result.historyEntry.payouts = payouts;
				}

				return Promise.resolve(result); //TODO: add information mechanisms
			});
	}

	//Overwrite default history handler, because we don't want a second entry in the tree
	handleHistory({ history = gameHistory } = {}, result) {
		history.addNoLog(result.historyEntry);
		return Promise.resolve(result);
	};

	// Find the next thing to do.
	findNext({ result } = {}) {
		var next;

		// In branch mode, get the next items from the next tree.
		if (this.branchMode == "tree") {
			next = outcomeTreeGetValue(this.next, result.result);
		}

		// in outcome mode, iterate over the Map.
		else {
			// return the "any outcome" cases
			next = this.next.get("all").slice()

			// For each evaluator, run it with the result, and if true, add those playables to the list
			for (var [evaluator, playables] of this.next) {
				if (evaluator !== "all" && evaluator(result.result) === true) next.push(...playables)
			}
		}

		return next;
	};


	generateBranches() {
		var _turn = this;
		// In outcome (Range) mode, don't even bother.
		if (_turn.branchMode == "outcome") return false;

		// Keep an easy track of the branches, which will help for setAllPayoffs
		_turn.branches = []
		var turn = _turn.interface;

		recurse(_turn.decisionMap, turn, null, function(path) {
			let branch = new TurnBranch(path, _turn)
			_turn.branches.push(branch)
			return branch
		})

		return true
	}



}
_Turn.registryName = "turns";
_Turn.counterName = "turn";




_Turn.prototype.setAllPayoffs = function(payoffArray) {
	var turn = this;

	//Recurse through the options in input, to come up with a path to every combination of options in the array of arrays.
	function recurse(input, numPlayers, payoffs, path = [], coordinates = []) {

		//Since we slice the array each time, if there are no more entries left then we're done with this branch.
		if (input.length == 0) return SynchronousPromise.resolve(path);

		//Among all values from the array
		return input[0].map(function(item, index) {
			var splitPath = path.slice(0).concat(item);
			var splitCoordinates = coordinates.slice(0).concat(index);
			var splitPayoffs = payoffs[index];

			//If we're at the last position in the array of options, then we have a complete path.
			if (input.length == 1) {
				/* you might need these later
				console.log("path ", splitPath);
				console.log("coordinates ", splitCoordinates)
				console.log("payoff ",splitPayoffs)
				*/

				splitPayoffs = JSON.parse(JSON.stringify(splitPayoffs));

				//Allow the first few array elements to be implicit payoffs. Check that they are actually there and are numbers
				var implicit = splitPayoffs.slice(0, numPlayers);
				if (
					implicit.length == numPlayers &&
					implicit.every(function(payoff) {
						return !isNaN(payoff);
					})
				) {
					outcomeTreeSetValue(turn.payoffsImplicit, splitPath, implicit);
				}

				//Any remaining should be assigned as explicit payoffs, if they're objects.
				splitPayoffs.slice(numPlayers).forEach(function(explicit) {
					if (isObject(explicit))
						outcomeTreeSetValue(turn.payoffsExplicit, splitPath, explicit);
				});
			}

			//If there are more items to iterate over, include them in the output then recurse.
			return recurse(
				input.slice(1),
				numPlayers,
				splitPayoffs,
				splitPath,
				splitCoordinates
			);
		})

	}

	return recurse(turn.decisionMap, turn.decisions.length, payoffArray).catch(
		function(reason) {
			log("error", reason);
		}
	);
};




// Begin rewrite
class Turn extends Playable {
	constructor(decisions, parameters = {}) {
		var id = idHandler(parameters.id, "turn");

		decisions = decisions.map(function(choice) {
			return registry.decisions[choice.id()];
		});


		//Create backend choice object
		var _turn = new _Turn(id, decisions, parameters);

		super(_turn)

		_turn.generateBranches();

	}

	// For using outcome mode
	outcome(func, parameters) {
		var evaluator = new Evaluator(func, parameters)
		return new TurnOutcome(evaluator, registry.turns[this.id()])
	}

	//Function to set all payoffs at once
	setAllPayoffs(payoffs) {
		//TODO: Include error handling if array given isn't expected dimensions.
		return registry.turns[this.id()].setAllPayoffs(payoffs);
	};

	//Way for user to interact with payoffs
	payoffs() {
		var _turn = registry.turns[this.id()]
		return JSON.parse(
			JSON.stringify({
				implicit: _turn.payoffsImplicit,
				explicit: _turn.payoffsExplicit
			})
		);
	};

	// Returns the payoffs in nested array form, to make cloning easier, ie. t2.setAllPayoffs(t1.payoffsMatrix())
	payoffsMatrix() {

		var _turn = registry.turns[this.id()]

		// recursion to construct payoff matrix
		var mapper = function(obj, path = []) {
			//If it's an array, then we've reached the payoffs
			if (Array.isArray(obj)) {
				var payoff = obj.slice(0)
				// Add explicit payoffs too
				var explicit = outcomeTreeGetValue(_turn.payoffsExplicit, path);

				// Only add an entry if the explicit payoffs object is not empty
				return Object.keys(explicit).length > 0 ? payoff.concat([outcomeTreeGetValue(_turn.payoffsExplicit,
					path)]) : payoff
			}

			// Otherwise, dig in deeper
			else return Object.keys(obj).map(function(key) { return mapper(obj[key], path.slice(0).concat([key])) })
		}
		return mapper(_turn.payoffsImplicit)
	}
}



module.exports = { TurnBranch, TurnOutcome, _Turn, Turn };
