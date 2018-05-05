"use strict";

//Game engine
var Engine = require("../lib/engine")

//Helper functions
var { isFunction } = Engine.BackEnd.HelperFunctions("general")
var { gameWrapper } = Engine.BackEnd.HelperFunctions("stock-games")

// Playables
var { Choice, Turn } = Engine.FrontEnd.Playables;

//Play-time Logic
var { RandomVariable } = Engine.FrontEnd

var Normal = gameWrapper(function(players, choiceLists, payoffs = null, parameters = {}) {

		//propogate the information filter
		parameters.parameters ? parameters.parameters.informationFilter = parameters.informationFilter :
			parameters.parameters = { informationFilter: parameters.informationFilter }

		// construct the choices
		var choices = choiceLists.map(function(list, index) {
			return Choice(players[index], list, parameters.parameters);
		});

		var game = Turn(choices, parameters);

		if (payoffs) game.setAllPayoffs(payoffs);

		return game;
	}, {
		strategyLoader: function() {
			return [{
					strategy: function chooseFirst() {
						this.choose = function(choices, information) {
							return choices[0]
						}
					},
					name: "chooseFirst"
				},

				{
					strategy: function chooseSecond() {
						this.choose = function(choices, information) {
							return choices[1]
						}
					},
					name: "chooseSecond"
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
					name: "randomize"
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
