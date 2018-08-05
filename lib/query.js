"use strict";

// External dependency
var jsonata = require("jsonata");

// Game state
var { registry, idCounters } = require("./state")
registry._addType_("queries")
idCounters._addType_("query")

// The code which evaluates all queries, no matter where they come from.
function evaluateQuery(queryString, target, ...args) {
	// Check for pre-programmed query, designated by '@'
	if (queryString[0] == "@" && registry.queries[queryString]) queryString = registry.queries[queryString].query
	else if (queryString[0] == "@") queryString = queryString.slice(1)

	return new QueryResult(queryString, jsonata(queryString).evaluate(target, ...args)).pack();
}



function Query(shortcut, query, description, format = "shortcut") {

	// Only include requested properties, to avoid visual clutter
	if (format == "code" || format == "all") this.query = query;
	if (format == "shortcut" || format == "all") {
		this.shortcut = shortcut

		if (format !== "all") {
			// Normally we'd use the prototype method to save memory, but in this case it won't work, so attach another
			this.evaluate = function(target, ...args) {
				return evaluateQuery(query, target, ...args);
			}
		}

	}
	this.description = description
}

Query.prototype.evaluate = function(target, ...args) {
	return evaluateQuery(this.query, target, ...args)
};



// A class to share results with. A simple QueryResult has a `result` and
// a `queryString` property, and a `.pack` method. Calling `.pack` will
// create a new object whose value is the `result` property, but whose
//prototype is the original object. This gives a clean result, that still
// has a `.queryString` property, to view the string that generated it.
function QueryResult(query, result) {
	// Can't add properties to undefined, to change to a string
	if (result == undefined) result = null

	this.query = query
	this.result = result
}
QueryResult.prototype = Object.create(Array.prototype)
QueryResult.prototype.constructor = QueryResult;

// Returns an object that is the results of the query, but whose
// prototype contains .query (unless the result was just a string)
QueryResult.prototype.pack = function() {
	// If result is string,
	if (typeof this.result === "string") {
		var packed = new String(this.result)
		packed.query = this.query
		return packed;
	}
	// If it's array
	else if (Array.isArray(this.result)) {
		var packed = Object.create(this)
		packed.push(...this.result)
		return packed
	}
	//Normal object
	else return Object.assign(Object.create(this), this.result)
}


// User object for dealing with these things.
function Queries(queryString, target, ...args) {
	// If no query string, display all available shortcuts
	if (!queryString) {
		return Object.keys(registry.queries).map(function(query) {
			var q = registry.queries[query]
			return new Query(query, q.query, q.description, "shortcut")
		})
	}
	// If query string, either run query or return query
	else {
		// If no target, return query
		if (!target) {
			var q = registry.queries[queryString]
			if (q) return new Query(queryString, q.query, q.description, "code")
		}
		// If yes target, run query on target and return result
		else {
			return evaluateQuery(queryString, target, ...args)
		}
	}
}


module.exports = { Queries, Query, QueryResult, evaluateQuery }
