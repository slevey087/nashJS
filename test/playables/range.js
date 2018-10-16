import test from 'ava';

var NASH = require("../../index")
var { Player } = NASH
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { Evaluator, RangeOutcome, _Range, Range } = require("../../lib/playables/range")
var { Summary } = require("../../lib/summary")
var { registry, gameHistory } = require("../../lib/engine").Backend.State


// Evaluator first
test("Evaluator exists", t => {
	t.truthy(Evaluator)
});

test("Evaluator callable", t => {
	var obj = {}
	var func = function() { return obj }

	var evaluator = new Evaluator(func)

	t.is(evaluator(), obj)
})


test("Evaluator id", t => {
	var func = function() {}

	// explicit name parameter
	var evaluator = new Evaluator(func, { id: "Less than 3" })
	t.is(evaluator.id, "Less than 3")

	// name of function
	var evaluator = new Evaluator(func)
	t.is(evaluator.id, func.name)

	// default value
	var evaluator = new Evaluator(function() {})
	t.is(evaluator.id, "evaluator")
});



// RangeOutcome
test("RangeOutcome exists and is a subclass of Branch", t => {
	t.truthy(RangeOutcome)
	t.true(Object.getPrototypeOf(RangeOutcome) === Branch)
})


test("RangeOutcome callable/payoff", t => {
	var func = function() {}
	var evaluator = new Evaluator(func)

	var mock_Range = { payoffs: new Map(), next: new Map(), interface: {} }

	var ro = new RangeOutcome(evaluator, mock_Range)

	ro(4)

	t.is(mock_Range.payoffs.get(evaluator), 4)
	t.true(Array.isArray(mock_Range.next.get(evaluator))) // should create blank next map
})


// _Range class
test("_Range exists and is a subclass of  _Playable", t => {
	t.truthy(_Range)
	t.true(Object.getPrototypeOf(_Range) === _Playable)
})


test("_Range constructor", t => {
	var id = "hi"
	var player = Player()
	var bounds = [0, 10]
	var parameters = { informationFilter: function() {} }

	var _range = new _Range(id, player.id(), bounds, parameters)

	t.is(_range.id, id)
	t.is(_range.player, registry.players[player.id()])
	t.is(_range.bounds, bounds)
	t.true(_range.informationFilter == parameters.informationFilter)
	t.true(_range.next instanceof Map)
	t.true(Array.isArray(_range.next.get("all")))
})


test("_Range addNext", t => {
	var id = "hi"
	var player = {}
	var bounds = []
	var parameters = {}

	var _range = new _Range(id, player, bounds, parameters)

	var evaluator = new Evaluator(function(result) {
		if (result == 3) return true
	});

	var ro = new RangeOutcome(evaluator, _range)

	var nextPlayable1 = {}
	var nextPlayable2 = {}

	//test "all"
	_range.addNext(nextPlayable1, "all")
	t.is(_range.next.get("all")[0], nextPlayable1)

	//test Evaluator
	_range.addNext(nextPlayable2, evaluator)
	t.is(_range.next.get(evaluator)[0], nextPlayable2)
});


test("_range findNext", t => {
	var id = "hi"
	var player = {}
	var bounds = []
	var parameters = {}

	var _range = new _Range(id, player, bounds, parameters)

	var evaluator = new Evaluator(function(result) {
		if (result == 3) return true
	});

	var ro = new RangeOutcome(evaluator, _range)

	var nextPlayable1 = {}
	var nextPlayable2 = {}

	_range.addNext(nextPlayable1, "all")
	_range.addNext(nextPlayable2, evaluator)

	var result1 = { result: { result: 2 } }
	var result2 = { result: { result: 3 } }

	var onlyAll = _range.findNext(result1)
	var both = _range.findNext(result2)

	t.true(onlyAll.length == 1 && onlyAll[0] == nextPlayable1)
	t.true(both.length == 2 && both[0] == nextPlayable1 && both[1] == nextPlayable2)
});


test("_Range play", async t => {
	var player = Player()
	var bounds = [0, 10]
	var parameters = {}
	var _range = new _Range("r1", player.id(), bounds, parameters)

	// shift to the internal player object
	player = registry.players[player.id()]

	// mockup choose function
	var helperGlobal = { response: 1 }
	player.choose = function(bounds, information, method) {
		helperGlobal.bounds = bounds
		helperGlobal.information = information
		helperGlobal.method = method
		return helperGlobal.response
	}

	// base case
	var result = await _range.play()

	t.is(result.result, 1)
	t.is(result.playable, _range)

	var time = result.historyEntry.duration // this'll be different each time
	t.deepEqual(result.historyEntry, { range: "r1", duration: time, player: player.id, result: 1 })
	t.snapshot(helperGlobal)
	t.snapshot(player.history)
	t.is(gameHistory[0], result.historyEntry)
	t.is(gameHistory.log[0], result.historyEntry)

	// case with rounding
	helperGlobal.response = 1.4
	_range.bounds = [0, 10, 1]
	var result = await _range.play()
	t.is(result.result, 1)


	// TODO: case with informationFilter

	// case where player is dead. Should reject TODO: make this work
	//player.alive = false
	//await t.throwsAsync(_range.play().catch(() => { Promise.reject(new Error()) }))

});

test("_Range summaryThis", t => {
	var id = "hi"
	var player = Player()
	var bounds = [0, 1]
	var parameters = {}

	var _range = new _Range(id, player.id(), bounds, parameters)

	var summary = new Summary()
	_range.summaryThis(summary)

	t.is(summary("player"), player.id())
	t.true(summary("bounds")[0] == 0 && summary("bounds")[1] == 1)
})


test("_Range summaryNext", t => {
	var player = Player()
	var bounds = [1, 4]
	var parameters = {}
	var _range1 = new _Range("r1", player.id(), bounds, parameters)
	var _range2 = new _Range("r2", player.id(), bounds, parameters)
	var _range3 = new _Range("r3", player.id(), bounds, parameters)

	// first test, no branching
	_range1.addNext(_range2)
	var summary = new Summary()
	summary = _range1.summaryNext(summary)

	// no branching means there should be a single 'next' branch with the summary
	t.deepEqual(summary("next").summary, _range2.summarize().summary)


	// second test, complex branching
	var evaluator = new Evaluator(function(result) {
		if (result == 3) return true
	});
	var ro = new RangeOutcome(evaluator, _range1)

	//_range1.addNext(_range3, evaluator)
	var summary = new Summary()
	summary = _range1.summaryNext(summary)

	// branching means there should be multiple next branches, each with summaries
	t.deepEqual(summary("next")[0].all.summary, _range2.summarize().summary)
	t.deepEqual(summary("next")[0].all.summary, _range2.summarize().summary)
})


// Range
test("Range exists and is subclass of Playable", t => {
	t.truthy(Range)
	t.true(Object.getPrototypeOf(Range) === Playable)
})


test("Range constructor/creator", t => {
	var player = Player()
	var bounds = [1, 5]
	var parameters = {}
	var range = Range.creator(player, bounds, parameters)

	t.true(range instanceof Range)

	// Should throw if we try to assign an informationFilter that isn't a function
	t.throws(() => { Range.creator(player, bounds, { informationFilter: "the" }) })
})


test("Range outcome", t => {
	var player = Player()
	var bounds = [1, 5]
	var parameters = {}
	var range = Range.creator(player, bounds, parameters)

	var func = function() {}
	var parameters = {}
	var o1 = range.outcome(func, parameters)

	t.true(o1 instanceof RangeOutcome)
	t.is(o1.path.func, func)
})


test("Range payoff", t => {
	var player = Player()
	var r1 = Range.creator(player, [0, 10]); //p1 will choose 0 through 5

	var r1_low = r1.outcome(function(result) {
		if (result < 5) return true
	})

	var r1_high = r1.outcome(function(result) {
		if (result >= 5) return true
	})


	r1_low(2) // set the payoff for choosing a number less than 5 to be 2
	r1_high(3) // set the payoff for choosing a number greater than or equal to 5 to be 3

	t.is(r1.payoff()(1), 2)
	t.is(r1.payoff()(9), 3)
});
