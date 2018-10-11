"use strict";

var log = require('./logger');

//Javascript code parser
var esprima = require('esprima');

//Game state controllers
var { registry } = require('./state');

//Helper functions
var { idHandler } = require('./helper-functions')("state");



//User interface to declare strategy type.
function registerStrategy(strategy, name, description = "No description given.", role = "") {
	var id = idHandler(name, "strategy");

	if (id !== name) {
		//There was already a strategy registered with this name.
		//Check to see if it's the same strategy or not.
		if (registry.strategies[id] !== strategy) {
			//They're different, so we have a name conflict.
			throw new Error("Strategy name conflict with " + name);

		} else {
			// They're the same, do nothing.
			return true;
		}
	}

	// No name conflict and strategy not loaded yet. Add to registry.
	log("debug", "Loading strategy '" + id + "'")
	strategy.role = role;
	strategy.description = description;
	registry.strategies[id] = strategy;
	return name;
}

function registerStrategyObject(strategyObject) {
	// If multiple strategies, split into individuals
	if (Array.isArray(strategyObject)) return strategyObject.map(registerStrategyObject)

	return registerStrategy(strategyObject.strategy, strategyObject.name, strategyObject.description,
		strategyObject.role)
}

//Strip out requires and such
function sanitizeStrategy(strategy) {
	// console.log(x) or console['error'](y)
	function isRequireCall(node) {
		return (node.type === 'CallExpression') &&
			(node.callee.type === 'MemberExpression') &&
			(node.callee.object.type === 'Identifier') &&
			(node.callee.object.name === 'require');
	}

	function removeCalls(source) {
		const entries = [];
		esprima.parseScript(source, {}, function(node, meta) {
			if (isRequireCall(node)) {
				entries.push({
					start: meta.start.offset,
					end: meta.end.offset
				});
			}
		});
		entries.sort((a, b) => { return b.end - a.end }).forEach(n => {
			source = source.slice(0, n.start) + source.slice(n.end);
		});
		return source;
	}

	removeCalls(strategy.toString());

}

//Returns to the user an array of all registered strategies. TODO: have this mirror PlayerList, to provide functionality like onlyAlive and scoresObject.
function Strategies() {
	var strategies = [];
	for (var strategy in registry.strategies) strategies.push(strategy);
	return strategies;
};


Strategies.byRole = function() {
	var roles = { none: [] }
	for (var strategy in registry.strategies)
		if (registry.strategies[strategy].role) roles[registry.strategies[strategy].role] = [];
	for (var strategy in registry.strategies) {
		let role = registry.strategies[strategy].role;
		if (role) roles[role].push(strategy);
		else roles.none.push(strategy)
	}
	return roles;
}


// Fetch the descriptions of the strategies.
Strategies.descriptions = function() {
	var strategies = {};
	for (var strategy in registry.strategies) strategies[strategy] = registry.strategies[strategy].description;
	return strategies;
}


// A built-in strategy for dev debugging. This strategy will be created but do nothing
Strategies.dummy = function() {
	registerStrategy(function() {
		this.choose = function(options, information) {
			return
		}
	}, "dummy")
	return "dummy"
}

Strategies.quick = function(func, methods = []) {

	methods.push("choose")
	methods.push("range")

	registerStrategy(function() {
		for (var method of methods) this[method] = function(options, information) {
			return (func(options, information))
		}
	}, "quick")
	return "quick"
}

// A built-in debugging strategy. Calling this function loads the strategy.
// The strategy just calles 'debugger' when asked to choose.
Strategies.debugger = function(methods = []) {
	registerStrategy(function() {

		this.choose = function(options, information) {
			debugger;
		}

		this.range = function(bounds, information) {
			debugger;
		}

		// arbitrary user methods
		for (var method of methods) this[method] = function(options, information) { debugger; }

	}, "debugger")
	return "debugger"
}


Strategies.logger = function(methods = []) {
	registerStrategy(function() {

		this.choose = function(options, information) {
			console.log("Options: ", options);
			console.log("Information: ", information)
		}

		this.range = function(bounds, information) {
			console.log("Bounds: ", bounds);
			console.log("Information: ", information)
		}

		for (var method of methods)
			this[method] = function(options, information) {
				console.log("Options: ", options);
				console.log("Information: ", information)
			}

	}, "logger")
	return "logger"
}

module.exports = { registerStrategy, registerStrategyObject, Strategies };
