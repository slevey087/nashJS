"use strict";

//Helper functions
var { isFunction } = require("../lib/helperFunctions")("general")

//Game engine
var { Choice, Turn } = require("../lib/engine").Playables;

//Backend utility function, meant to be used by other stock-games
function _TwoPlayerNormal(choices, payoffs = null, parameters = {}) {
	return function(players) {
		// Information mechanics.. There are only two players, so we can have a 'me' and 'opponent' entry.
		// If user supplied an information filter, wrap that filter in ours.
		var { informationFilter } = parameters;
		if (!isFunction(informationFilter)) informationFilter = null;
		var wrappedFilter = function(information) {
			var me = information.me.id
			var players = [information.turn.choices[0].choice.player, information.turn.choices[1].choice.player]
			var opponent = players.splice(players.indexOf(me), 1) && players[0];
			var opponentDetail = information.population.filter(function(player) {
				return (player.id == opponent)
			})[0];

			information.opponent = opponentDetail;

			if (informationFilter) information = informationFilter(information);

			return information;
		}

		//Create turn and choices
		var t1 = Turn(
			[Choice(players[0], choices[0], { informationFilter: wrappedFilter }), Choice(players[1], choices[1], { informationFilter: wrappedFilter })],
			parameters
		);

		if (payoffs) t1.setAllPayoffs(payoffs);

		return t1;
	};
}

//Front end wrapper for the user to quickly define a game.
function TwoPlayerNormal(players, choices, payoffs = null, parameters = {}) {
	//TODO: validate all variables

	return _TwoPlayerNormal(choices, payoffs, parameters)(players);
}

function _Normal(choiceLists, payoffs = null, parameters = {}) {
	return function(players) {
		var choices = choiceLists.map(function(list, index) {
			return Choice(players[index], list);
		});

		var t1 = Turn(choices, parameters);

		if (payoffs) t1.setAllPayoffs(payoffs);

		return t1;
	};
}

function Normal(players, choiceLists, payoffs, parameters) {
	//TODO: validate all arguments

	return _Normal(choiceLists, payoffs, parameters)(players);
}

module.exports = { _TwoPlayerNormal, TwoPlayerNormal, _Normal, Normal };
