var StockGames = {
  //Game skeletons
  "Two-Player Normal": require("./simple-normal").TwoPlayerNormal,
  Normal: require("./simple-normal").Normal,
  "Simple Zero-Sum": require("./simple-zero-sum").SimpleZeroSum,

  // Classic games
  "Matching Pennies": require("./matching-pennies"),
  "Prisoner's Dilemma": require("./prisoner-dilemma"),
  "Rock-Paper-Scissors": require("./rock-paper-scissors"),

  // Evolutionary games
  "Cultural Evolution": require("./cultural-evolution"),

  //Tournaments
  "Round Robin": require("./round-robin"),
  "Axelrod Tournament": require("./axelrod-tournament")
};

module.exports = StockGames;
