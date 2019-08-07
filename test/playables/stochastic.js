import test from 'ava';

var NASH = require("../../index")
var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { Probabilities, _Stochastic, Stochastic } = require("../../lib/playables/stochastic")
var { Summary } = require("../../lib/summary")

var { registry, gameHistory } = require("../../lib/engine").Backend.State

test("Probabilities exists and subclasses Array", t => {
    t.truthy(Probabilities)
    t.true(Object.getPrototypeOf(Probabilities) === Array)
})

test("Probabilities sum", t => {
    // testing separately becasue it's used in the constructor
    var probs = [0.1, 0.3, 0.2]
    t.is(Probabilities.prototype.sum.call(probs), .1 + .3 + .2)
    t.is(Probabilities.prototype.sum.call(probs, false), .1 + .3)
})

test("Probbabilities checkProbabilities", t => {
    // testing separately becasue it's used in the constructor

    var probs = [0.1, 0.5]
    probs.sum = () => probs.reduce((num, sum) => num + sum, 0)
    t.true(Probabilities.prototype.checkProbabilities.call(probs))

    probs = [0, 0]
    probs.sum = () => probs.reduce((num, sum) => num + sum, 0)
    t.true(Probabilities.prototype.checkProbabilities.call(probs))

    probs = [-1, 0]
    probs.sum = () => probs.reduce((num, sum) => num + sum, 0)
    t.false(Probabilities.prototype.checkProbabilities.call(probs))

    probs = ["hi", 0]
    probs.sum = () => probs.reduce((num, sum) => num + sum, 0)
    t.false(Probabilities.prototype.checkProbabilities.call(probs))

    probs = [1.2, 0]
    probs.sum = () => probs.reduce((num, sum) => num + sum, 0)
    t.false(Probabilities.prototype.checkProbabilities.call(probs))

    probs = [.6, 0.5]
    probs.sum = () => probs.reduce((num, sum) => num + sum, 0)
    t.false(Probabilities.prototype.checkProbabilities.call(probs))
})

test("Probabilities constructor", t => {
    var probs = [0.1, 0.5]
    probs = new Probabilities(...probs)

    t.true(probs instanceof Probabilities)

    t.is(probs[0], 0.1)
    t.is(probs[1], 0.5)
    t.is(probs[2] * 1, 0.4)

    // when changing values, the residual value should reset to the new residual
    probs[1] = .2
    t.is(probs[2] * 1, 0.7)

    // check that it still works for a single value (which is hard because the array constructor doesn't like to take a single number)
    var probs = [0.1]
    probs = new Probabilities(...probs)
    t.is(probs[0], 0.1)
    t.is(probs[1] * 1, 0.9)
})

test("_Stochastic exists and subclasses _Playable", t => {
    t.truthy(_Stochastic)
    t.true(Object.getPrototypeOf(_Stochastic) === _Playable)
})

test("_Stochastic constructor", t => {
    var probabilities = [.1, .3]
    probabilities = new Probabilities(...probabilities)
    var s = new _Stochastic("s", probabilities)

    t.is(s.omitHistories, true) // default value
    t.is(s.probabilities, probabilities)
    t.snapshot(s.next)

    // different settings
    probabilities = [.1, .9]
    var parameters = { omitHistories: false }
    s = new _Stochastic("s", probabilities, parameters)

    t.is(s.omitHistories, false) // default value
    t.is(s.probabilities[0], .1)
    t.is(s.probabilities[1], .9)
    t.is(s.probabilities[2] * 1, 0)
})


test("_Stochastic generateBranches", t => {
    var probabilities = [.1, .3]
    var s = new _Stochastic("s", probabilities)
    s.interface = {}
    var S = s.interface
    s.generateBranches()

    t.true(S[0] instanceof Branch)
    t.is(S[0].path, 0)
    t.is(S[0].playable, S)
    t.true(S[1] instanceof Branch)
    t.is(S[1].path, 1)
    t.is(S[1].playable, S)
    t.true(S[2] instanceof Branch)
    t.is(S[2].path, 2)
    t.is(S[2].playable, S)
})

test("_Stochastic play", async t => {
    var probabilities = [.1, .3]
    var s = new _Stochastic("s", probabilities, { omitHistories: false })

    var result = await s.play();

    // can't snapshot results directly because they are random. Check results, delete, snapshot the rest
    t.true(result.result === 0 || result.result === 1 || result.result === 2)
    if (gameHistory.length == 1) t.is(gameHistory[0], result.historyEntry)
    t.is(result.result, result.historyEntry.result)
    delete result.result
    delete result.historyEntry.result
    delete result.historyEntry.duration
    t.snapshot(result)

    // check for omit histories
    var s = new _Stochastic("s", probabilities)
    var result = await s.play();

    t.falsy(result.historyEntry)
})

test("_Stochastic summarizeNext", t => {
    var p = NASH.Player();
    var c1 = NASH.Playables.Choice(p, ["l", "r"])
    var c2 = NASH.Playables.Choice(p, ["u", "d"])

    var probabilities = [.2]
    var s = new Stochastic(probabilities)


    c1(s[0])
    c2(s[1])
    t.snapshot(s.summarize())
})


test("Stochastic exists and subclasses Playable", t => {
    t.truthy(Stochastic)
    t.true(Object.getPrototypeOf(Stochastic) === Playable)
})

test("Stochastic constructor", t => {
    var probabilities = [.2]
    var s = new Stochastic(probabilities)

    t.true(s instanceof Stochastic)

    t.truthy(s[0])
    t.truthy(s[1])
    t.falsy(s[2])

    var probabilities = .2
    t.throws(() => new Stochastic(probabilities))
})