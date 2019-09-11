import test from "ava";

var Engine = require("../../lib/engine")

var { Player, History } = Engine.Frontend
var { Turn, Choice, RandomPlayerChoice } = Engine.Frontend.Playables
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

var p4 = Player()
p4.assign("Randomize")

test("Normal builder", t => {
	t.true(game instanceof Turn)
	t.true(registry.playables[game.id()].decisions[0].interface instanceof Choice)
	t.true(registry.playables[game.id()].decisions[1].interface instanceof Choice)
	t.true(registry.playables[game.id()].decisions[2].interface instanceof Choice)
	t.true(registry.playables[game.id()].decisions[0].player.interface === p1)
	t.true(registry.playables[game.id()].decisions[1].player.interface === p2)
	t.true(registry.playables[game.id()].decisions[2].player.interface === p3)


	// information filter should propogate
	t.is(registry.playables[game.id()].decisions[0].informationFilter, parameters.informationFilter)
	t.is(registry.playables[game.id()].decisions[1].informationFilter, parameters.informationFilter)
	t.is(registry.playables[game.id()].decisions[2].informationFilter, parameters.informationFilter)

	t.deepEqual(game.payoffsMatrix(), payoffs)

	// random players
	var game2 = StockGames["Normal"]("random", choices, payoffs, parameters)
	t.true(registry.playables[game2.id()].decisions[0].interface instanceof RandomPlayerChoice)
	t.true(registry.playables[game2.id()].decisions[1].interface instanceof RandomPlayerChoice)
	t.true(registry.playables[game2.id()].decisions[2].interface instanceof RandomPlayerChoice)
})

test("Normal Queries", async t => {
	t.plan(3)
	return await game.play().then(function () {
		t.deepEqual(History().query("@N-choices"), new QueryResult("hi", {
			player1: "Left",
			player2: "Down",
			player3: "Forward"
		}).pack())
		t.deepEqual(History().query("@N-payouts"), new QueryResult("hi", { player2: 2, player3: 4 }).pack())
		t.deepEqual(History().query("@N-players"), new QueryResult("hi", ["player1", "player2", "player3"]).pack());
	})
})

test("Normal strategies", async t => {
	t.is(await registry.players[p1.id()].choose(["l", "r"]), "l") // always first
	t.is(await registry.players[p2.id()].choose(["l", "r"]), "r") // always second

	var results = [0, 0, 0, 0, 0, 0, 0, 0, 0] // very unlikely that all results are identical
	results = await Promise.all(results.map(() => registry.players[p4.id()].choose(["l", "r"])))

	t.false(results.every(result => result === "l")) // tests for randomize
	t.false(results.every(result => result === "r"))
	t.true(results.includes("l"))
	t.true(results.includes("r"))
})
