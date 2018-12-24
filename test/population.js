import test from 'ava';

//Main game elements
var { Population, Player, Strategies } = require("../index")

// supplemental elements
var { registry } = require("../lib/engine").Backend.State
var { UserPlayerList } = require("../lib/engine").Backend.Classes
var { reinitializePlayers } = require("../lib/engine").Backend.HelperFunctions("player")

var p1 = Player()
var p2 = Player()

test("Population exists", t => {
	t.truthy(Population);
})

test("Population returns players", t => {
	var p = Population()
	t.is(p[0], p1)
	t.is(p[1], p2)
})

