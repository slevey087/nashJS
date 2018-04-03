"use strict";

// game pieces
var prisonerDilemma = require("./prisoner-dilemma");
var roundRobin = require("./round-robin");
var { Loop } = require("../lib/engine").Playables;

// Population interfaces
var { Population } = require("../lib/population");
var { generatePopulation } = require("../lib/helperfunctions")("tournament");

module.exports = function({ generatePlayers = true } = {}) {
  if (generatePlayers) {
    // Get two sets of players. The second is so players can play themselves
    var players = generatePopulation();
    var copies = generatePopulation();

    var iteration = roundRobin(prisonerDilemma, players, {
      copies,
      initializePlayers: true
    });
  } else {
    var iteration = roundRobin(
      prisonerDilemma,
      Population()
        .onlyAlive()
        .onlyAvailable(),
      { initializePlayers: true }
    );
  }

  return Loop(iteration, 5, { id: "Axelrod-Tournament" });
};
