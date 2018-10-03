"use strict";

// Base class, external dependency
var CallableInstance = require('callable-instance');

// To aid with tree-branching
var { recurse } = require("./helper-functions")("turn");
var { outcomeTreeGetValue } = require("./helper-functions")("playable");

// Data structure for playable summary passing. Callable with a name, creating a sub-branch.
// 'entries' can be used to keep track of instances of a particular playable, to prevent infinite loops.
class Summary extends CallableInstance {
	constructor(entries = {}) {
		super("key")
		this.summary = {}
		this.entries = entries
	}


	// create a key in the summary, and fill it with value
	key(keyName, value) {
		if (value !== undefined) this.summary[keyName] = value
		return this.summary[keyName]
	}


	delete(keyName) {
		delete this.summary[keyName]
	}


	// create a branch (key) in the summary which will itself have a Summary, with the same entry list (to prevent circles)
	branch(branchName) {
		this.summary[branchName] = new Summary(this.entries)
		return this.summary[branchName]
	}


	// create a branch (key) which will have an array of Summaries (all with the same entry list)
	array(branchName, array, func, arrayIfOne = false) {
		var summary = this
		summary.summary[branchName] = array.map(function(item) {
			var itemSummary = new Summary(summary.entries)
			var result = func(item, itemSummary)
			return result ? result : itemSummary // in case they forget to return
		})

		// If only one entry, no need for array
		if (!arrayIfOne && summary.summary[branchName].length == 1) summary.summary[branchName] == summary.summary[
			branchName][0]

		return this;
	}


	// create a branch (key) from a tree (outcomeTree), where the values deepest in the tree will be Summaries (all with the same entries list)
	tree(branchName, treeMap, tree, func, treeIfIdentical = false) {
		var summary = this;
		var items = []
		var tempTree = {}

		recurse(treeMap, tempTree, null, function(path) {
			var item = outcomeTreeGetValue(tree, path)
			items.push(item)

			var itemSummary = new Summary(summary.entries)
			var result = func(item, path, itemSummary)
			return result ? result : itemSummary
		})

		var areIdentical = items.every(function(item) {
			return (item === items[0])
		})

		if (areIdentical && !treeIfIdentical) summary.summary[branchName] = items[0]
		else summary.summary[branchName] = tempTree

		return this;
	}


	// create a branch (key) from a tree (outcomeTree), where the values deepest in the tree will be arrays of Summaries (all with the same entries list)
	treeArray(branchName, treeMap, tree, func, { arrayIfOne = false, treeIfIdentical = false } = {}) {
		var summary = this;
		var items = []
		var processedItem // will hold onto the last item, then get used as the end result if items are identical
		var tempTree = {}

		// using treeMap as a guide, write to tempTree, the value returned by the function
		recurse(treeMap, tempTree, null, function(path) {
			var array = outcomeTreeGetValue(tree, path)
			items.push(array)

			// process the raw input into a Summary, using the user-provided function
			array = array.map(function(item) {
				var itemSummary = new Summary(summary.entries)
				var result = func(item, path, itemSummary)
				processedItem = result
				return result ? result : itemSummary
			})
			// by default, replace single-length arrays with the value
			if (!arrayIfOne && array.length == 1) {
				array = array[0]
				items[items.length - 1] = items[items.length - 1][0]
			}

			return array
		})

		var areIdentical = items.every(function(item) {
			return (item == items[0])
		})

		if (areIdentical && !treeIfIdentical) {
			// just use the item rather than the whole tree of superfluous information
			summary.summary[branchName] = processedItem

			//try to cut down on entry list duplicates
			// ie. if a Choice with 10 options has the same next item for all of them,
			// that doesn't mean we've been circling 10 times.
			if (items.id) summary.entries[items.id] = summary.entries[items.id] - items.length + 1
		} else summary.summary[branchName] = tempTree

		return this;
	}

	mapArray(branchName, map, func, { arrayIfOne = false, condenseAll = true } = {}) {
		var summary = this;
		summary.summary[branchName] = []

		// iterate over the map, process the value
		for (var [key, value] of map.entries()) {
			value = value.map(function(item) {
				var itemSummary = new Summary(summary.entries)
				var result = func(item, itemSummary)
				return result ? result : itemSummary // In case they forget to return the summary
			})
			// condense by default
			if (!arrayIfOne && value.length == 1) value = value[0]

			summary.summary[branchName].push({
				[key instanceof Function ? key.name : key]: value
			})
		}

		// condense by default (turn singlet array into value, turn singlet "all" object into value)
		if (!arrayIfOne && summary.summary[branchName].length == 1) {
			summary.summary[branchName] = summary.summary[branchName][0]
			if (condenseAll && summary.summary[branchName].all) summary.summary[branchName] = summary.summary[
				branchName].all
		}
	}


	// TODO: Meant to collapse summaries into simple objects. Ths is going to require some work...
	print() {

		// recursive function to handle nested objects in the summary
		function crawl(input) {
			if (input instanceof Summary) return input.print()
			else if (input instanceof Object) {
				for (var key in input) {
					input[key] = crawl(input[key])
				}
			}
			return input
		}

		// Loop over summary keys and recurse over ones that are summaries
		for (var key in this.summary) {
			if (this.summary[key] instanceof Summary) this.summary[key] = this.summary[key].print()
			// if the key is an array, loop through the items, and collapse any that are summaries
			else if (Array.isArray(this.summary[key])) this.summary[key] = this.summary[key].map(function(item) {
				if (item instanceof Summary) return item.print()
				else return crawl(item)
			})
			else {
				this.summary[key] = crawl(this.summary[key])
			}
		}

		return this.summary
	}

}

module.exports = { Summary }
