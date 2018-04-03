"use strict";

var { _SimpleZeroSum } = require("./simple-zero-sum");

// Play-time logic
var { Expression } = require("../lib/logic");

// Rock-Paper-Scissors
module.exports = function(players, payoff = 1, parameters = {}) {
  parameters.id = parameters.id || "Rock-Paper-Scissors";

  var win = payoff;
  var lose = Expression(function() {
    return -payoff;
  });

  var choices = [["Rock", "Paper", "Scissors"], ["Rock", "Paper", "Scissors"]];
  var payoffs = [[0, lose, win], [win, 0, lose], [lose, win, 0]];

  return _SimpleZeroSum(choices, payoffs, parameters)(players);
};
