import test from 'ava';

var NASH = require("../../index")
var { _Playable, Playable } = require("../../lib/playables/playable")
var { Summary } = require("../../lib/summary")
var { _Lambda } = require("../../lib/playables/lambda")
var { Lambda } = NASH.Playables
var { registry, gameHistory } = require("../../lib/engine").Backend.State


test("_Lambda exists and is subclass of _Playable", t => {
	t.truthy(_Lambda)
	t.true(Object.getPrototypeOf(_Lambda) === _Playable)
})


test("_Lambda constructor", t => {
	var action = function() {}
	var parameters = {}
	var _lambda = new _Lambda("l1", action, parameters)

	t.true(_lambda instanceof _Lambda)
	t.is(_lambda.action, action)
})


test("_Lambda run", t => {
	var action = function(arg) { return arg; }
	var parameters = {}
	var _lambda = new _Lambda("l1", action, parameters)

	var args = "hi"
	t.is(_lambda.run(args), args)
})


test("_Lambda summaryThis", t => {
	var action = function(arg) { return arg; }
	var parameters = {}
	var _lambda = new _Lambda("l1", action, parameters)

	var summary = new Summary()
	t.is(_lambda.summaryThis(summary)("action"), action.toString())
})


test("_Lambda play", async t => {
	var played = false
	var action = function(arg) {
		played = true
		return arg;
	}
	var parameters = {}
	var _lambda = new _Lambda("l1", action, parameters)

	var result = await _lambda.play()
	delete result.historyEntry.duration // This'll be different every time

	t.true(played)
	t.snapshot(result)
})


// Frontend
test("Lambda exists and is subclass of Playable", t => {
	t.truthy(Lambda)
	t.true(Object.getPrototypeOf(Lambda) === Playable)
})


test("Lambda constructor/creator", t => {
	var action = function(arg) { return arg; }
	var parameters = {}
	var lambda = Lambda(action, parameters)

	t.true(lambda instanceof Lambda)

	// should throw if not a function
	t.throws(Lambda.bind(null, "hi"))
})


test("Lambda run", t => {
	var action = function(arg) { return arg; }
	var parameters = {}
	var lambda = Lambda(action, parameters)

	var args = {}
	t.is(lambda.run(args), args)
})
