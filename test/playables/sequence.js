import test from 'ava';

var NASH = require("../../index")
var { Lambda } = NASH.Playables
var { _Playable, Playable } = require("../../lib/playables/playable")
var { _Sequence, Sequence } = require("../../lib/playables/sequence")
var Engine = require("../../lib/engine")
var { Expose } = Engine.Backend
var { Summary, History } = Engine.Backend.Classes
var { registry, gameHistory } = Engine.Backend.State


test("_Sequence exists and subclasses _Playable", t => {
    t.truthy(_Sequence)
    t.true(Object.getPrototypeOf(_Sequence) === _Playable)
})


test("_Sequence constructor", t => {
    var a = {}
    var b = {}

    var s = new _Sequence("s", a, b)

    t.true(s instanceof _Sequence)
    t.true(s instanceof _Playable)

    t.is(s.playableStart, a)
    t.is(s.playableFinish, b)
})


test("_Sequence handleHistory", async t => {
    var historyEntry = {
        sequence: "s",
        action: {},
        duration: 5
    }

    var s = new _Sequence("s")
    var history = new History()

    var result = await s.handleHistory({ history }, { historyEntry })

    t.snapshot(history)
})


test("_Sequence play", async t => {
    t.plan(5)

    var l1 = Lambda(() => t.pass())
    var l2 = Lambda(() => t.pass())
    var l3 = Lambda(() => t.pass())
    var l4 = Lambda(() => t.pass())

    l4(l3(l2(l1)))

    var s = new _Sequence("h", registry.playables[l1.id()], registry.playables[l3.id()])

    var result = await s.play()

    // delete all durations, so we can snapshot
    result.historyEntry.action.forEach((item, index, arr) => delete arr[index].duration)
    delete result.historyEntry.duration

    t.is(result.playable, s)
    delete result.playable

    t.snapshot(result)
    // TODO: test more complex branching cases
    // TODO: test compartmentalization
})


test("Sequence exists and subclasses Playable", t => {
    t.truthy(Sequence)
    t.true(Object.getPrototypeOf(Sequence) === Playable)
})


test("Sequence constructor", t => {
    var l1 = Lambda(() => { })
    var l2 = Lambda(() => { })

    var s = new Sequence(l1, l2)

    var _s = Expose(s)
    t.truthy(_s)
    t.is(_s.playableStart, Expose(l1))
    t.is(_s.playableFinish, Expose(l2))

    // case with error
    t.throws(() => new Sequence({}, l2))
    t.throws(() => new Sequence(l1, {}))
    t.throws(() => new Sequence({}, {}))
})