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
			var numPlayers = _turn.choices.length
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
			super(evaluator, _turn.interface)
			_turns.set(this, _turn)

			_turn.next.set(evaluator, []) // add blank nextmap once the branch is defined
		}

		payoff(payoffs) {
			var _turn = _turns.get(this);
			var numPlayers = _turn.choices.length


			//TODO: convert this to Map payoffs
			//Allow the first few array elements to be implicit payoffs. Check that they are actually there and are numbers or null
			var implicit = payoffs.slice(0, numPlayers);
			if (implicit.length == numPlayers && implicit.every(function(payoff) {
					return (!isNaN(payoff) || payoff == null);
				})) {
				outcomeTreeSetValue(_turn.payoffsImplicit, this.path, implicit);
			}

			//Any remaining should be assigned as explicit payoffs, if they're objects.
			payoffs.slice(numPlayers).forEach(function(explicit) {
				if (isObject(explicit))
					outcomeTreeSetValue(_turn.payoffsExplicit, this.path, explicit);
			});

			return super.payoff();
		}

	}

	return TurnOutcome;
})()



class _Turn extends _Playable {
	constructor(id, choices, parameters = {}) {
		super(id, parameters)

		var turn = this;

		turn.choices = choices.map(function(choice) {
			return registry.choices[choice.id()];
		});

		// the choiceMap is an array of arrays, each corresponding to the options in a choice.
		turn.choiceMap = turn.choices.map(function(item) {
			return item.options ? item.options : item.bounds;
		});

		// If any of the sub-playables are Range, then we'll use Maps/Outcomes instead of objects/Branches
		if (turn.choices.some(function(choice) {
				return choice.constructor.name == "_Range"
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
			turn.branchMode = "branch"
			turn.payoffsImplicit = {};
			turn.payoffsExplicit = {};
			turn.next = {};

			// Now let's fill those in with blank values.

			log("silly", "Adding implicit payoffs map to turn.");
			recurse(turn.choiceMap, turn.payoffsImplicit, null, function() {
				return Array(turn.choiceMap.length).fill(0);
			})

			log("silly", "Adding explicit payoffs map to turn.");
			recurse(turn.choiceMap, turn.payoffsExplicit, {});

			log("silly", "Adding blank next map to turn.");
			recurse(turn.choiceMap, turn.next, null, function() {
				return [];
			});
		}
		//TODO: error handling here

	}


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
			choices: turn.choices.map(function(choice) {
				return choice.id;
			})
		});

		var compileInformation = function(ri) {
			//If there's no turn entry, create one.
			if (!choiceInformation.additional[0].turn) {
				var turnInfo = {
					turn: {
						id: turn.id,
						choices: [],
						exclude(player) {
							return this.choices.filter(function(choice) {
								return choice.player == player;
							});
						}
					}
				};
				choiceInformation.additional.unshift(turnInfo);
			}
			choiceInformation.additional[0].turn.choices.push(
				choiceInformation.additional.pop()
			);

			information.additional.forEach( // TODO: what does this do???
				choiceInformation.addAdditional.bind(choiceInformation)
			);
		};

		return Promise.all(
				turn.choices.map(function(choice) {
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
					if (releasePlayers) turn.choices[index].releasePlayer();
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
						var player = turn.choices[index].player;
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
		if (this.branchMode == "branch") {
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



}
_Turn.registryName = "turns";
_Turn.counterName = "turn";




_Turn.prototype.generateChainingFunctions = function() {
	var _turn = this;
	var turn = _turn.interface;

	//Create payoff setter/branch router functions.
	//recurse adds a wrapper around this function which supplies the path.
	recurse(_turn.choiceMap, turn, function(path, payoffs) {
		//If user supplied payoffs in array form, then translate to object based on which players are involved in the choices
		if (Array.isArray(payoffs)) {
			if (payoffs.length !== _turn.choices.length) {
				//If array isn't right length, then this is unintelligible.
				log(
					"error",
					"Payoff array does not match Turn dimensions, cannot assign payoffs."
				);
				return Promise.reject(new Error("Payoff array is not correct length"));
			}

			var originalPayoffs = payoffs.slice();
			payoffs = {};

			outcomeTreeSetValue(_turn.payoffsImplicit, path, originalPayoffs);
		} else if (isObject(payoffs)) {
			payoffs = JSON.parse(JSON.stringify(payoffs));
			outcomeTreeSetValue(_turn.payoffsExplicit, path, payoffs);
		}

		return SynchronousPromise.resolve({
			playable: turn,
			path: path
		});
	});
};

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

	return recurse(turn.choiceMap, turn.choices.length, payoffArray).catch(
		function(reason) {
			log("error", reason);
		}
	);
};

// Adding more complicated summary entry
_Turn.prototype.summaryThis = function(summary, entries, shortCircuit = false) {
	// Fetch summaries for each choice.
	summary.choices = [];
	this.choices.forEach(function(choice, index) {
		summary.choices[index] = choice.summarize(
			summary.choices[index],
			entries,
			true
		);
	});

	// Include payoffs
	summary.payoffs = JSON.parse(
		JSON.stringify({
			implicit: this.payoffsImplicit,
			explicit: this.payoffsExplicit
		})
	);

	return summary;
};

//
_Turn.prototype.summaryNext = function(summary, entries) {
	var turn = this;

	// Create map
	summary.next = {};
	var count = 0;
	recurse(this.choiceMap, summary.next, null, function(path) {
		return outcomeTreeGetValue(turn.next, path).map(function(playable) {
			++count;
			return playable.summarize();
		});
	});

	// If there is no next, delete the key.
	if (count == 0) delete summary.next;
};

function Turn(choices, parameters = {}) {
	var id = idHandler(parameters.id, "turn");

	//Create backend choice object
	var _turn = new _Turn(id, choices, parameters);

	//Return this reference object to the user. Run the function to select a source
	var turn = Playable(_turn);

	_turn.generateChainingFunctions();

	//Function to set all payoffs at once
	turn.setAllPayoffs = function(payoffs) {
		//TODO: Include error handling if array given isn't expected dimensions.
		_turn.setAllPayoffs(payoffs);
	};

	//Way for user to interact with payoffs
	turn.payoffs = function() {
		return JSON.parse(
			JSON.stringify({
				implicit: _turn.payoffsImplicit,
				explicit: _turn.payoffsExplicit
			})
		);
	};

	// Returns the payoffs in nested array form, to make cloning easier, ie. t2.setAllPayoffs(t1.payoffsMatrix())
	turn.payoffsMatrix = function() {

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

	return turn;
}

module.exports = { TurnBranch, TurnOutcome, _Turn, Turn };
