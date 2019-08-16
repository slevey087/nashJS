import test from 'ava';

var Engine = require("../../lib/engine")
var { Player, Population } = Engine.Frontend
var { _RandomPlayerChoice } = require("../../lib/playables/random-player-choice")
var { RandomPlayerChoice } = Engine.Frontend.Playables
var { _Choice, ChoiceBranch } = require("../../lib/playables/choice")
var { _Playable, Playable } = require("../../lib/playables/playable")
var { _PlayerList, PlayerList, Summary, History } = Engine.Backend.Classes
var { registry } = Engine.Backend.State

var p1 = Player()
var _p1 = registry.players[p1.id()]
var p2 = Player()
var _p2 = registry.players[p2.id()]
var p3 = Player()
var _p3 = registry.players[p3.id()]

test.beforeEach(t => {
    Population().markAvailable();
})

test("_RandomPlayerChoice exists and subclasses _Choice", t => {
    t.truthy(_RandomPlayerChoice)
    t.true(Object.getPrototypeOf(_RandomPlayerChoice) === _Choice)
})


test("_RandomPlayerChoice constructor", t => {
    var parameters = {
        playerList: {},
        excludePlayers: [p1]
    }
    var rpc = new _RandomPlayerChoice("id", ["l", "r"], parameters)

    t.true(rpc instanceof _RandomPlayerChoice)
    t.true(rpc instanceof _Choice)
    t.true(rpc instanceof _Playable)

    t.is(rpc.playerList, parameters.playerList)
    t.true(rpc.excludePlayers instanceof _PlayerList)
    t.is(rpc.excludePlayers[0], registry.players[p1.id()])

    t.is(rpc.generator, Math.random)
})


test("_RandomPlayerChoice prePlay", async t => {
    t.plan(3)
    var rpc = new _RandomPlayerChoice("id", ["l", "r"])

    // overwrite. all it does is get called from a promise
    rpc.choosePlayer = function () { return 8 }

    var history = new History()

    t.is(await rpc.prePlay({ history }), 8)


    // try with a failing case
    rpc.choosePlayer = function () { return "No available players." }

    await rpc.prePlay({ history }).catch(result => {
        t.true(history.stop)
        t.is(result, "No available players.")
    })
})


test("_RandomPlayerChoice choosePlayer", t => {
    var rpc = new _RandomPlayerChoice("id", ["l", "r"])

    var result = rpc.choosePlayer()

    t.true(Population().ids().indexOf(result) >= 0)
    t.is(rpc.player, registry.players[result])

    // test exclude
    rpc = new _RandomPlayerChoice("id", ["l", "r"], { excludePlayers: [p1, p2] })
    p3.markAvailable() // async testing means sometimes p3 might not be available.

    result = rpc.choosePlayer()
    t.is(result, p3.id())

    // pretty hard to test include, so...
})


test("_RandomPlayerChoice summaryThis", t => {
    var options = ["l", "r"]
    var rpc = new _RandomPlayerChoice("id", options)

    var s = new Summary()

    var result = rpc.summaryThis(s)

    t.is(result, s)
    t.deepEqual(s("options"), options)

    // try with a player
    rpc.choosePlayer()
    rpc.summaryThis(s)

    t.is(s("player"), rpc.player.id)
})


test("RandomPlayerChoice exists and subclasses Playable", t => {
    t.truthy(RandomPlayerChoice)
    t.true(Object.getPrototypeOf(RandomPlayerChoice) === Playable)
})

test("RandomPlayerChoice constructor", t => {
    var options = ["l", "r"]
    var rpc = RandomPlayerChoice(options)
    var _rpc = registry.playables[rpc.id()]

    t.true(_rpc instanceof _RandomPlayerChoice)
    t.true(rpc instanceof RandomPlayerChoice)
    t.deepEqual(_rpc.options, options)
    t.true(rpc.l instanceof ChoiceBranch)
    t.true(rpc.r instanceof ChoiceBranch)
})


test("RandomPlayerChoice playerList", t => {
    var options = ["l", "r"]
    var rpc = RandomPlayerChoice(options)
    var _rpc = registry.playables[rpc.id()]

    // test single player
    rpc.playerList(p1)
    t.is(_rpc.playerList, p1)

    // test multiple players as array
    rpc.playerList([p1, p2])
    t.deepEqual(_rpc.playerList, [p1, p2])

    // test playerList
    var list = new PlayerList(p1, p2)
    rpc.playerList(list)
    t.deepEqual(_rpc.playerList, list.slice())

    // test "all"
    rpc.playerList("all")
    t.is(_rpc.playerList, "all")
})


test("RandomPlayerChoice excludePlayers", t => {
    var options = ["l", "r"]
    var rpc = RandomPlayerChoice(options)
    var _rpc = registry.playables[rpc.id()]

    // test single player
    rpc.excludePlayers(p1)
    t.true(_rpc.excludePlayers instanceof _PlayerList)
    t.is(_rpc.excludePlayers[0], _p1)

    // test multiple players as array
    rpc.excludePlayers([p1, p2])
    t.true(_rpc.excludePlayers instanceof _PlayerList)
    t.deepEqual(_rpc.excludePlayers.slice(), [_p1, _p2])

    // test playerList
    var list = new PlayerList(p1, p2)
    rpc.playerList(list)
    t.true(_rpc.excludePlayers instanceof _PlayerList)
    t.deepEqual(_rpc.excludePlayers.slice(), [_p1, _p2])
})


test("RandomPlayerChoice prototype extension", t => {
    var options = ["l", "r"]
    var rpc = RandomPlayerChoice(options)

    t.truthy(rpc.setAllPayoffs)
    t.truthy(rpc.payoffs)
})






