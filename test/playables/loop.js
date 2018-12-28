import test from 'ava';

var NASH = require("../../index")
var { _Playable, Playable } = require("../../lib/playables/playable")
var { Summary } = require("../../lib/summary")
var { _Loop } = require("../../lib/playables/loop")

var { Loop, Lambda } = NASH.Playables
var { registry, gameHistory } = require("../../lib/engine").Backend.State
var { _Lambda } = require("../../lib/engine").Backend.Classes.PlayableClasses
var { History } = require("../../lib/engine").Backend.Classes

test("_Loop exists and is subclass of _Playable", t => {
	t.truthy(_Loop)
	t.true(Object.getPrototypeOf(_Loop) === _Playable)
})


test("_Loop constructor", t => {
	var playable = function () { }
	var count = {}
	var parameters = { parameters: {}, logContinue: {} }
	var _loop = new _Loop("l1", playable, count, parameters)

	t.true(_loop instanceof _Loop)
	t.is(_loop.playable, playable)
	t.is(_loop.count, count)
	t.is(_loop.playableParameters, parameters.parameters)
	t.is(_loop.logContinue, parameters.logContinue)
})



test("_Loop summaryThis", t => {
	var action = function (arg) { return arg; }
	var parameters = {}
	var _lambda = new _Lambda("l1", action, parameters)

	var _loop = new _Loop("l2", _lambda, 3, parameters)

	var summary = _loop.summaryThis(new Summary())
	t.is(summary("count"), 3)
	t.deepEqual(summary("action").summary, _lambda.summarize(new Summary()).summary)
})


test("_Loop handleHistory", t => {

})

/*
test("_Lambda play", async t => {
	var played = false
	var action = function (arg) {
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
*/

// Frontend
test("Loop exists and is subclass of Playable", t => {
	t.truthy(Loop)
	t.true(Object.getPrototypeOf(Loop) === Playable)
})


test("Loop constructor/creator", t => {
	var parameters = {}
	var count = 4
	var lambda = Lambda(function () { }) // to use as a dummy
	var loop = Loop(lambda, count, parameters)

	t.true(loop instanceof Loop)

	// should throw if playable is not a playable
	t.throws(Loop.bind(null, {}, count, parameters))

	// should throw if count is not a number
	t.throws(Loop.bind(null, lambda, {}, parameters))
})
