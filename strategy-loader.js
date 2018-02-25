"use strict";

var fs = require("fs");

var requireFunction = require;					//TODO: change this so that strategies can't require any modules.

module.exports = function(path="./strategies"){
	var files = fs.readdirSync(path);
	var strategies = {}
	files.forEach(function(file){
		var filePath = path + '/' + file;
		requireFunction = require;
	});
};


