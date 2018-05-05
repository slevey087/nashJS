"use strict";

const nashName = "./core"; //Change this when published, probably to 'nash-js'

var fs = require("fs");
var compiler = require('expression-sandbox');

var { registerStrategy } = require('./strategy');

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
	var source = fs.readFileSync(filepath);

	if (!trusted) {
		var originalSource = source;
		var parsedSource = removeCalls(source);

		if (originalSource != parsedSource) throw new Error("Strategy " + filepath + " uses require or eval.");
	}

	source = "\"use strict\"; \n " + source;
	compiler(source)(registerStrategy);
}; //TODO: change this so that strategies can't require any modules.



function loadStrategyFolder(path = "./strategies") {
	var files = fs.readdirSync(path);
	var strategies = {}
	files.forEach(function(file) {
		var filePath = path + '/' + file;
		requireFunction(filepath);
	});
};


module.exports = { loadStrategy, loadStrategyFolder };
