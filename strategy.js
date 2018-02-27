"use strict";

var log = require('./logger');

//Javascript code parser
var esprima = require('esprima');

//Game state controllers
var {registry} = require('./state');

//Helper functions
var {idHandler} = require('./helperFunctions').general;



//User interface to declare strategy type.
function registerStrategy(strategy, name, playername = ""){
	var id = idHandler(name,"strategy");
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


module.exports = {registerStrategy};