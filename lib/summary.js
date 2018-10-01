"use strict";

// Base class, external dependency
var CallableInstance = require('callable-instance');


// Data structure for playable summary passing. Callable with a name, creating a sub-branch.
// 'entries' can be used to keep track of instances of a particular playable, to prevent infinite loops.
class Summary extends CallableInstance {
	constructor(entries = {}) {
		super("key")
		this.summary = {}
		this.entries = entries
	}

	key(keyName, value) {
		if (value !== undefined) this.summary[keyName] = value
		return this.summary[keyName]
	}

	branch(branchName) {
		this.summary[branchName] = new Summary(this.entries)
		return this.summary[branchName]
	}

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

	print() {
		for (var [key, value] of Object.entries(this.summary)) {
			if (value instanceof Summary) this.key = this.key.print()
		}

		return this.summary
	}

}

module.exports = { Summary }
