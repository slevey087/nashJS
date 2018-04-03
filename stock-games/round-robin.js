"use strict";

// helper function
var shuffle = require("../lib/helperfunctions")("general").shuffle;

// nashJS engine component
var { Sequence } = require("../lib/engine").Playables;

// gameGenerator should be a function whose first argument is an array of players, and whose second is a parameters object.
var RoundRobin = function(gameGenerator, players, parameters = {}) {
  parameters.id = parameters.id || "Round-Robin";

  // Create array of each combination of players
  var matches = [];

  players.forEach(function(player1, index1) {
    for (var index2 = 0; index2 < index1; index2++) {
      matches.push([players[index2], player1]);
    }

    // optional parameter 'copies.' Pass an extra copy of each player, to play themselves
    if (parameters.copies) matches.push([parameters.copies[index1], player1]);
  });

  shuffle(matches);

  // load the first match manually
  var game = gameGenerator(matches.shift(), parameters.gameParameters);

  //then load subsequent matches
  var round = game;
  matches.forEach(function(match) {
    round = gameGenerator(match, parameters.gameParameters)(round);
  });

  return Sequence(game, round._data.playable, parameters);
};

module.exports = RoundRobin;
