"use strict";

//Game engine
var { Choice, Turn } = require("../lib/engine.js").Playables;

//Backend utility function, meant to be used by other stock-games
function _TwoPlayerNormal(choices, payoffs = null, parameters = {}) {
  return function(players) {
    var t1 = Turn(
      [Choice(players[0], choices[0]), Choice(players[1], choices[1])],
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

function _Normal(choiceLists, payoffs = null, parameters) {
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
