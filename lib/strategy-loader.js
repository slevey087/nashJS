"use strict";

const nashName = "./core"; //Change this when published, probably to 'nash-js'

var fs = require("fs");

var { registerStrategy, registerStrategyObject } = require('./strategy');

//Check to see if parsed expression is call to require or eval
function isBannedCall(node) {
	return (node.type === 'CallExpression') &&
		(node.callee.type === 'MemberExpression') &&
		(node.callee.object.type === 'Identifier') &&
		((node.callee.object.name === 'require') || (node.callee.object.name === 'eval'));
}


function removeCalls(source) {
	const entries = [];
	esprima.parseScript(source, {}, function(node, meta) {
		if (isBannedCall(node)) {
			entries.push({
				start: meta.start.offset,
				end: meta.end.offset
			});
		}
	});
	entries.sort((a, b) => { return b.end - a.end }).forEach(n => {
		source = source.slice(0, n.start) + " null; " + source.slice(n.end);
	});
	return source;
}



var loadStrategy = function(filepath, trusted = false) {
	var compiler = require('expression-sandbox');

	var source = fs.readFileSync(filepath);

	if (!trusted) {
		var originalSource = source;
		var parsedSource = removeCalls(source);

		if (originalSource != parsedSource) throw new Error("Strategy " + filepath + " uses require or eval.");
	}

	source = "\"use strict\"; \n " + source;
	compiler(source)({ registerStrategy, registerStrategyObject });

}; //TODO: change this so that strategies can't require any modules.



function loadStrategyFolder(path, trusted = false) {
	var files = fs.readdirSync(path);
	files.forEach(function(file) {
		var filePath = path + '/' + file;
		loadStrategy(filepath);
	});
};


module.exports = { loadStrategy, loadStrategyFolder };
