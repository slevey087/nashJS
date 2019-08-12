"use strict";

// Load settings information
var Settings = require("../settings");
// object for user to change settings
function settings(setting, value) {
	// TODO: validate user input
	Settings[setting] = value
}


// Start plug-in manager
var PluginManager = require("./plugin-manager");


//Logging
var log = require("./logger");
log.setLevel(Settings["init-log-level"]);
log("info", "Starting NashJS");


//Game state controllers
var { registry, idCounters } = require('./state');
registry.Settings = Settings


// Helper function loader
var HelperFunctions = require('./helper-functions');

// Sync mode
var { syncMode } = HelperFunctions("state")
syncMode(Settings["init-sync-mode"]);

// Query language and shortcuts
var { Queries, Query, QueryResult, evaluateQuery, registerQueryObject } = require("./query");


// History
var { gameHistory, userGameHistory, History, UserHistory } = require('./history');


//Players
var { _Player, Player } = require('./player');
registry._addType_("players");
idCounters._addType_("player");


//Population
var { gamePopulation, Population, PlayerList, UserPlayerList, InfoPlayerList } = require('./population');


//Information mechanics
var { Information, perfectInformation } = require("./information");


//Playables
var { playableClasses, playableInterfaces } = require('./playables/')
for (var _class in playableClasses) {
	registry._addType_(playableClasses[_class].registryName);
	idCounters._addType_(playableClasses[_class].counterName);
}

//Symbolic Logic
var {
	Variable,
	Expression,
	RandomVariable,
	ComplexVariable
} = require("./logic");


//Strategies
registry._addType_("strategies");
idCounters._addType_("strategy");

var { registerStrategy, registerStrategyObject, Strategies } = require('./strategy');
var { loadStrategy, loadStrategyFolder } = require('./strategy-loader');


// Misc. classes
var { Summary } = require("./summary")
var OutcomeTree = require("./outcomeTree")


//THIS FUNCTION IS ONLY FOR DEBUGGING.
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
	Frontend: {
		Player,
		PlayerList,
		Population,
		'Playables': playableInterfaces,
		registerStrategy,
		registerStrategyObject,
		Strategies,
		loadStrategy,
		loadStrategyFolder,
		History: userGameHistory,
		Queries,
		startREPL, //Should this line be removed when publishing?
		Variable: Variable.creator,
		Expression: Expression.creator,
		RandomVariable: RandomVariable.creator,
		ComplexVariable: ComplexVariable.creator,
		syncMode
	},

	Backend: {
		logger: log,
		State: { registry, idCounters, gameHistory, gamePopulation, perfectInformation },
		Classes: {
			_Player,
			History,
			UserHistory,
			PlayerList,
			UserPlayerList,
			InfoPlayerList,
			Information,
			OutcomeTree,
			PlayableClasses: { ...playableClasses },
			Query,
			QueryResult,
			Summary,
			LogicClasses: {
				Variable,
				Expression,
				RandomVariable,
				ComplexVariable
			}
		},
		HelperFunctions,
		PluginManager,
		registerQueryObject,
		Expose
	}
}

module.exports = Engine;
