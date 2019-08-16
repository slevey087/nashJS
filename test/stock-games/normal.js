import test from "ava";

var Engine = require("../../lib/engine")

var { Player, History } = Engine.Frontend
var { Turn, RandomPlayerChoice } = Engine.Frontend.Playables
var { QueryResult } = Engine.Backend.Classes
var { registry } = Engine.Backend.State

var StockGames = require("../../stock-games")

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
var parameters = { informationFilter: function () { } }

var game = StockGames["Normal"](players, choices, payoffs, parameters)

p1.assign("Choose First")
p2.assign("Choose Second")
p3.assign("Choose First")

test("Normal builder", t => {
	t.true(game instanceof Turn)

	// information filter should propogate
	t.is(Object.entries(registry.decisions)[0][1].informationFilter, parameters.informationFilter)
	t.is(Object.entries(registry.decisions)[1][1].informationFilter, parameters.informationFilter)

	t.deepEqual(game.payoffsMatrix(), payoffs)

	// random players
	var game2 = StockGames["Normal"]("random", choices, payoffs, parameters)
	t.true(registry.playables[game2.id()].decisions[0] instanceof RandomPlayerChoice)
	t.true(registry.playables[game2.id()].decisions[1] instanceof RandomPlayerChoice)
})

test("Normal Queries", t => {
	return game.play().then(function () {
		t.deepEqual(History().query("@N-choices"), new QueryResult("hi", {
			player1: "Left",
			player2: "Down",
			player3: "Forward"
		}).pack())
		t.deepEqual(History().query("@N-payouts"), new QueryResult("hi", { player2: 2, player3: 4 }).pack())
		t.deepEqual(History().query("@N-players"), new QueryResult("hi", ["player1", "player2", "player3"]).pack());
	})

})
