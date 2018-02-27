"use strict";



//Logging
var log = require('./logger');
//log.useWinston();  				Winston doesn't work with browserify, so this is a shim. Uncomment to use Winston.
log.setLevel('debug');

log('info','Starting NashJS');


//Game state controllers
var {registry, idCounters, gameHistory, occupiedPlayers} = require('./state');


//Players
var {_Player, Player, Population}		= require('./player');
registry._addType_("players");
idCounters._addType_("player");

//Playables
var {playableClasses, playableInterfaces} = require('./playables/')
for (var _class in playableClasses) {
	registry  ._addType_(playableClasses[_class].registryName);
	idCounters._addType_(playableClasses[_class].counterName);
}


//Symbolic Logic
var {variablePrototype, Variable} = require('./logic');


//Strategies
registry._addType_("strategies");
idCounters._addType_("strategy");
var {registerStrategy} 			= require('./strategy');
var strategyLoader = require('./strategy-loader');


//THIS FUNCTION IS ONLY FOR DEBUGGING. REMOVE IT FROM MODULE EXPORTS WHEN PUBLISHING
function expose(interfacePlayable){
	return registry.playables[interfacePlayable.id()];
}


function startREPL(toREPL){
	var repl = require("repl");

	var replServer = repl.start({
		prompt: "Nash >> ",
	});;

	Object.assign(replServer.context,toREPL);
}


module.exports = {
	Player,
	Population,
	'Playables':playableInterfaces,
	registerStrategy,
	strategyLoader,
	gameHistory,
	'_expose':expose,		//REMOVE THIS LINE WHEN PUBLISHING
	registry,				//REMOVE THIS LINE WHEN PUBLISHING
	occupiedPlayers,		//REMOVE THIS LINE WHEN PUBLISHING
	startREPL,				//Should this line be removed when publishing?
	Variable
};