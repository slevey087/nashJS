"use strict";

// Strategies
var { Strategies } = require("../strategy");

// Players
var { Player } = require("../player");

module.exports = {
  // Create a player for each available strategy
  generatePopulation: function() {
    var players = [];

    Strategies().forEach(function(strategy) {
      players.push(Player({ assign: strategy }));
    });

    return players;
  }
};
