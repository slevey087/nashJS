import test from 'ava';

//Main game elements
var NASH = require("../index")
var { Strategies, registerStrategy } = NASH

// supplemental elements
var { registry } = require("../lib/engine").Backend.State
var { _Player, Player } = require("../lib/player")

Strategies.dummy() // we'll need this for the tests

// Mock strategy to test with
var helperGlobal = {}

test("_Player exists", t => {
	t.truthy(_Player)
});


test("_Player constructor", t => {
	// case of default parameters
	var id = "p1"
	var parameters = {}
	var _player = new _Player(id, parameters)

	t.is(_player.id, id)
	t.falsy(_player.role)
	t.deepEqual(_player.history, [])
	t.is(_player.score, 0)
	t.true(_player.alive)
	t.true(_player.available)
	t.falsy(_player.strategy)
	t.is(registry.players[id], _player)

	// case of non-default parameters
	var id = "p1"
	var parameters = { role: "Teacher", assign: "dummy" }
	var _player = new _Player(id, parameters)

	t.is(_player.role, parameters.role)
	t.is(_player.strategy._id, "dummy")
});


test("_Player assign", t => {
	var id = "p1"
	var parameters = {}
	var _player = new _Player(id, parameters)

	var args = []
	_player.assign("dummy", args)

	t.truthy(_player.strategy)
	t.true(_player.strategy instanceof registry.strategies.dummy)
	t.is(_player.strategy._id, "dummy")
	t.is(_player.strategy._args[0], args)
})


test("_Player choose", t => {
	var id = "p1"
	var parameters = { assign: "dummy" }
	var _player = new _Player(id, parameters)

	var options = ["l", "r"]
	var information = ["some stuff"]
	var playerMethod = "choose"


})
