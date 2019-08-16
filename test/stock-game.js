import test from "ava";

var NASH = require("../lib/engine")

var { StockGame } = NASH.Backend.Classes

// Helper functions
var { isFunction } = NASH.Backend.HelperFunctions("general")

var CallableInstance = require('callable-instance');


test("StockGame exists and subclasses CallibleInstance", t => {
    t.truthy(StockGame)
    t.true(Object.getPrototypeOf(StockGame) === CallableInstance)
})


test("StockGame constructor", t => {
    var builder = function () { return 7 }

    // works with only game builder
    var game = new StockGame(builder)

    t.true(isFunction(game.queries))
    t.is(game.queries(), null)
    t.true(isFunction(game.description))
    t.is(game.description(), "No description given.")
    t.true(isFunction(game.argumentValidator))
    t.is(game.argumentValidator(), true)
    t.true(game.combineParameters)
    t.true(isFunction(game.loadStrategies))
    t.true(isFunction(game.loadQueries))
    t.true(isFunction(game.build))

    // add some arguments!
    var sCounter = 0
    var queries = []
    game = new StockGame(builder, {
        argumentValidator: () => false,
        combineParameters: false,
        description: "blah",
        strategyLoader: () => { sCounter++; return {} },
        queries
    })

    t.is(game.queries(), queries)
    t.is(game.description(), "blah");
    t.false(game.argumentValidator())
    t.false(game.combineParameters);

    game.loadStrategies()
    t.is(sCounter, 1)
    game.loadStrategies()
    t.is(sCounter, 1)

    t.throws(game)

    // shouldn't load strategies if argument validator fails
    sCounter = 0
    queries = []
    game = new StockGame(builder, {
        argumentValidator: () => false,
        combineParameters: false,
        description: "blah",
        strategyLoader: () => { sCounter++; return {} },
        queries
    })
    t.throws(game)
    t.is(sCounter, 0)
})


test("StockGame build", t => {
    var builder = function () { return 7 }

    // works with only game builder
    var game = new StockGame(builder)
    t.is(game(), 7)

    // strategy loader shouldn't run if argument validator fails
    var sCounter = 0
    game = new StockGame(builder, {
        argumentValidator: () => false,
        strategyLoader: () => { sCounter++; return {} }
    })
    t.throws(game)
    t.is(sCounter, 0)

    // strategy loader should only run once
    var sCounter = 0
    game = new StockGame(builder, {
        argumentValidator: () => true,
        strategyLoader: () => { sCounter++; return {} }
    })
    game()
    t.is(sCounter, 1)
    game()
    t.is(sCounter, 1)

})


test("StockGame createGenerator", t => {
    t.plan(6)

    var game1 = new StockGame(function (players, arg1, arg2, parameters = {}) {
        t.is(arg1, 7)
        t.is(arg2, 8)
        t.deepEqual(parameters, { entry1: "hi", entry2: "hey" })
    })

    var game2 = game1.createGenerator(7, 8, { entry1: "hi" })
    var players = [1, 2]
    game2(players, { entry2: "hey" })

    var game3 = game2.createGenerator({ entry2: "hey" })
    game3(players)
})