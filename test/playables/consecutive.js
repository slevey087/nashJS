import test from 'ava';

var NASH = require("../../index");
var { Expose } = require("../../lib/engine").Backend
var { _Playable, Playable } = require("../../lib/playables/playable")
var { _Consecutive } = require("../../lib/playables/consecutive")
var { Consecutive } = NASH.Playables;
var { Summary } = require("../../lib/summary")
var { History } = require("../../lib/history")
var { Information } = require("../../lib/information")

var { registry, gameHistory } = require("../../lib/engine").Backend.State

// _Consecutive
test("_Consecutive exists and is subclass of _Playable", t => {
    t.truthy(_Consecutive)
    t.true(Object.getPrototypeOf(_Consecutive) === _Playable)
});


test("_Consecutive constructor", t => {
    var playablesArray = [];
    var id = "c1";

    var consecutive = new _Consecutive(id, playablesArray)

    t.true(consecutive instanceof _Consecutive);
    t.true(consecutive instanceof _Playable);
    t.true(consecutive.playablesArray === playablesArray);
})

test("_Consecutive summaryThis", t => {
    var p = NASH.Player()
    var c1 = NASH.Playables.Choice(p, ["l", "r"])
    var c2 = NASH.Playables.Choice(p, ["l", "r"])

    c1 = Expose(c1)
    c2 = Expose(c2)

    var consecutive = new _Consecutive("id", [c1, c2])
    t.snapshot(consecutive.summaryThis(new Summary()))
})

test("_Consecutive handleHistory", async t => {
    // should have a log entry to indicate the conseuctive finished, and a tree entry with all the information

    var p = NASH.Player()
    var c1 = NASH.Playables.Choice(p, ["l", "r"])
    var c2 = NASH.Playables.Choice(p, ["l", "r"])

    c1 = Expose(c1)
    c2 = Expose(c2)

    var consecutive = new _Consecutive("id", [c1, c2])
    var history = new History()
    var result = {
        historyEntry: { duration: {} }
    }
    t.is(result, await consecutive.handleHistory({ history }, result))
    t.is(history[0], result.historyEntry)
    t.deepEqual(history.log[0], { action: "finish", consecutive: "id", duration: {} })
})

test("_Consecutive play", async t => {
    var count = 0
    var resultobj = {}
    var mockPlayable = {
        play({ history, information }) {
            count++
            t.is(history.parent, h)
            t.is(information, i)
            return Promise.resolve(resultobj)
        }
    }

    var consecutive = new _Consecutive("id", [mockPlayable, mockPlayable])
    var h = new History()
    var i = new Information()
    var result = await consecutive.play({ history: h, information: i })
    t.is(result, resultobj) // Not sure this should be the behavior but it currently is.
    delete result.historyEntry.duration // this is different every time
    t.snapshot(result)
    t.is(count, 2)

    // TODO: test compartmentalize
})

test("consecutive exists and subclasses Playable", t => {
    t.truthy(Consecutive)
    t.true(Object.getPrototypeOf(Consecutive) === Playable)
})

test("consecutive constructor", t => {
    var p = NASH.Player()
    var c1 = NASH.Playables.Choice(p, ["l", "r"])
    var c2 = NASH.Playables.Choice(p, ["l", "r"])

    var consecutive = Consecutive([c1, c2])
    var _consecutive = Expose(consecutive)

    t.true(consecutive instanceof Consecutive)
    t.is(registry.consecutives[consecutive.id()], _consecutive)
    t.is(_consecutive.playablesArray[0], Expose(c1))
    t.is(_consecutive.playablesArray[1], Expose(c2))
})

test("consecutive ids",t=>{
    var p = NASH.Player()
    var c1 = NASH.Playables.Choice(p, ["l", "r"])
    var c2 = NASH.Playables.Choice(p, ["l", "r"])

    var consecutive = Consecutive([c1, c2])

    t.deepEqual(consecutive.ids(),[c1.id(),c2.id()])
})