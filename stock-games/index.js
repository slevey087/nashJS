var StockGames = {
	"Two-Player Normal": require("./simple-normal").TwoPlayerNormal,
	"Prisoner's Dilemma":require("./prisoner-dilemma"),
	"Cultural Evolution": require("./cultural-evolution")
}

module.exports = StockGames;