import test from 'ava';

var NASH = require("../../index")
var { Player } = NASH
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { ChoiceBranch, _Choice, Choice } = require("../../lib/playables/choice")
var { Summary } = require("../../lib/summary")

var { registry } = require("../../lib/engine").Backend.State


// ChoiceBranch first
test("ChoiceBranch exists and is a subclass of Branch", t => {
	t.truthy(ChoiceBranch)
	t.true(Object.getPrototypeOf(ChoiceBranch) === Branch)
});


test("ChoiceBranch constructor", t => {
	var path = {}
	var choice = { interface: {} }

	var cb = new ChoiceBranch(path, choice)

	t.is(cb.path, path)
	t.is(cb.playable, choice.interface)
})


test("ChoiceBranch payoff", t => {
	var path = ["left"]
	var choice = { interface: {}, payoffs: { "left": 0 } }

	var cb = new ChoiceBranch(path, choice)
	cb(2)

	t.is(choice.payoffs.left, 2)

	// should throw error if not given a number
	t.throws(cb)
})


// _Choice
test("_Choice exists and is subclass of _Playable", t => {
	t.truthy(_Choice)
	t.true(Object.getPrototypeOf(_Choice) === _Playable)
});


test("_Choice constructor", t => {
	var player = NASH.Player()
	var options = ["l", "r"]
	var parameters = {
		defaultOption: "r",
		playerMethod: "cheese",
		usePayoffs: true,
		informationFilter: function() {},
	}
	var _choice = new _Choice("c1", player.id(), options, parameters)

	t.true(_choice instanceof _Choice)
	t.is(_choice.player.id, player.id())
	t.is(_choice.options, options)
	t.is(_choice.defaultOption, parameters.defaultOption)
	t.is(_choice.playerMethod, parameters.playerMethod)
	t.is(_choice.informationFilter, parameters.informationFilter)
	t.is(_choice.usePayoffs, parameters.usePayoffs)

	var nexts = Object.keys(_choice.next)

	t.true(nexts.every(function(item) {
		return options.includes(item)
	}))

	t.is(registry.choices.c1, _choice)
});


test("_Choice generateBranches", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var _choice = new _Choice("c1", player.id(), options, parameters)

	var choice = {}
	_choice.interface = choice

	_choice.generateBranches()
	t.truthy(choice.l && choice.r)
});


test("_Choice findNext", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var _choice = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options, parameters)

	_choice.addNext(_choice2)
	t.is(_choice.findNext({ result: { result: "l" } })[0], _choice2)
});


test("_Choice releasePlayer", t => {
	var player = Player()
	player.busy()

	var options = ["l", "r"]
	var parameters = {}
	var _choice = new _Choice("c1", player.id(), options, parameters)

	_choice.releasePlayer()
	t.true(_choice.player.available)
})


test("_Choice summaryThis", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var _choice = new _Choice("c1", player.id(), options, parameters)

	var summary = new Summary()
	_choice.summaryThis(summary)


	t.is(summary.summary.player, player.id())
	t.true(options.every(function(item) {
		return summary.summary.options.includes(item)
	}))
})


test("_Choice summaryNext", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var _choice1 = new _Choice("c1", player.id(), options, parameters)
	var _choice2 = new _Choice("c2", player.id(), options, parameters)
	var _choice3 = new _Choice("c3", player.id(), options, parameters)

	// case with no next
	var summary = new Summary()
	summary = _choice1.summaryNext(summary)
	t.falsy(summary("next"))

	// case with no branching
	_choice1.addNext(_choice2)
	var summary = new Summary()
	summary = _choice1.summaryNext(summary)

	// no branching means there should be a single 'next' branch with the summary
	t.deepEqual(summary("next").summary, _choice2.summarize().summary)


	// case with complex branching
	_choice1.addNext(_choice3, ["l"])
	var summary = new Summary()
	summary = _choice1.summaryNext(summary)

	// branching means there should be multiple next branches, each with summaries
	t.deepEqual(summary("next").l[0].summary, _choice2.summarize().summary)
	t.deepEqual(summary("next").l[1].summary, _choice3.summarize().summary)
	t.deepEqual(summary("next").r.summary, _choice2.summarize().summary)
})




test("_Choice zeroPayoffs", t => {
	var mockChoice = { options: ["l", "r"] }

	_Choice.prototype.zeroPayoffs.apply(mockChoice)

	t.is(mockChoice.payoffs.l, 0)
	t.is(mockChoice.payoffs.r, 0)
});


test("_Choice play", t => {


	t.fail()
});


// Choice
test("Choice exists and is subclass of Playable", t => {
	t.truthy(Choice)
	t.true(Object.getPrototypeOf(Choice) === Playable)
})


test("Choice constructor/creator", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice = Choice.creator(player, options, parameters)

	t.true(choice instanceof Choice)

	// Check that branches were generated
	t.truthy(choice.l)
	t.truthy(choice.r)

	// Should throw if we try to assign an informationFilter that isn't a function
	t.throws(() => { Choice.creator(player, options, { informationFilter: "the" }) })
})


test("Choice setAllPayoffs", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice = Choice.creator(player, options, parameters)

	choice.setAllPayoffs([2, 5])

	t.true(registry.choices[choice.id()].payoffs.l == 2)
	t.true(registry.choices[choice.id()].payoffs.r == 5)

	//t.throws()
});


test("Choice payoffs", t => {
	var player = Player()
	var options = ["l", "r"]
	var parameters = {}
	var choice = Choice.creator(player, options, parameters)

	choice.setAllPayoffs([2, 5])
	var payoffs = choice.payoffs()

	t.true(payoffs.l == 2 && payoffs.r == 5)
});
