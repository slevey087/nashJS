import test from 'ava';

var NASH = require("../../index")
var { Lambda } = NASH.Playables
var { _Playable, Playable } = require("../../lib/playables/playable")
var { _Halt, Halt } = require('../../lib/playables/halt');
var { Summary } = require("../../lib/summary")
var { History } = require("../../lib/History")

var { registry, gameHistory } = require("../../lib/engine").Backend.State

test("_HalfIt exists and subclasses _Playable", t => {
    t.truthy(_Halt)
    t.true(Object.getPrototypeOf(_Halt) === _Playable)
})

test("_Halt constructor", t => {
    var h = new _Halt("h")
    t.true(h instanceof _Halt)
})

test("_Halt play", async t => {
    // test with halt    
    var h = new _Halt("h")
    var history = new History();

    var result = await h.play({ history })
    delete result.historyEntry.duration
    t.snapshot(result)
    t.true(history.stop)


    // let's do a more real world test
    var v1, v2, v3
    var l1 = Lambda(() => v1 = true)
    var l2 = Lambda(() => v2 = true)
    var l3 = Lambda(() => v3 = true)
    var h = new Halt()

    l2(l1)
    l3(l2)
    h(l1)

    await l1.play()
    t.true(v1)
    t.true(v2)
    t.falsy(v3)
})

test("Halt exists and subclasses Playable", t => {
    t.truthy(Halt)
    t.true(Object.getPrototypeOf(Halt) === Playable)
})

test("Halt constructor", t => {
    var h = new Halt(function () { })
    t.true(h instanceof Halt)
    t.is(registry.playables[h.id()].interface, h)
})