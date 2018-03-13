"use strict";


//Logging
var log = require('./logger');
//log.useWinston();  				Winston doesn't work with browserify, so this is a shim. Uncomment to use Winston.
log.setLevel('debug');

log('info','Starting NashJS');


//Game state controllers
var {registry, idCounters} 	= require('./state');
var {gameHistory} 			= require('./history');


//Players
var {_Player, Player}		= require('./player');
registry._addType_("players");
idCounters._addType_("player");


//Population
var {_Population, Population, PlayerList} = require('./population');


//Information mechanics
var {Information, PerfectInformation} = require("./information");


//Playables
var {playableClasses, playableInterfaces} = require('./playables/')
for (var _class in playableClasses) {
	registry  ._addType_(playableClasses[_class].registryName);
	idCounters._addType_(playableClasses[_class].counterName);
}



//Symbolic Logic
var {variablePrototype, Variable, expressionPrototype, Expression} = require('./logic');



//Strategies
registry._addType_("strategies");
idCounters._addType_("strategy");
var {registerStrategy, Strategies}	= require('./strategy');
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
	_Player,				//REMOVE THIS LINE WHEN PUBLISHING
	_Population,			//REMOVE THIS LINE WHEN PUBLISHING
	PlayerList,				//REMOVE THIS LINE WHEN PUBLISHING
	Population,
	Information,			//REMOVE THIS LINE WHEN PUBLISHING
	PerfectInformation,		//REMOVE THIS LINE WHEN PUBLISHING
	'Playables':playableInterfaces,
	registerStrategy,
	Strategies,
	strategyLoader,
	gameHistory,
	'nhistory':History,				//REMOVE THIS WHEN PUBLISHING
	'_expose':expose,		//REMOVE THIS LINE WHEN PUBLISHING
	registry,				//REMOVE THIS LINE WHEN PUBLISHING
	startREPL,				//Should this line be removed when publishing?
	Variable,
	Expression
};