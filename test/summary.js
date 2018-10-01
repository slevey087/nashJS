import test from 'ava';

//Main game elements
var NASH = require("../index")

// class
var { Summary } = require("../lib/summary")



test("Summary exists", t => {
	t.truthy(Summary)
})


test("Summary constructor", t => {
	var entries = {}
	var summary = new Summary(entries)

	t.true(summary instanceof Summary)
	t.is(summary.entries, entries)
	t.true(summary.summary instanceof Object)
})


test("Summary is callable, creating a key (or returning its value)", t => {
	var summary = new Summary()

	summary("the", "hi")

	t.is(summary.summary.the, "hi")
	t.is(summary("the"), "hi")
})


test("Summary branch", t => {
	var summary = new Summary()
	var choices = summary.branch("choices")

	t.truthy(summary.summary.choices)
	t.is(summary.summary.choices, choices)
	t.true(summary.summary.choices instanceof Summary)
})


test("Summary array", t => {
	var summary = new Summary()
	var choices = [{ hey: "hi" }, { hey: "the" }]

	summary.array("choices", choices, function(item, summary) {
		summary("hey", item.hey)
	})


	t.is(summary.summary.choices[0].summary.hey, "hi")
	t.is(summary.summary.choices[1].summary.hey, "the")
});
