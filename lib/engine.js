"use strict";

// Start plug-in manager
var PluginManager = require("./plugin-manager")
PluginManager.start(function() {})


//Logging
var log = require("./logger");
//log.useWinston();  				Winston doesn't work with browserify, so this is a shim. Uncomment to use Winston.
log.setLevel("debug");
log("info", "Starting NashJS");


//Game state controllers
var { registry, idCounters } = require('./state');


// History
var { gameHistory, History, UserHistory } = require('./history');


//Players
var { _Player, Player } = require('./player');
registry._addType_("players");
idCounters._addType_("player");


//Population
var { gamePopulation, Population, PlayerList, UserPlayerList } = require('./population');


//Information mechanics
var { Information, PerfectInformation } = require("./information");


//Playables
var { playableClasses, playableInterfaces } = require('./playables/')
for (var _class in playableClasses) {
	registry._addType_(playableClasses[_class].registryName);
	idCounters._addType_(playableClasses[_class].counterName);
}

//Symbolic Logic
var {
	variablePrototype,
	Variable,
	expressionPrototype,
	Expression,
	RandomVariable,
	ComplexVariable
} = require("./logic");


//Strategies
registry._addType_("strategies");
idCounters._addType_("strategy");

var { registerStrategy, registerStrategyObject, Strategies } = require('./strategy');
var strategyLoader = require('./strategy-loader');


// Helper function loader
var HelperFunctions = require('./helperFunctions');


//THIS FUNCTION IS ONLY FOR DEBUGGING. REMOVE IT FROM MODULE EXPORTS WHEN PUBLISHING
function Expose(interfacePlayable) {
	return registry.playables[interfacePlayable.id()];
}


function startREPL(toREPL) {
	var repl = require("repl");

	var replServer = repl.start({
		prompt: "Nash >> "
	});

	Object.assign(replServer.context, toREPL);
}



var Engine = {
	FrontEnd: {
		Player,
		_Player, //REMOVE THIS LINE WHEN PUBLISHING
		gamePopulation, //REMOVE THIS LINE WHEN PUBLISHING
		'PlayerList': UserPlayerList,
		Population,
		Information, //REMOVE THIS LINE WHEN PUBLISHING
		PerfectInformation, //REMOVE THIS LINE WHEN PUBLISHING
		'Playables': playableInterfaces,
		registerStrategy,
		registerStrategyObject,
		Strategies,
		strategyLoader,
		gameHistory,
		Expose, //REMOVE THIS LINE WHEN PUBLISHING
		registry, //REMOVE THIS LINE WHEN PUBLISHING
		startREPL, //Should this line be removed when publishing?
		Variable,
		Expression,
		RandomVariable,
		ComplexVariable,
		PluginManager //REMOVE THIS LINE WHEN PUBLISHING
	},

	BackEnd: {
		logger: log,
		State: { registry, idCounters, gameHistory, gamePopulation, PerfectInformation },
		Classes: {
			Player: _Player,
			History,
			UserHistory,
			PlayerList,
			UserPlayerList,
			Information,
			PlayableClasses: { playableClasses },
			variablePrototype,
			expressionPrototype
		},
		HelperFunctions,
		PluginManager,
		Expose
	}
}

module.exports = Engine;
