import test from "ava";

var { Queries, StockGames } = require("../index")
var { registry } = require("../lib/engine").Backend.State
var { QueryResult, Query } = require("../lib/engine").Backend.Classes

// load a game to get some queries.
StockGames["Iterated Prisoner's Dilemma"]("random")

test("See all stored queries", t => {
	// Returns shortcut and description
	var qua = Queries()
	Object.keys(registry.queries).forEach(function (q, index) {
		t.is(qua[index].shortcut, q)
		t.is(qua[index].query, registry.queries[q].query)
		t.is(qua[index].description, registry.queries[q].description)
	})
})

test("See a particular stored query ", t => {
	// returns JSONata and description
	var q = Object.keys(registry.queries)[0]
	t.deepEqual(Queries(q).query, registry.queries[q].query)
})

test("Apply query to arbitrary object", t => {
	var obj = { hi: [1, 2] }
	t.deepEqual(Queries("hi", obj), new QueryResult("hi", [1, 2]).pack())
})

test("Returns queryResult", t => {
	var result = Queries("hi", { hi: [1, 2] })
	t.true(result instanceof QueryResult)
})

test("Result.queryString returns JSONata", t => {
	var result = Queries("hi", { hi: [1, 2] })
	t.is(result.query, "hi")
})
