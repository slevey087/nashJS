import test from 'ava';

//Main game elements
var NASH = require("../index")

// classes
var { Summary } = require("../lib/summary")
var { OutcomeTree } = require("../lib/outcomeTree")


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

	// case with single entry, condense array
	var summary = new Summary()
	var choices = [{ hey: "hi" }]

	summary.array("choices", choices, function (item, summary) {
		summary("hey", item.hey)
	})

	t.is(summary.summary.choices.summary.hey, "hi")


	// case with single entry, don't condense array
	var summary = new Summary()
	var choices = [{ hey: "hi" }]

	summary.array("choices", choices, function (item, summary) {
		summary("hey", item.hey)
	}, true)

	t.is(summary.summary.choices[0].summary.hey, "hi")


	// case with multiple entries
	var summary = new Summary()
	var choices = [{ hey: "hi" }, { hey: "the" }]

	summary.array("choices", choices, function (item, summary) {
		summary("hey", item.hey)
	})


	t.is(summary.summary.choices[0].summary.hey, "hi")
	t.is(summary.summary.choices[1].summary.hey, "the")
});


test("Summary tree", t => {
	var summary = new Summary()
	var choices = [
		["l", "r"]
	]

	// case where terms are identical. Result should be single key
	var next = new OutcomeTree(choices, "hi")

	summary.tree("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	})

	t.deepEqual(summary.summary, { next: "hi" })

	// case with different terms. Result should be tree summary
	next.setValue("r", "hey")

	summary.tree("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	})

	t.deepEqual(summary.summary.next.l.summary, { item: "hi", path: ["l"] })
	t.deepEqual(summary.summary.next.r.summary, { item: "hey", path: ["r"] })
});


test("Summary treeArray", t => {
	var summary = new Summary()
	var choices = [
		["l", "r"]
	]

	// case where terms are identical and singular. Result should be single key with single elment
	var next = new OutcomeTree(choices, ["hi"])
	summary.treeArray("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	})
	t.deepEqual(summary.summary.next.summary, { item: "hi", path: ["r"] })

	// case where treeIfIdentical is true (only works for single element)
	var next = new OutcomeTree(choices, ["hi"])
	summary.treeArray("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	}, { treeIfIdentical: true })
	t.deepEqual(summary.summary.next.l.summary, { item: "hi", path: ["l"] })
	t.deepEqual(summary.summary.next.r.summary, { item: "hi", path: ["r"] })

	// case where terms have multiple items. Result should be full tree.
	var next = new OutcomeTree(choices, null, () => ["hi"])
	next.getValue(["l"]).push("hey")
	summary.treeArray("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	})
	t.deepEqual(summary.summary.next.l[0].summary, { item: "hi", path: ["l"] })
	t.deepEqual(summary.summary.next.l[1].summary, { item: "hey", path: ["l"] })
	t.deepEqual(summary.summary.next.r.summary, { item: "hi", path: ["r"] })


	// case where arrayIfOne is true
	summary.treeArray("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	}, { arrayIfOne: true })
	t.deepEqual(summary.summary.next.l[0].summary, { item: "hi", path: ["l"] })
	t.deepEqual(summary.summary.next.l[1].summary, { item: "hey", path: ["l"] })
	t.deepEqual(summary.summary.next.r[0].summary, { item: "hi", path: ["r"] })


});


test("Summary mapArray", t => {
	var next = new Map()
	// start small to test condensing
	next.set("hey", [{ a: "hi" }])

	// case of default settings
	var summary = new Summary()
	summary.mapArray("next", next, function (item, summary) {
		summary("yo", item.a)
	})

	t.is(summary.summary.next.hey.summary.yo, "hi")

	// case not using defaults
	var summary = new Summary()
	summary.mapArray("next", next, function (item, summary) {
		summary("yo", item.a)
	}, { arrayIfOne: true })

	t.is(summary.summary.next[0].hey[0].summary.yo, "hi")


	// bigger object to test that, and function naming
	next.set(function b() { }, [{ a: "the" }])
	var summary = new Summary()
	summary.mapArray("next", next, function (item, summary) {
		summary("yo", item.a)
	})
	t.is(summary.summary.next[1].b.summary.yo, "the")

	// case of condensing "all"
	var next = new Map()
	next.set("all", [{ a: "hi" }])
	var summary = new Summary()
	summary.mapArray("next", next, function (item, summary) {
		summary("yo", item.a)
	})
	t.is(summary.summary.next.summary.yo, "hi")

	// case where not condensing "all"
	var next = new Map()
	next.set("all", [{ a: "hi" }])
	var summary = new Summary()
	summary.mapArray("next", next, function (item, summary) {
		summary("yo", item.a)
	}, { condenseAll: false })
	t.is(summary.summary.next.all.summary.yo, "hi")
});


test("Summary print", t => {
	// check that it returns this.summary
	var summary = new Summary()
	t.is(summary.summary, summary.print()) // only works for blank summary

	// check that summary branches print too.
	var summary = new Summary()
	var branch = summary.branch("next")
	t.is(branch.summary, summary.print().next)

	// check array branches
	var summary = new Summary()
	var choices = [{ hey: "hi" }, { hey: "the" }]

	var branch = summary.array("choices", choices, function (item, summary) {
		summary("hey", item.hey)
	})
	t.is(branch.summary.choices[0].summary, summary.print().choices[0])
	var branch = summary.array("choices", choices, function (item, summary) {
		summary("hey", item.hey)
	})
	t.is(branch.summary.choices[1].summary, summary.print().choices[1])


	// and check tree branches
	var summary = new Summary()
	var choices = [
		["l", "r"]
	]

	var next = new OutcomeTree(choices, null, function () {
		return ["hi"]
	})
	next.getValue("l").push("hey")

	summary.treeArray("next", choices, next, function (item, path, itemSummary) {
		itemSummary("path", path)
		itemSummary("item", item)
		return itemSummary
	})
	var print = summary.print()
	t.deepEqual(print.next.l[0], { item: "hi", path: ["l"] })
	t.deepEqual(print.next.l[1], { item: "hey", path: ["l"] })
	t.deepEqual(print.next.r, { item: "hi", path: ["r"] })
})
