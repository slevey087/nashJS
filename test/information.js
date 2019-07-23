import test from 'ava';

// Game engine and elements
var NASH = require("../index")
var { gameHistory, gamePopulation } = require("../lib/engine").Backend.State

// Components to test
var { Information, PerfectInformation } = require("../lib/information")


test("Information/PerfectInformation exist", t => {
    t.truthy(Information)
    t.truthy(PerfectInformation)
})

test("Information constructor", t => {
    // defaults
    var info = new Information()

    t.is(info.history, gameHistory)
    t.is(info.population, gamePopulation)
})