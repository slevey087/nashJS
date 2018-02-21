"use strict";

fs = require("fs");

module.exports = function(path="./strategies"){
	var files = fs.readdirsync(path);
	var strategies = {}
	files.forEach(function(file){
		var filePath = path + '/' + file;
		
	});
};


