"use strict";

var log = require('./logger');

//Javascript code parser
var esprima = require('esprima');

//Game state controllers
var {registry} = require('./state');

//Helper functions
var {idHandler} = require('./helperFunctions')("state");



//User interface to declare strategy type.
function registerStrategy(strategy, name, playername = ""){
	var id = idHandler(name,"strategy");
	
	log("debug", "Loading strategy '" + id + "'")
	registry.strategies[id] = strategy;
}

//Strip out requires and such
function sanitizeStrategy(strategy){
	// console.log(x) or console['error'](y)
	function isRequireCall(node) {
		return (node.type === 'CallExpression') &&
			(node.callee.type === 'MemberExpression') &&
			(node.callee.object.type === 'Identifier') &&
			(node.callee.object.name === 'require');
	}
	
	function removeCalls(source) {
		const entries = [];
		esprima.parseScript(source, {}, function (node, meta) {
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
function Strategies(){
	var strategies = [];
	for (var strategy in registry.strategies) strategies.push(strategy);
	return strategies;
};

module.exports = {registerStrategy, Strategies};