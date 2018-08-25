"use strict";


var logger = function() {
	var args = [...arguments];
	var level = (args[0] == "silly" || !args[0]) ? "trace" : args[0];
	var level = level == "warning" ? "warn" : level;
	args.shift();

	logger.logger[level].apply(logger.logger, args);
};

//logger.logger = console;					//TODO clean this all up a lot.

var getLogger = require("loglevel-colored-level-prefix");
var options = { prefix: 'nashJS', level: 'trace' }
logger.logger = getLogger(options)

logger.setLevel = function(level) {
	logger.logger.level = level;
	logger.logger.setLevel(level)
};

/*
logger.useWinston = function(){

	var winston = require('winston');
	var util = require('util');

	winston.level = "warn";

	winston.clear()
	winston.add(winston.transports.Console, {
		level: 'trace',
		prettyPrint:  function ( object ){
			return util.inspect(object);
		},
		colorize: true,
		silent: false,
		timestamp: false
	});

	this.logger = winston;
};
*/

module.exports = logger;
