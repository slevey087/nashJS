import test from 'ava';

var NASH = require("../../index")
var { Player } = NASH
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { TurnBranch, TurnOutcome, _Turn } = require("../../lib/playables/turn")
var { Evaluator, _Range } = require("../../lib/playables/range")
var { _Choice } = require("../../lib/playables/choice")
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
	var turn = {
		decisions: [null, null],
		interface: {},
		payoffsImplicit: { "left": { "right": [0, 0] } },
		payoffsExplicit: { "left": { "right": {} } }
	} // mockup

	var tb = new TurnBranch(path, turn)
	tb([2, 3, { p1: 6 }])

	t.deepEqual(turn.payoffsImplicit.left.right, [2, 3])
	t.is(turn.payoffsExplicit.left.right.p1, 6)

	// should throw error if not given a number
	t.throws(tb)
})


//TurnOutcome, for Range sub-playables
test("TurnOutcome exists and is a subclass of Branch", t => {
	t.truthy(TurnOutcome)
	t.true(Object.getPrototypeOf(TurnOutcome) === Branch)
})


test("TurnOutcome callable/payoffs", t => {
	var func = function() {}
	var evaluator = new Evaluator(func)

	var mock_Turn = {
		payoffsExplicit: new Map(),
		payoffsImplicit: new Map(),
		next: new Map(),
		interface: {},
		decisions: [null, null]
	}

	var to = new TurnOutcome(evaluator, mock_Turn)

	to([2, 4, { p1: 5 }])

	t.deepEqual(mock_Turn.payoffsImplicit.get(evaluator), [2, 4])
	t.deepEqual(mock_Turn.payoffsExplicit.get(evaluator), { p1: 5 })
	t.true(Array.isArray(mock_Turn.next.get(evaluator))) // should create blank next map
})


//_Turn
test("_Turn exists and is a subclass of _Playabls", t => {
	t.truthy(_Turn)
	t.true(Object.getPrototypeOf(_Turn) === _Playable)
})


test("_Turn constructor with Choices", t => {
	var [p1, p2] = [Player(), Player()]
	var _c1 = new _Choice("c1", p1.id(), ["l", "r"])
	var _c2 = new _Choice("c2", p1.id(), ["u", "d"])

	var _turn = new _Turn("t1", [_c1, _c2])

	t.is(_turn.id, "t1")
	t.deepEqual(_turn.decisions, [_c1, _c2])
	t.deepEqual(_turn.decisionMap, [
		["l", "r"],
		["u", "d"]
	])
	t.is(_turn.branchMode, "tree")

	t.deepEqual(_turn.next, { l: { u: [], d: [] }, r: { u: [], d: [] } })
	t.deepEqual(_turn.payoffsImplicit, { l: { u: [0, 0], d: [0, 0] }, r: { u: [0, 0], d: [0, 0] } })
	t.deepEqual(_turn.payoffsExplicit, { l: { u: {}, d: {} }, r: { u: {}, d: {} } })
})


test("_Turn constructor with Ranges", t => {
	var [p1, p2] = [Player(), Player()]
	var _r1 = new _Range("r1", p1.id(), [0, 5])
	var _r2 = new _Range("r2", p1.id(), [5, 10])

	var _turn = new _Turn("t1", [_r1, _r2])

	t.is(_turn.id, "t1")
	t.deepEqual(_turn.decisions, [_r1, _r2])
	t.deepEqual(_turn.decisionMap, [
		[0, 5],
		[5, 10]
	])
	t.is(_turn.branchMode, "outcome")

	t.true(_turn.next instanceof Map)
	t.true(_turn.next.has("all"))
	t.true(Array.isArray(_turn.next.get("all")))
	t.true(_turn.payoffsImplicit instanceof Map)
	t.true(_turn.payoffsExplicit instanceof Map)
})


test("_Turn generateBranches", t => {
	// case 1, outcome mode.
	var [p1, p2] = [Player(), Player()]
	var _r1 = new _Range("r1", p1.id(), [0, 5])
	var _r2 = new _Range("r2", p1.id(), [5, 10])

	var _turn = new _Turn("t1", [_r1, _r2])
	_turn.interface = {}

	t.false(_turn.generateBranches())

	// case 2, tree mode
	var [p1, p2] = [Player(), Player()]
	var _c1 = new _Choice("c1", p1.id(), ["Left", "Right"])
	var _c2 = new _Choice("c2", p1.id(), ["Left", "Right"])

	var _turn = new _Turn("t1", [_c1, _c2])
	var turn = _turn.interface = {}

	t.true(_turn.generateBranches())
	t.true(_turn.branches.every(function(item) { return item instanceof TurnBranch }))
	t.true(turn.Left.Left instanceof TurnBranch)
	t.deepEqual(turn.Left.Left.path, ["Left", "Left"])
	t.true(turn.Left.Right instanceof TurnBranch)
	t.deepEqual(turn.Left.Right.path, ["Left", "Right"])
	t.true(turn.Right.Right instanceof TurnBranch)
	t.deepEqual(turn.Right.Right.path, ["Right", "Right"])
	t.true(turn.Right.Left instanceof TurnBranch)
	t.deepEqual(turn.Right.Left.path, ["Right", "Left"])
})


test("_Turn summaryThis", t => {
	var [p1, p2] = [Player(), Player()]
	var _c1 = new _Choice("c1", p1.id(), ["Left", "Right"])
	var _c2 = new _Choice("c2", p1.id(), ["Left", "Right"])

	var _turn = new _Turn("t1", [_c1, _c2])
	t.log(_turn.summaryThis(new Summary()).summary.decisions[0])
})


test.todo("_Turn addNext")
