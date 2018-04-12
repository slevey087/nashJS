"use strict";

//Helper functions
var { isFunction } = require("../lib/helperFunctions")("general")
var { gameWrapper } = require("../lib/helperFunctions")("stock-games")

//Game engine
var { Choice, Turn } = require("../lib/engine").Playables;


var Normal = gameWrapper(function(players, choiceLists, payoffs = null, parameters = {}) {

		//propogate the information filter
		parameters.parameters ? parameters.parameters.informationFilter = parameters.informationFilter :
			parameters.parameters = { informationFilter: parameters.informationFilter }

		// construct the choices
		var choices = choiceLists.map(function(list, index) {
			return Choice(players[index], list, parameters.parameters);
		});

		var game = Turn(choices, parameters);
		console.log(payoffs)
		if (payoffs) game.setAllPayoffs(payoffs);

		return game;
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
