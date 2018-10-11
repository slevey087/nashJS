import test from 'ava';

var NASH = require("../../index")
var { Player } = NASH
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { TurnBranch, TurnOutcome, _Turn } = require("../../lib/playables/turn")
var { Turn } = NASH.Playables
var { Summary } = require("../../lib/summary")

var { registry, gameHistory } = require("../../lib/engine").Backend.State


// TurnBranch first
test("TurnBranch exists and is a subclass of Branch", t => {
	t.truthy(TurnBranch)
	t.true(Object.getPrototypeOf(TurnBranch) === Branch)
})


test("TurnBranch constructor", t => {
	var path = {}
	var turn = { interface: {} } // turn mockup

	var tb = new TurnBranch(path, turn)

	t.is(tb.path, path)
	t.is(tb.playable, turn.interface)
})


test("TurnBranch payoff", t => {
	var path = ["left", "right"]
	var turn = { choices: [null, null], interface: {}, payoffsImplicit: { "left": { "right": [0, 0] } },
		payoffsExplicit: { "left": { "right": {} } } } // mockup

	var tb = new TurnBranch(path, turn)
	tb([2, 3, { p1: 6 }])

	t.deepEqual(turn.payoffsImplicit.left.right, [2, 3])
	t.is(turn.payoffsExplicit.left.right.p1, 6)

	// should throw error if not given a number
	t.throws(tb)
})
