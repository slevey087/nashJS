import test from "ava";

var { StockGames, Player, History } = require("../../index")

var p1 = Player()
var p2 = Player()
var p3 = Player()

var players = [p1, p2, p3]
var choices = [
	["Left", "Right"],
	["Up", "Down"],
	["Forward", "Back"]
]
var payoffs = [
	[
		[
			[1, 2, 3],
			[2, 3, 4]
		],
		[
			[0, 2, 4],
			[1, 3, 5]
		]
	],
	[
		[
			[2, 5, 6],
			[7, 2, 1]
		],
		[
			[4, 3, 1],
			[2, 5, 3]
		]
	]
]
var parameters = {}

var game = StockGames["Normal"](players, choices, payoffs, parameters)

p1.assign("Choose First")
p2.assign("Choose Second")
p3.assign("Choose First")

test("Queries", t => {
	return game.play().then(function() {
		t.deepEqual(History().query("@N-choices"), { player1: "Left", player2: "Down", player3: "Forward" })
		t.deepEqual(History().query("@N-payouts"), { player2: 2, player3: 4 })
		t.deepEqual(History().query("@N-players"), ["player1", "player2", "player3"]);
	})

})
