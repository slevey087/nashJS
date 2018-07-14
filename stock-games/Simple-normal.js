"use strict";

//Game engine
var Engine = require("../lib/engine")

//Helper functions
var { isFunction } = Engine.Backend.HelperFunctions("general")
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Playables
var { Turn, Choice, RandomPlayerChoice } = Engine.Frontend.Playables;

//Play-time Logic
var { RandomVariable } = Engine.Frontend

var Normal = gameWrapper(function(players, choiceLists, payoffs = null, parameters = {}) {

		//propogate the information filter
		parameters.parameters ? parameters.parameters.informationFilter = parameters.informationFilter :
			parameters.parameters = { informationFilter: parameters.informationFilter }

		// construct the choices
		var choices = choiceLists.map(function(list, index) {
			return players == "random" ? RandomPlayerChoice(list, parameters.parameters) : Choice(players[index],
				list, parameters.parameters);
		});

		var game = Turn(choices, parameters);

		if (payoffs) game.setAllPayoffs(payoffs);

		return game;
	}, {
		queryLoader() {
			return [{
					name: "@N-choices",
					query: "$.results{player:result}",
					description: "Normal: Players and their choice."
				},
				{
					name: "@N-payouts",
					query: "$.payouts",
					description: "Normal: Payouts object, by player."
				},
				{
					name: "@N-players",
					query: "$.results.player",
					description: "Normal: Who played."
				}
			]
		},
		strategyLoader: function() {
			return [{
					strategy: function chooseFirst() {
						this.choose = function(choices, information) {
							return choices[0]
						}
					},
					name: "Choose First",
					description: "Always choose first available option."
				},

				{
					strategy: function chooseSecond() {
						this.choose = function(choices, information) {
							return choices[1]
						}
					},
					name: "Choose Second",
					description: "Always choose second available option."
				},

				{
					strategy: function randomize(choices = [0, 1]) {
						// Creating a map will make picking a random value easier
						choices = choices.map(function(item, index) {
							return [index, item]
						});
						var choiceMap = new Map(choices)

						this.choose = function(choices, information) {
							return choices[choiceMap.get(Math.floor(Math.random() * choiceMap.size))];
						}
					},
					name: "Randomize",
					description: "Choose randomly from available options."
				}
			];
		}
	} // 										TODO: validate all arguments
);


var TwoPlayerNormal = gameWrapper(function(players, choices, payoffs = null, parameters = {}) {

	// Information mechanics.. There are only two players, so we can have a 'me' and 'opponent' entry.
	// If user supplied an information filter, wrap that filter in ours.
	var { informationFilter } = parameters;
	if (!isFunction(informationFilter)) informationFilter = null;

	// Wrap the user's filter
	var wrappedFilter = function(information) {
		// Figure out who I am and who the opponent is
		var me = information.me.id
		var players = [information.turn.choices[0].choice.player, information.turn.choices[1].choice.player]
		var opponent = players.splice(players.indexOf(me), 1) && players[0];

		// add entry for opponent
		var opponentDetail = information.population.filter(function(player) {
			return (player.id == opponent)
		})[0];
		information.opponent = opponentDetail;

		// run the user's information filter
		if (informationFilter) information = informationFilter(information);

		return information;
	}

	// Pass the information filter
	parameters.informationFilter = wrappedFilter

	return Normal(players, choices, payoffs, parameters)
}); //				 																												TODO: may want to validate arguments here too



module.exports = { TwoPlayerNormal, Normal };
