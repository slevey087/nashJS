"use strict";

var log = require('./logger');

//Game state controllers
var {registry} = require('./state');

//Helper functions
var {idHandler} = require('./helperFunctions').general;



//User interface to declare strategy type.
function registerStrategy(strategy, name, playername = ""){
	var id = idHandler(name,"strategy");
	registry.strategies[id] = strategy;
}



module.exports = {
	'registerStrategy':registerStrategy
}