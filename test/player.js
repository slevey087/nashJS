import test from 'ava';

//Main game elements
var NASH = require("../index")
var { Strategies, registerStrategy } = NASH

// supplemental elements
var { registry } = require("../lib/engine").Backend.State
var { _Player, Player } = require("../lib/player")
var { UserHistory } = require("../lib/history")

Strategies.dummy() // we'll need this for the tests

// Mock strategy to test with
var helperGlobal = {}
registerStrategy(function testStrategy() {
	this.choose = function(options, information) {
		helperGlobal.options = options
		helperGlobal.information = information
		return helperGlobal.response
	}

	this.otherMethod = function(options, information) {
		helperGlobal.options = options
		helperGlobal.information = information
		return helperGlobal.otherResponse
	}
}, "testStrategy")

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


test("_Player choose", async t => {
	var id = "p1"
	var parameters = { assign: "testStrategy" }
	var _player = new _Player(id, parameters)

	helperGlobal.response = "the"
	helperGlobal.otherResponse = "hey"

	// case with normal parameters
	var options = ["l", "r"]
	var information = ["some stuff"]
	var response = await _player.choose(options, information)

	t.is(response, helperGlobal.response)
	t.is(helperGlobal.options, options)
	t.is(helperGlobal.information, information)


	// case with alternate method
	var options = ["l", "r"]
	var information = ["some stuff"]
	var playerMethod = "otherMethod"
	var response = await _player.choose(options, information, playerMethod)

	t.is(response, helperGlobal.otherResponse)
	t.is(helperGlobal.options, options)
	t.is(helperGlobal.information, information)
})


test.todo("_Player infoClean")


test("_Player kill", t => {
	var id = "p1"
	var parameters = {}
	var _player = new _Player(id, parameters)

	_player.kill()
	t.false(_player.alive)
})

// user Player object
test("Player exists", t => {
	t.truthy(Player)
})

test("Player constructor, id", t => {
	var player = Player()
	t.is(registry.players[player.id()].interface, player)
});

test("Player alive", t => {
	var player = Player()
	t.is(registry.players[player.id()].alive, player.alive())
})

test("Player assign", t => {
	var player = Player()
	var args = []
	player.assign("dummy", args)
	t.truthy(registry.players[player.id()].strategy)
	t.is(registry.players[player.id()].strategy._id, "dummy")
	t.is(registry.players[player.id()].strategy._args[0], args)
})

test("Player history", t => {
	var player = Player()
	t.true(player.history() instanceof UserHistory)
})

test("Player isAvailable", t => {
	var player = Player()
	t.is(registry.players[player.id()].available, player.isAvailable())
})

test("Player kill", t => {
	var player = Player()
	player.kill()
	t.false(registry.players[player.id()].alive)
})

test("Player markAvailable", t => {
	var player = Player()
	registry.players[player.id()].available = false
	player.markAvailable()
	t.true(registry.players[player.id()].available)
})

test("Player markBusy", t => {
	var player = Player()
	registry.players[player.id()].available = true
	player.markBusy()
	t.false(registry.players[player.id()].available)
})

test("Player role", t => {
	var player = Player({ role: "bidder" })
	// method should return current role
	t.is(player.role(), "bidder")
	//and change it
	player.role("auctioneer")
	t.is(registry.players[player.id()].role, "auctioneer")
})

test("Player resetScore", t => {
	var player = Player()
	registry.players[player.id()].score = 10
	player.resetScore()
	t.is(registry.players[player.id()].score, 0)
})

test("Player score", t => {
	var player = Player()
	registry.players[player.id()].score = 10
	t.is(player.score(), 10)
})

test("Player strategy", t => {
	var player = Player({ assign: "dummy" })
	t.is(player.strategy(), registry.players[player.id()].strategy._id)
})
