"use strict";

var { _SimpleZeroSum } = require("./simple-zero-sum");

// Play-time logic
var { Expression } = require("../lib/logic");

// Matching Pennies
module.exports = function(players, payoff = 1, parameters = {}) {
  parameters.id = parameters.id || "Matching-Pennies";

  var win = payoff;
  var lose = Expression(function() {
    return -payoff;
  });

  var choices = [["Heads", "Tails"], ["Heads", "Tails"]];
  var payoffs = [[win, lose], [lose, win]];

  return _SimpleZeroSum(choices, payoffs, parameters)(players);
};
