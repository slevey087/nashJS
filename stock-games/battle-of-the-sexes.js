"use strict";

var { _TwoPlayerNormal } = require("./simple-normal");

// Battle of the Sexes
module.exports = function(players, parameters = {}) {
  parameters.id = parameters.id || "Battle-of-the-Sexes";

  var choices = [["Opera", "Football"], ["Opera", "Football"]];
  var payoffs = [[[2, 1], [0, 0]], [[1, 2], [0, 0]]];

  return _TwoPlayerNormal(choices, payoffs, parameters)(players);
};
