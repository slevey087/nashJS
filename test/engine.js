import test from 'ava';

var engine = require("../lib/engine")

test("Engine references", t => {
    // check all the objects one at a time *sigh*

    t.truthy(engine.Frontend)
    var f = engine.Frontend
    t.truthy(engine.Backend)
    var b = engine.Backend

    // Written in loading order. Try to keep up-to-date!

    t.is(b.logger, require("../lib/logger"))

    t.is(b.PluginManager, require("../lib/plugin-manager"))

    t.truthy(b.State)
    t.is(b.State.registry, require('../lib/state').registry)
    t.is(b.State.idCounters, require('../lib/state').idCounters)

    t.is(b.HelperFunctions, require('../lib/helper-functions'))

    t.is(f.syncMode, b.HelperFunctions("state").syncMode)

    t.is(f.Queries, require("../lib/query").Queries)
    t.is(b.Classes.Query, require("../lib/query").Query)
    t.is(b.Classes.QueryResult, require("../lib/query").QueryResult)
    t.is(b.registerQueryObject, require("../lib/query").registerQueryObject)

    t.is(b.State.gameHistory, require('../lib/history').gameHistory)
    t.is(f.History, require('../lib/history').userGameHistory)
    t.is(b.Classes.History, require('../lib/history').History)
    t.is(b.Classes.UserHistory, require('../lib/history').UserHistory)

    t.is(b.Classes._Player, require("../lib/player")._Player)
    t.is(f.Player, require("../lib/player").Player)

    t.is(b.State.gamePopulation, require("../lib/population").gamePopulation)
    t.is(f.Population, require("../lib/population").Population)
    t.is(b.Classes._PlayerList, require("../lib/population")._PlayerList)
    t.is(f.PlayerList, require("../lib/population").PlayerList)
    t.is(b.Classes.PlayerList, require("../lib/population").PlayerList)
    t.is(b.Classes.InfoPlayerList, require("../lib/population").InfoPlayerList)

    t.is(b.Classes.Information, require("../lib/information").Information)
    t.is(b.State.perfectInformation, require("../lib/information").perfectInformation)

    t.is(b.Classes.OutcomeTree, require("../lib/outcomeTree").OutcomeTree)
    t.is(b.Classes.Summary, require("../lib/summary").Summary)

    t.is(b.Classes.PlayableClasses, require("../lib/playables").playableClasses)
    t.deepEqual(f.Playables, require("../lib/playables").playableInterfaces)
    t.not(f.Playables, require("../lib/playables").playableInterfaces) // not actually equal though

    t.is(b.Classes.LogicClasses, require("../lib/logic"))
    t.is(f.Variable, require("../lib/logic").Variable.creator)
    t.is(f.Expression, require("../lib/logic").Expression.creator)
    t.is(f.RandomVariable, require("../lib/logic").RandomVariable.creator)
    t.is(f.ComplexVariable, require("../lib/logic").ComplexVariable.creator)

    t.is(f.registerStrategy, require("../lib/strategy").registerStrategy)
    t.is(f.registerStrategyObject, require("../lib/strategy").registerStrategyObject)
    t.is(f.Strategies, require("../lib/strategy").Strategies)

    t.is(f.loadStrategy, require("../lib/strategy-loader").loadStrategy)
    t.is(f.loadStrategyFolder, require("../lib/strategy-loader").loadStrategyFolder)

    t.true(b.Expose instanceof Function)
    t.true(f.startREPL instanceof Function)
})

test("Expose", t => {

})