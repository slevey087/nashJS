import test from 'ava';

//Main game elements
var { Population, Player, Strategies } = require("../index")

// supplemental elements
var { registry } = require("../lib/engine").Backend.State
var { UserPlayerList } = require("../lib/engine").Backend.Classes
var { reinitializePlayers } = require("../lib/engine").Backend.HelperFunctions("player")

var p1 = Player()
var p2 = Player()

test("Population exists", t => {
	t.truthy(Population);
})

test("Population returns players", t => {
	var p = Population()
	t.is(p[0], p1)
	t.is(p[1], p2)
})

test(".assign", t => {
	Strategies.debugger()
	Population().assign("debugger")
	t.is(p1.strategy(), "debugger")
})

test(".exclude", t => {
	var p = Population().exclude(p1)
	t.is(p[0], p2, "filters correctly")
	t.true(p instanceof UserPlayerList, "correct type")
})

test.skip(".generator", t => {
	var p = Population()
	var pl = registry.players[p[0].id()]
	reinitializePlayers()
	var g = registry.players[p.generator()[0].id()]
	t.not(pl, g)
	t.is(g[0].id(), pl.id())
})

test(".ids", t => {
	t.is(Population().ids()[0], p1.id())
})

test(".info", t => {
	t.deepEqual(Population().info()[0], registry.players[p1.id()].infoClean(JSON.parse(JSON.stringify(
		registry.players[p1.id()]))))
})

test(".leader", t => {
	t.is(Population().leader()[0], p1)
	registry.players[p1.id()].score = 1
	t.is(Population().leader(), p1)
})
