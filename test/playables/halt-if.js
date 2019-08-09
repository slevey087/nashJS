import test from 'ava';

var NASH = require("../../index")
var { _Playable, Playable } = require("../../lib/playables/playable")
var { _HaltIf, HaltIf } = require("../../lib/playables/halt-if")
var { Summary } = require("../../lib/summary")
var { History } = require("../../lib/History")

var { registry, gameHistory } = require("../../lib/engine").Backend.State

test("_HalfIt exists and subclasses _Playable", t => {
    t.truthy(_HaltIf)
    t.true(Object.getPrototypeOf(_HaltIf) === _Playable)
})

test("_HaltIf constructor", t => {
    var test = function () { }

    var h = new _HaltIf("h", test)
    t.true(h instanceof _HaltIf)

    t.is(h.testCondition, test)
    t.is(h.logContinue, false)

    // other settings
    var parameters = { logContinue: true }
    var h = new _HaltIf("h", test, parameters)
    t.is(h.logContinue, true)
})

test("_HaltIf summaryThis", t => {
    var s = new Summary();
    var test = function () { var the = "hey" }
    var h = new _HaltIf("h", test)

    h.summarize(s)

    t.is(s("condition"), test.toString())
})

test("_HaltIf play", async t => {
    // test with halt
    var trueTest = function () { return true }
    var h = new _HaltIf("h", trueTest)
    var history = new History();

    var result = await h.play({ history })
    delete result.historyEntry.duration
    t.snapshot(result)
    t.true(history.stop)

    // test with continue
    var falseTest = function () { return false }
    var h = new _HaltIf("h", falseTest)
    var history = new History();

    var result = await h.play({ history })
    t.snapshot(result)
    t.falsy(history.stop)

    // test with logContinue true
    var falseTest = function () { return false }
    var h = new _HaltIf("h", falseTest, { logContinue: true })
    var history = new History();

    var result = await h.play({ history })
    delete result.historyEntry.duration
    t.snapshot(result)
    t.falsy(history.stop)
})

test("HaltIf exists and subclasses Playable", t => {
    t.truthy(HaltIf)
    t.true(Object.getPrototypeOf(HaltIf) === Playable)
})

test("HaltIf constructor", t => {
    var h = new HaltIf(function () { })
    t.true(h instanceof HaltIf)
    t.is(registry.playables[h.id()].interface, h)
})