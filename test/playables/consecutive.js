import test from 'ava';

var NASH = require("../../index");
var { _Playable, Playable } = require("../../lib/playables/playable")
var { _Consecutive } = require("../../lib/playables/consecutive")
var { Consecutive } = NASH.Playables;
var { Summary } = require("../../lib/summary")

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


test("_Consecutive play")