import test from 'ava';

var NASH = require("../../index")
var { Player } = NASH
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { TurnBranch, TurnOutcome, _Turn } = require("../../lib/playables/turn")
var { Evaluator, _Range } = require("../../lib/playables/range")
var { _Choice } = require("../../lib/playables/choice")
var { Turn, Choice, Range } = NASH.Playables
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
	t.snapshot(_turn.summaryThis(new Summary()))
})


test("_Turn summaryNext branch mode", t => {
	var player = Player()
	var options = ["l", "r"]
	var options2 = ["u", "d"]
	var parameters = {}
	var _choice1 = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options2, parameters)
	var _choice3 = new _Choice("c3", player.id(), options, parameters)

	var _turn1 = new _Turn("t1", [_choice1, _choice2], parameters)

	// case with no next
	var summary = new Summary()
	summary = _turn1.summaryNext(summary)
	t.falsy(summary("next"))

	// case with no branching
	_turn1.addNext(_choice3)
	var summary = new Summary()
	summary = _turn1.summaryNext(summary)

	// no branching means there should be a single 'next' branch with the summary
	t.deepEqual(summary("next").summary, _choice3.summarize().summary)

	// case with complex branching
	_turn1.addNext(_choice2, ["l", "d"])
	var summary = new Summary()
	summary = _turn1.summaryNext(summary)

	// branching means there should be multiple next branches, each with summaries
	t.deepEqual(summary("next").l.d[0].summary, _choice3.summarize().summary)
	t.deepEqual(summary("next").l.d[1].summary, _choice2.summarize().summary)
	t.deepEqual(summary("next").l.u.summary, _choice3.summarize().summary)
	t.deepEqual(summary("next").r.u.summary, _choice3.summarize().summary)
	t.deepEqual(summary("next").r.d.summary, _choice3.summarize().summary)
})


test("_Turn summaryNext outcome mode", t => {
	var player = Player()
	var bounds = [1, 4]
	var parameters = {}
	var _range1 = new _Range("r1", player.id(), bounds, parameters)
	var _range2 = new _Range("r2", player.id(), bounds, parameters)
	var _range3 = new _Range("r3", player.id(), bounds, parameters)

	var _turn1 = new _Turn("t1", [_range1, _range2], parameters)

	// first test, no branching
	_turn1.addNext(_range3)
	var summary = new Summary()
	summary = _turn1.summaryNext(summary)

	// no branching means there should be a single 'next' branch with the summary
	t.deepEqual(summary("next").summary, _range3.summarize().summary)


	// second test, complex branching
	var evaluator = new Evaluator(function(result) {
		if (result == 3) return true
	});
	var to = new TurnOutcome(evaluator, _turn1)

	_turn1.addNext(_range2, evaluator)
	var summary = new Summary()
	summary = _turn1.summaryNext(summary)

	// branching means there should be multiple next branches, each with summaries
	t.deepEqual(summary("next")[0].all.summary, _range3.summarize().summary)
	t.deepEqual(summary("next")[1].test.summary, _range2.summarize().summary)
})


test("_Turn addNext", t => {
	// In tree mode, we just pass to Playable
	var player = Player()
	var options = ["l", "r"]
	var options2 = ["u", "d"]
	var parameters = {}
	var _choice1 = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options2, parameters)
	var _choice3 = new _Choice("c3", player.id(), options, parameters)

	var _turn1 = new _Turn("t1", [_choice1, _choice2], parameters)
	_turn1.addNext(_choice2, ["l", "d"])

	t.is(_turn1.next.l.d[0], _choice2)

	// In range mode, things are different
	var player = Player()
	var bounds = [1, 4]
	var parameters = {}
	var _range1 = new _Range("r1", player.id(), bounds, parameters)
	var _range2 = new _Range("r2", player.id(), bounds, parameters)
	var _range3 = new _Range("r3", player.id(), bounds, parameters)

	var _turn1 = new _Turn("t1", [_range1, _range2], parameters)

	// second test, complex branching
	var evaluator = new Evaluator(function(result) {
		if (result == 3) return true
	});
	var to = new TurnOutcome(evaluator, _turn1)

	_turn1.addNext(_range3, evaluator)
	t.is(_turn1.next.get(evaluator)[0], _range3)
})


// Kinda sorta saving this for the day I ever figure out information mechanics in their entirety...
test.todo("_Turn play")


test("_Turn handleHistory", async t => {
	var player = Player()
	var options = ["l", "r"]
	var options2 = ["u", "d"]
	var parameters = {}
	var _choice1 = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options2, parameters)

	var _turn1 = new _Turn("t1", [_choice1, _choice2], parameters)

	// Mock up of these objects
	var mock = false;
	var history = {
		addNoLog(arg) {
			mock = arg
		}
	}

	var result = { historyEntry: {} }

	t.is(await _turn1.handleHistory({ history }, result), result)
	t.is(mock, result.historyEntry)
})


test("_Turn findNext", t => {
	// In tree mode
	var player = Player()
	var options = ["l", "r"]
	var options2 = ["u", "d"]
	var parameters = {}
	var _choice1 = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options2, parameters)
	var _choice3 = new _Choice("c3", player.id(), options, parameters)

	var _turn1 = new _Turn("t1", [_choice1, _choice2], parameters)
	_turn1.addNext(_choice3, ["l", "d"])

	t.is(_turn1.findNext({ result: { result: ["l", "d"] } })[0], _choice3)


	// In outcome mode
	var player = Player()
	var bounds = [1, 4]
	var parameters = {}
	var _range1 = new _Range("r1", player.id(), bounds, parameters)
	var _range2 = new _Range("r2", player.id(), bounds, parameters)
	var _range3 = new _Range("r3", player.id(), bounds, parameters)

	var _turn1 = new _Turn("t1", [_range1, _range2], parameters)
	_turn1.addNext(_range3)

	var evaluator = new Evaluator(function(result) {
		if (result == 3) return true
	});
	var to = new TurnOutcome(evaluator, _turn1)
	_turn1.addNext(_range2, evaluator)

	var next = _turn1.findNext({ result: { result: 3 } })
	t.is(next[0], _range3)
	t.is(next[1], _range2)
})


test("_Turn setAllPayoffs", t => {
	var player = Player()
	var options = ["l", "r"]
	var options2 = ["u", "d"]
	var parameters = {}
	var _choice1 = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options2, parameters)

	var _turn1 = new _Turn("t1", [_choice1, _choice2], parameters)

	var payoffs = [
		[
			[1, 1, { p1: 6 }],
			[2, 2]
		],
		[
			[3, 3],
			[4, 4]
		]
	]

	_turn1.setAllPayoffs(payoffs)

	// the implicit payoffs
	t.deepEqual(_turn1.payoffsImplicit.l.u, [1, 1])
	t.deepEqual(_turn1.payoffsImplicit.l.d, [2, 2])
	t.deepEqual(_turn1.payoffsImplicit.r.u, [3, 3])
	t.deepEqual(_turn1.payoffsImplicit.r.d, [4, 4])

	// the explicit payoffs
	t.deepEqual(_turn1.payoffsExplicit.l.u, { p1: 6 })
})


// Turn
test("Turn exists and is subclass of Playable", t => {
	t.truthy(Turn)
	t.true(Object.getPrototypeOf(Turn) === Playable)
})


test("Turn constructor/creator", t => {
	// Tree mode
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	options = ["u", "d"]
	var choice2 = Choice(player, options, parameters)

	var turn = Turn([choice1, choice2], parameters)

	t.true(turn instanceof Turn)

	// Check that branches were generated
	t.truthy(turn.l.u)
	t.truthy(turn.l.d)
	t.truthy(turn.r.u)
	t.truthy(turn.r.d)
	t.truthy(turn.decisionMap)
	t.falsy(turn.outcome)

	//Outcome mode
	var player = Player()
	var bounds = [0, 10]
	var parameters = {}
	var range1 = Range(player, bounds, parameters)
	var range2 = Range(player, bounds, parameters)

	var turn = Turn([range1, range2], parameters)

	t.truthy(turn.outcome)

	// forcing outcomeMode
	var turn = Turn([choice1, choice2], { forceOutcomeMode: true })
	t.falsy(turn.l)
	t.truthy(turn.outcome)
});


test("Turn payoffsMatrix", t => {
	var player = Player()
	var options = ["l", "r", "c"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	options = ["u", "d"]
	var choice2 = Choice(player, options, parameters)

	var turn = Turn([choice1, choice2], parameters)

	var payoffs = [
		[
			[1, 1],
			[2, 2]
		],
		[
			[3, 3],
			[4, 4]
		],
		[
			[2, 2],
			[5, 5]
		]
	]

	turn.setAllPayoffs(payoffs)
	t.deepEqual(turn.payoffsMatrix(), payoffs)
});


test("Turn setallPayoffs", t => {
	var player = Player()
	var options = ["l", "r", "c"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	options = ["u", "d"]
	var choice2 = Choice(player, options, parameters)

	var turn = Turn([choice1, choice2], parameters)

	var payoffs = [
		[
			[1, 1],
			[2, 2]
		],
		[
			[3, 3],
			[4, 4]
		],
		[
			[2, 2],
			[5, 5]
		]
	]

	t.truthy(turn.setAllPayoffs(payoffs))

	// Case 2, wrong dimensions, should throw.
	var payoffs = [
		[
			[1, 1],
			[2, 2]
		],
		[
			[3, 3],
			[4, 4]
		],
		[
			[2, 2]
		]
	]

	t.throws(turn.setAllPayoffs.bind(turn, payoffs))
})


test("Turn payoffs", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	options = ["u", "d"]
	var choice2 = Choice(player, options, parameters)

	var turn = Turn([choice1, choice2], parameters)

	var payoffs = [
		[
			[1, 1, { p1: 6 }],
			[2, 2]
		],
		[
			[3, 3],
			[4, 4]
		],
	]

	turn.setAllPayoffs(payoffs)

	var result = turn.payoffs()

	t.deepEqual(result.implicit.l.u, [1, 1])
	t.deepEqual(result.implicit.l.d, [2, 2])
	t.deepEqual(result.implicit.r.u, [3, 3])
	t.deepEqual(result.implicit.r.d, [4, 4])
	t.deepEqual(result.explicit.l.u, { p1: 6 })
})


test("Turn decisionMap", t => {
	var player = Player()
	var options = ["l", "r", "c"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	options = ["u", "d"]
	var choice2 = Choice(player, options, parameters)

	var turn = Turn([choice1, choice2], parameters)

	var comparison = [
		["l", "r", "c"],
		["u", "d"]
	]

	t.deepEqual(turn.decisionMap(), comparison)
})


test("Turn branchMode", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	options = ["u", "d"]
	var choice2 = Choice(player, options, parameters)
	var turn = Turn([choice1, choice2], parameters)

	t.is(turn.branchMode(), "tree")

	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice1 = Choice(player, options, parameters)
	var bounds = [1, 5]
	var range = Range(player, bounds, parameters)
	var turn = Turn([choice1, range], parameters)

	t.is(turn.branchMode(), "outcome")
})
