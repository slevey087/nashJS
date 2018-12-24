import test from 'ava';

//Start game engine
var NASH = require("../index")
var { Player, Strategies } = NASH

var { _PlayerList, PlayerList, InfoPlayerList } = require("../lib/population")

var { registry, gameHistory } = require("../lib/engine").Backend.State

// load the test strategies
Strategies.debugger()
Strategies.logger()

test("_PlayerList exists and is a subclass of Array", t => {
    t.truthy(_PlayerList)
    t.true(Object.getPrototypeOf(_PlayerList) === Array)
})


test("_Playerlist constructor + generator", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    // check that it fetched the players
    t.is(pl[0], registry.players[p1.id()])
    t.is(pl[1], registry.players[p2.id()])

    // try it with argument as single array
    var pl = new _PlayerList([p1, p2])
    t.is(pl[0], registry.players[p1.id()])
    t.is(pl[1], registry.players[p2.id()])

    // try it with player ids instead of objects
    var pl = new _PlayerList(p1.id(), p2.id())
    t.is(pl[0], registry.players[p1.id()])
    t.is(pl[1], registry.players[p2.id()])

    // try it with backend objects instead of frontend
    var pl = new _PlayerList(registry.players[p1.id()], registry.players[p2.id()])
    t.is(pl[0], registry.players[p1.id()])
    t.is(pl[1], registry.players[p2.id()])

    // check that generator works
    var pl2 = pl.generator()
    // copy over generator, because test fails if not
    pl2.generator = pl.generator
    t.deepEqual(pl, pl2)
})


test("_PlayerList assign", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    pl.assign("logger")

    t.is(p1.strategy(), "logger")
    t.is(p2.strategy(), "logger")
})


test("_PlayerList exclude", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)

    // Should work for frontend player
    var pl2 = pl.exclude(p3)

    // should work for backend player
    var pl3 = pl.exclude(registry.players[p3.id()])

    // should work for id string
    var pl4 = pl.exclude(p3.id())

    // returns _PlayerList
    t.true(pl2 instanceof _PlayerList)

    // Appropriate lengths and elements
    t.deepEqual([pl2.length, pl3.length, pl4.length], [2, 2, 2])
    t.deepEqual([pl[0], pl2[0], pl3[0], pl4[0]], [pl[0], pl[0], pl[0], pl[0]])
    t.deepEqual([pl[1], pl2[1], pl3[1], pl4[1]], [pl[1], pl[1], pl[1], pl[1]])

    // should work for arrays
    var pl5 = pl.exclude([p2, p3])
    t.is(pl5.length, 1)
    t.is(pl[0], pl5[0])
})


test("_PlayerList ids", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    t.deepEqual(pl.ids(), [p1.id(), p2.id()])
})


test("_PlayerList info", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    var pli = pl.info()

    t.true(pli instanceof InfoPlayerList)
})


test("_PlayerList kill", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    var pl2 = pl.kill()

    t.true(pl2 instanceof _PlayerList)
    t.false(p1.alive() || p2.alive())
})


test("_PlayerList leader", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)

    // case with single leader
    registry.players[p2.id()].score = 2
    t.is(pl.leader(), registry.players[p2.id()])

    // case with tie
    registry.players[p3.id()].score = 2
    var pll = pl.leader()
    t.true(pll instanceof _PlayerList)
    t.deepEqual(pll.slice(), [registry.players[p2.id()], registry.players[p3.id()]])
})


test("_PlayerList markAvailable", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    p1.markBusy()
    p2.markBusy()

    var pll = pl.markAvailable()
    t.is(pll, pl)
    t.true(p1.isAvailable(), p2.isAvailable())
})


test("_PlayerList onlyAlive", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    p2.kill()

    var pll = pl.onlyAlive()
    t.true(pll instanceof _PlayerList)
    t.is(pll.length, 1)
    t.is(pll[0], registry.players[p1.id()])
})


test("_PlayerList onlyAvailable", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    p2.markBusy()

    var pll = pl.onlyAvailable()
    t.true(pll instanceof _PlayerList)
    t.is(pll.length, 1)
    t.is(pll[0], registry.players[p1.id()])
})


test("_PlayerList scores", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new _PlayerList(p1, p2)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5

    t.deepEqual(pl.scores(), [2, 5])
})


test("_PlayerList scoresByStrategy", t => {
    var p1 = Player({ assign: "logger" })
    var p2 = Player({ assign: "logger" })
    var p3 = Player({ assign: "debugger" })

    var pl = new _PlayerList(p1, p2, p3)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    var sbs = pl.scoresByStrategy()

    t.deepEqual(sbs["logger"], [2, 5])
    t.deepEqual(sbs["debugger"], [8])

    // test .total method
    t.deepEqual(sbs.total(), { logger: 7, debugger: 8 })
})


test("_PlayerList scoresByStrategyTotal", t => {
    var p1 = Player({ assign: "logger" })
    var p2 = Player({ assign: "logger" })
    var p3 = Player({ assign: "debugger" })

    var pl = new _PlayerList(p1, p2, p3)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    var sbs = pl.scoresByStrategyTotals()

    t.deepEqual(sbs, { logger: 7, debugger: 8 })
})

test("_PlayerList scoresObject", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    var scores = pl.scoresObject()

    t.deepEqual(scores, { [p1.id()]: 2, [p2.id()]: 5, [p3.id()]: 8 })
})


test("_PlayerList scoresMean", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    t.is(pl.scoresMean(), 5)
})


test("_PlayerList scoresRange", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    t.deepEqual(pl.scoresRange(), [2, 8])
})


test("_PlayerList scoresStd", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    t.is(pl.scoresStd(), Math.sqrt(6))
})


test("_PlayerList strategies", t => {
    var p1 = Player({ assign: "logger" })
    var p2 = Player({ assign: "logger" })
    var p3 = Player({ assign: "debugger" })

    var pl = new _PlayerList(p1, p2, p3)

    t.deepEqual(pl.strategies(), ["logger", "logger", "debugger"])
})


test("_PlayerList usingStrategy", t => {
    var p1 = Player({ assign: "logger" })
    var p2 = Player({ assign: "logger" })
    var p3 = Player({ assign: "debugger" })

    var pl = new _PlayerList(p1, p2, p3)

    var pll = pl.usingStrategy("logger")

    t.true(pll instanceof _PlayerList)
    t.is(pll.length, 2)
    t.is(pll[0], registry.players[p1.id()])
    t.is(pll[1], registry.players[p2.id()])

    // should work the same if you use the actual function
    var pll = pl.usingStrategy(registry.strategies.logger)

    t.true(pll instanceof _PlayerList)
    t.is(pll.length, 2)
    t.is(pll[0], registry.players[p1.id()])
    t.is(pll[1], registry.players[p2.id()])
})


test("_PlayerList strategyDistribution", t => {
    var p1 = Player({ assign: "logger" })
    var p2 = Player({ assign: "logger" })
    var p3 = Player({ assign: "debugger" })

    var pl = new _PlayerList(p1, p2, p3)

    var dist = pl.strategyDistribution()

    t.deepEqual(dist, { logger: 2, debugger: 1 })
})


test("_PlayerList resetScores", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    registry.players[p1.id()].score = 2
    registry.players[p2.id()].score = 5
    registry.players[p3.id()].score = 8

    var pl = new _PlayerList(p1, p2, p3)

    pl.resetScores()

    t.is(p1.score(), 0)
    t.is(p2.score(), 0)
    t.is(p3.score(), 0)
})


// PlayerList

test("PlayerList exists and is a subclass of Array", t => {
    t.truthy(PlayerList)
    t.true(Object.getPrototypeOf(PlayerList) === Array)
})


test("Playerlist constructor + generator", t => {
    var p1 = Player()
    var p2 = Player()

    var pl = new PlayerList(p1, p2)

    // check that it fetched the players
    t.is(pl[0], p1)
    t.is(pl[1], p2)

    // try it with argument as single array
    var pl = new PlayerList([p1, p2])
    t.is(pl[0], p1)
    t.is(pl[1], p2)

    // try it with player ids instead of objects
    var pl = new _PlayerList(p1.id(), p2.id())
    t.is(pl[0], registry.players[p1.id()])
    t.is(pl[1], registry.players[p2.id()])

    // check that generator works
    var pl2 = pl.generator()
    // copy over generator, because test fails if not
    pl2.generator = pl.generator
    t.deepEqual(pl, pl2)
})

test("PlayerList arguments return correct datatypes", t => {
    // only need to check a few representative methods, because the same code does all methods
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new PlayerList(p1, p2, p3)
    t.true(pl.exclude(p3) instanceof PlayerList)

    registry.players[p3.id()].score = 1
    t.true(pl.leader() instanceof Player)
})


//InfoPlayerList
test("InfoPlayerList exists and subclasses Array", t => {
    t.truthy(InfoPlayerList)
    t.true(Object.getPrototypeOf(InfoPlayerList) === Array)
})


test("InfoPlayerList constructor", t => {
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)
    var ipl = new InfoPlayerList(pl)

    t.deepEqual(ipl[0], registry.players[p1.id()].infoClean(JSON.parse(JSON.stringify(registry.players[p1.id()]))))
})


test("InfoPlayerList methods", t => {
    //only need to check a few representative ones because the same code handles all of them
    var p1 = Player()
    var p2 = Player()
    var p3 = Player()

    var pl = new _PlayerList(p1, p2, p3)
    var ipl = new InfoPlayerList(pl)

    t.true(ipl.exclude(p3) instanceof InfoPlayerList)

    registry.players[p3.id()].score = 1
    t.true(ipl.leader() instanceof Player)
})