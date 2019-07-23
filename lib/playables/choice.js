"use strict";

var log = require("../logger");
log("debug", "Loading Class: Choice");

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode

var { gameHistory } = require("../history");
var { PerfectInformation } = require("../information");

//Helper functions
var { idHandler } = require("../helper-functions")("state");
var { isFunction } = require("../helper-functions")("general");

// Helper class
var OutcomeTree = require("../outcomeTree");

//Parent class
var { Branch, _Playable, Playable } = require("./playable");


// Branch subclass
var ChoiceBranch = (function () {
	// Private data
	var _choices = new WeakMap();

	class ChoiceBranch extends Branch {
		constructor(path, _choice) {
			super(path, _choice.interface)
			_choices.set(this, _choice)
		}

		// The __call__ function, this will set the payoff of the branch
		payoff(payoff) {
			var _choice = _choices.get(this)
			if (!isNaN(payoff)) _choice.payoffs[this.path[0]] = payoff;
			else throw new Error("Choice payoff must be a number.")
			return super.payoff()
		}
	}
	return ChoiceBranch;
})()



// Hidden class for Choice playable
class _Choice extends _Playable {
	constructor(id, player, options, parameters = {}) {
		super(id, parameters)

		this.player = registry.players[player];
		this.options = options;
		this.defaultOption = parameters.defaultOption || options[0]; //TODO: make defaultOption functional
		this.playerMethod = parameters.playerMethod || "choose"
		this.informationFilter = parameters.informationFilter || null;

		this.zeroPayoffs()

		this.next = new OutcomeTree(this.options, null, function () {
			return [];
		});
	}


	play({
		usePayoffs,
		history,
		information: rawInformation,
		releasePlayer = true,
		informationFilter = this.informationFilter,
		_compileInformation = null
	} = {}) {
		var choice = this;

		if (!choice.player.alive)
			return Promise.reject({
				result: choice.id + ": Player " + choice.player.id + " is dead."
			});

		//While this choice is happening, don't allow other choices to use this player.
		choice.player.available = false;

		//Information mechanics. If we're dealing with PerfectInformation, this won't get delivered, so we'll include it in the call to .deliver(). If we're using an information supplied from some other playable, then they can do what they like with it.
		var choiceInfo = {
			choice: {
				id: choice.id,
				player: choice.player.id,
				options: choice.options
			}
		};
		rawInformation.addAdditional(choiceInfo);
		//Perform some data processing if other playables need it.
		if (_compileInformation) _compileInformation(rawInformation);

		return Promise.resolve()
			.then(function () {
				//Prep information
				var information = rawInformation.deliver(choice.player, choiceInfo);
				if (informationFilter) information = informationFilter(information);

				return choice.player.choose(choice.options.slice(0), information, choice.playerMethod);
			})
			.then(function (result) {
				var player = choice.player;
				var id = choice.id;

				//Add to player's individual history;
				player.history.push({
					choice: id,
					options: choice.options,
					result
				});

				result = result || choice.defaultOption;

				var resultObject = {
					result,
					historyEntry: {
						choice: id,
						player: player.id,
						result
					}
				};

				//This will probably only happen if it's a single-player game, otherwise we'll use playoffs defined in a Turn
				if (usePayoffs) {
					var payout = choice.payoffs[result];

					player.score += payout;

					//track the payoff
					var scoreEntry = {
						choice: id,
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
					choice.player.id
				);
				if (releasePlayer) choice.releasePlayer();

				return Promise.resolve(resultObject);
			});
	};

	//Release player from excluded players list, so that other objects can use it.
	releasePlayer() {
		this.player.available = true;
	};

	findNext({ result } = {}) {
		return this.next.getValue(result.result);
	};

	generateBranches() {
		var _choice = this;
		var choice = _choice.interface

		_choice.options.forEach(function (option) {
			choice[option] = new ChoiceBranch([option], _choice)
		});
	};

	summaryThis(summary) {
		summary("player", this.player.id);
		summary("options", this.options.slice());
		// Include method, but only if it's not the default.
		if (this.playerMethod != "choose") summary("method", this.playerMethod)

		return summary;
	};

	//TODO: un-fuck this.
	summaryNext(summary) {
		// construct the tree in the summary based on available options
		var count = 0
		summary.treeArray("next", [this.options], this.next, function (playable, path, summary) {
			count++;
			return playable.summarize(summary)
		})

		// if there's no result, delete the tag to avoid clutter
		if (!count) summary.delete("next")

		return summary;
	};

	//Set all payoffs to zero.
	zeroPayoffs() {
		var choice = this;

		choice.payoffs = {};

		choice.options.forEach(function (option) {
			choice.payoffs[option] = 0;
		});
	};
}
_Choice.registryName = "decisions";
_Choice.counterName = "choice";


// Frontend class for Choice
class Choice extends Playable {
	constructor(player, options, parameters = {}) {
		var id = idHandler(parameters.id, "choice");

		//If informationFilter was supplied, it must be a function
		if (parameters.informationFilter && !isFunction(parameters.informationFilter))
			throw new Error("informationFilter must be a function");

		// TODO: validate other arguments, including choice-specific parameters.

		//Create backend choice object
		var _choice = new _Choice(id, player.id(), options, parameters);

		// Run Playable constructor
		super(_choice)

		_choice.generateBranches();
	}

	//User can set all payoffs at once using an array
	setAllPayoffs(payoffs) {
		if (!Array.isArray(payoffs)) throw new Error("Payoffs must be array")

		var id = this.id()
		var options = registry.decisions[id].options

		if (payoffs.length != options.length) throw new Error(
			"Payoffs must be same dimensions as choice options")

		payoffs.forEach(function (payoff, index) {
			registry.decisions[id].payoffs[options[index]] = payoff;
		})
	}

	// A way for the user to interact with the payoffs
	payoffs() {
		return JSON.parse(JSON.stringify(registry.decisions[this.id()].payoffs))
	}
}

module.exports = { ChoiceBranch, _Choice, Choice };
