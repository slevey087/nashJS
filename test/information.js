import test from 'ava';

// Game engine and elements
var NASH = require("../index")
var Settings = require("../settings")
var { gameHistory, gamePopulation } = require("../lib/engine").Backend.State
var { InfoPlayerList } = require("../lib/engine").Backend.Classes

// Components to test
var { Information, perfectInformation } = require("../lib/information")


test("Information/perfectInformation exist", t => {
    t.truthy(Information)
    t.truthy(perfectInformation)
})

test("Information constructor", t => {
    // defaults
    var info = new Information()

    t.is(info.history, gameHistory)
    t.is(info.population, gamePopulation)
    t.deepEqual(info.parentHistory, [])
    t.deepEqual(info.additional, [])
    t.deepEqual(info.compilers, [])

    t.true(info.infoPopulation instanceof InfoPlayerList)
    t.deepEqual(info.infoHistory, {
        log: info.parentHistory.concat(info.history.log),
        scores: info.history.scores.slice()
    })

    // TODO: maybe test non-defaults, or defaults but with entries.
})

test("information deliver", t => {
    var player = NASH.Player()
    player.id = player.id() // because we're supposed to have the backend player

    var info = new Information()

    var additional = { j: "k" }
    info.addAdditional(additional)
    var local = { h: "hi" }

    var result = info.deliver(player, local);

    // should return an object that matches but is not the same as the history and population
    t.deepEqual(result, {
        history: {
            log: info.infoHistory.log,
            scores: info.infoHistory.scores,
        },
        population: info.infoPopulation.slice(),
        me: info.infoPopulation.get(player.id),
        ...local,
        ...additional
    })
    t.not(result.history.log, info.infoHistory.log)
    t.not(result.history.scores, info.infoHistory.scores)
    t.not(result.population, info.infoPopulation)
})

test("information update", async t => {
    var info = new Information()
    var pop = gamePopulation().length

    // whatever the original population is
    t.is(info.deliver().population.length, pop)

    // create a blank player
    var p = NASH.Player();

    // does not yet have an extra player
    t.is(info.deliver().population.length, pop)

    info.update()

    // now has an extra player
    t.is(info.deliver().population.length, pop + 1)

    // test the same but with history entries
    var his = info.deliver().history.log.length
    var c1 = NASH.Playables.Choice(p, ["l", "r"])
    await c1.play();
    t.is(info.deliver().history.log.length, his)
    info.update();
    t.is(info.deliver().history.log.length, his + 1)
})

test("information addAdditional", t => {
    var info = new Information()
    var add = {};
    info.addAdditional(add)

    t.is(info.additional[0], add)
})

test("information child", t => {
    var info = new Information()
    info.parentHistory = [1, 2, 3]
    var info2 = info.child();

    t.true(info2 instanceof Information)
    t.is(info.history, info2.history)
    t.is(info.population, info2.population)
    t.deepEqual(info.parentHistory, info2.parentHistory) // this one gets sliced.
})


test("information getCallingPlayable", t => {
    var a = {}
    perfectInformation.playable = a

    var info = new Information()
    t.is(info.getCallingPlayable(), a)
})


test("information clearCallingPlayable", t => {
    var a = {}
    perfectInformation.playable = a

    var info = new Information()
    info.clearCallingPlayable()
    t.is(perfectInformation.playable, undefined)
})


test("information setCallingPlayable", t => {
    // without storing summary
    Settings["store-game-summary"] = false;

    var a = {}
    var info = new Information()
    info.setCallingPlayable(a)
    t.is(perfectInformation.playable, a)

    // with storing summaries. 
    Settings["store-game-summary"] = true;
    // mock playable:
    a = {
        summarize() {
            return {
                print() {
                    return undefined;
                }
            }
        }
    }
    var info = new Information()
    info.setCallingPlayable(a)
    t.is(perfectInformation.playable, a)


    // restore for other tests (kinda silly, but can't deliver information without a real playable if not storing game summary) Maybe do something about this?
    Settings["store-game-summary"] = true;
})


test("information getGameSummary", t => {

    // mock playable:
    var b = {}
    var a = {
        summarize() {
            return {
                print() {
                    return b;
                }
            }
        }
    }
    var info = new Information()
    info.setCallingPlayable(a)

    // without storing summaries. 
    Settings["store-game-summary"] = false;
    t.is(info.getGameSummary(), b)

    // with storing summaries
    Settings["store-game-summary"] = true;
    // since it doesn't call the playable to summarize, if we delete the calling playable we should still get the summary
    perfectInformation.playable = undefined
    t.is(info.getGameSummary(), b)

    // restore for other tests (kinda silly, but can't deliver information without a real playable if not storing game summary) Maybe do something about this?
    Settings["store-game-summary"] = true;
})


test("information addCompiler", t => {
    var info = new Information()
    var a = {}

    info.addCompiler(a)

    t.is(info.compilers[0], a)
})

test("information compile", t => {
    var info = new Information()
    var b = {}
    var a = function (local) {
        t.is(this, info)
        t.is(local, b)
    }

    info.addCompiler(a)
    info.compile(b)
})