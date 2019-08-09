import test from 'ava';

var NASH = require("../../index")
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { _StochasticHalt, StochasticHalt } = require("../../lib/playables/stochastic-halt")
var { _Halt } = require('../../lib/playables/halt-if');
var { Summary } = require("../../lib/summary")

var { registry, gameHistory } = require("../../lib/engine").Backend.State

test("_StochasticHalt exists and subclasses _Halt", t => {
    t.truthy(_StochasticHalt)
    t.true(Object.getPrototypeOf(_StochasticHalt) === _Halt)
})

test("_StochasticHalt constructor", t => {
    var probability = .4
    var sh = new _StochasticHalt("sh", probability)

    t.is(sh.probability, probability)
    t.is(sh.generator, Math.random)
    t.snapshot(sh.testCondition.toString())
})

test("_StochasticHalt testCondition", t => {
    var probability = .1
    var sh = new _StochasticHalt("sh", probability)

    var result = 0
    var count = 0
    while (count < 10000) {
        if (sh.testCondition()) result += 1;
        count++
    }

    t.true(result < 2000) // very low probability of failing this test
    t.false(result < 500) // very low probability of failing this test
})

test("_StochasticHalt summaryThis", t => {
    var s = new Summary();

    var probability = .1
    var sh = new _StochasticHalt("sh", probability)

    sh.summarize(s)

    t.is(s("probability"), probability)
})

test("StochasticHalt exists and subclasses Playable", t => {
    t.truthy(StochasticHalt)
    t.true(Object.getPrototypeOf(StochasticHalt) === Playable)
})

test("StochasticHalt constructor", t => {
    var sh = new StochasticHalt(.4)
    t.true(sh instanceof StochasticHalt)

    t.true(registry.playables[sh.id()] instanceof _StochasticHalt)

    // probability validation
    t.throws(() => new StochasticHalt("the"))
    t.throws(() => new StochasticHalt(1.2))
    t.throws(() => new StochasticHalt(-0.3))
})
