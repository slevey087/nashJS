import test from 'ava';

var NASH = require("../../index")

var { Branch, _Playable, Playable } = require("../../lib/playables/playable")
var { registry } = require("../../lib/engine").Backend.State

// To test timer
var present = require("present");


// Branch first

test("Branch exists", t => {
	t.truthy(Branch);
});

test("Branch constructor", t => {
	var path = []
	var playable = {}

	var b = new Branch(path, playable)

	t.is(b.path, path)
	t.is(b.playable, playable)
});

test("Callable and Returns itself", t => {
	var b = new Branch({ id: "hey" }, ["l"])
	t.is(b(), b)
})


// _Playable

test("_Playable exists", t => {
	t.truthy(_Playable)
});

test("_Playable constructor", t => {
	var id = "id"
	var compartmentalize = {}
	var history = {}
	var information = {}
	var initializePlayers = {}

	var _playable = new _Playable(id, { compartmentalize, history, information, initializePlayers })

	t.is(_playable.id, id)
	t.is(_playable.compartmentalize, compartmentalize)
	t.is(_playable.history, history)
	t.is(_playable.information, information)
	t.is(_playable.initializePlayers, initializePlayers)

	t.is(registry.playables[id], _playable)
});

test("Timer", t => {
	var _playable = new _Playable("id")

	var time = present();
	_playable._startTimer()
	t.true(_playable._timer - time == 0 || _playable._timer - time > 0)
	_playable._stopTimer({}, {})
	t.falsy(_playable._timer)
});

test("_Playable addNext", t => {
	var _playable = new _Playable("id")
	var next = new _Playable("id2")
	_playable.addNext(next)
	t.true(_playable.next.includes(next))
});

test.todo("_Playable checkInit")

test("_Playable play hooks", async t => {
	var params = {}
	var result = {}

	var _playable = new _Playable("id")
	t.is(await _playable.prePlay(params, result).then(function(result) {
		return _playable.postPlay(params, result);
	}), result)
});

test.todo("_Playable handleHistory")

test("_Playable findNext", t => {
	var _playable = new _Playable("id")
	var next = new _Playable("id2")
	_playable.addNext(next)
	t.is(_playable.findNext()[0], next)
});

test("_Playable playNext", async t => {
	var _playable = new _Playable("id")
	var next = new _Playable("id2")
	next.play = function(params, result) { //Mockup play function
		return Promise.resolve("hey")
	}
	_playable.addNext(next)
	t.is((await _playable.playNext())[0], "hey")
});

test("_Playable proceed", async t => {
	var _playable = new _Playable("id")
	var next = new _Playable("id2")
	next.play = function(params, result) { //Mockup play function
		return Promise.resolve("hey")
	}
	_playable.addNext(next)

	var result = {}
	var result1 = _playable.proceed({}, result)
	t.is((await result1)[0], "hey")

	//test short-circuit logic
	var result = {}
	var result1 = _playable.proceed({ shortCircuit: true }, result)
	t.is((await result1), result)
	t.is((await result1).playable, _playable)
});



test("_Playable summarize", t => {
	var _playable = new _Playable("id")
	var summary = _playable.summarize()

	// creates id entry
	t.is(summary("playable"), _playable.id)

	// trackes entries
	t.is(summary.entries[_playable.id], 1)

	// mockup to check that .summaryThis and .summaryNext get called
	var thisQ = false
	var nextQ = false
	_playable.summaryThis = function() { thisQ = true }
	_playable.summaryNext = function() { nextQ = true }

	var summary = _playable.summarize()

	t.true(thisQ)
	t.true(nextQ)
})


test("_Playable summaryThis", t => {
	var _playable = new _Playable("id")
	var summary = {}
	t.is(_playable.summaryThis(summary), summary)
});


test("_Playable summaryNext", t => {
	var _playable1 = new _Playable("id1")
	var _playable2 = new _Playable("id2")

	_playable1.addNext(_playable2)

	t.is(_playable1.summaryNext().summary.next[0]("playable"), "id2")
});



// Playable

test("Playable exists", t => {
	t.truthy(Playable)
});

test("Playable constructor/constructor", t => {
	var _playable = new _Playable("id")
	var playable = Playable.creator(_playable)

	t.is(_playable.interface, playable)
});

test("Playable id", t => {
	var _playable = new _Playable("id")
	var playable = Playable.creator(_playable)

	t.is(playable.id(), _playable.id)
});

test("Playable chaining", t => {
	var _playable = new _Playable("id")
	var playable = Playable.creator(_playable)

	var _playable2 = new _Playable("id2")
	var playable2 = Playable.creator(_playable2)

	playable2(playable)
	t.is(_playable.next[0], _playable2)

	//reset next, and try Branching
	_playable.next = []
	var b = new Branch("all", playable)
	playable2(b)
	t.is(_playable.next[0], _playable2)

	// test that chaining throws error if not given the right type (or any type)
	t.throws(playable2)
});

test("Playable play", async t => {
	var _playable = new _Playable("id")
	var playable = Playable.creator(_playable)

	t.truthy((await playable.play()).Population && (await playable.play()).gameHistory)
})

test("Playable summarize", t => {
	var _playable = new _Playable("id")
	var playable = Playable.creator(_playable)

	t.is(playable.summarize().playable, "id")
})
