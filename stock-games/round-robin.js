"use strict";

// helper function
var shuffle = require("../lib/helperfunctions")("general").shuffle;

// nashJS engine component
var { Sequence, Simultaneous } = require("../lib/engine").Playables;

//for information mechanics
var { Information } = require("../lib/information");
var { History } = require("../lib/history");
var { PlayerList } = require("../lib/population");

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

  //randomize the order
  shuffle(matches);

  // Track scores
  var scores = [];

  var addRound = function(players, parameters) {
    // information mechanics

    parameters.information = new Information(
      new History(),
      new PlayerList(players).generator
    );

    // the actual round
    var round = gameGenerator(players, parameters);

    // track the scores
    var recordScores = Lambda(
      function() {
        var score = Population().scoresByStrategyTotals();
        scores.push(score);
        //return score for history
        return score;
      },
      { id: "Record-Scores" }
    );

    //Chain together
    recordScores(round);

    // return both
    return [
      round,
      recordScores
      // ,Sequence(round, recordScores) // Uncomment for Simultaneous implementation
    ];
  };

  // Sequential implementation
  // load the first match manually
  var [firstRound, firstRecord] = addRound(
    matches.shift(),
    parameters.gameParameters
  );

  //then load subsequent matches
  var record = firstRecord;
  var nextRecord, nextRound;

  matches.forEach(function(match) {
    [nextRound, nextRecord] = addRound(match, parameters.gameParameters);

    nextRound(record);
    record = nextRecord;
  });

  return Sequence(firstRound, nextRecord, parameters);

  /* // Simultaneous implementation
  var rounds = [];
  matches.forEach(function(match) {
    rounds.push(addRound(match, parameters.gameParameters)[2]);
  });

  return Simultaneous(rounds, parameters); */
};

module.exports = RoundRobin;
