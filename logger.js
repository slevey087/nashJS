"use strict";



var logger = function(){
	logger.logger.log.apply(this,arguments);
};

logger.logger = console;

logger.setLevel = function(level){
	logger.logger.level = level;
};


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


module.exports = logger;