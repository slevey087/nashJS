"use strict";

/*

The export is declared first to allow for circular dependence. The final object should look like this:

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
			_PlayerList,
			PlayerList,
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


Try to keep this comment up to date!!

*/

var Engine = {
	Frontend: {},
	Backend: {
		Classes: {},
		State: {}
	}
};
module.exports = Engine;

// Save some typing
var f = Engine.Frontend;
var b = Engine.Backend;



// ---------- Start Your Engine! --------- \\



// Load settings information
var Settings = require("../settings");
// object for user to change settings
function settings(setting, value) {
	// TODO: validate user input
	Settings[setting] = value
}


//Logging
var log = require("./logger");
log.setLevel(Settings["init-log-level"]);
b.logger = log;

log("info", "Starting NashJS");


// Start plug-in manager
log("debug", "Loading plugin manager")
b.PluginManager = require("./plugin-manager");


//Game state controllers
log("debug", "Loading game state controllers.");
var { registry, idCounters } = require('./state');
registry.Settings = Settings
b.State.registry = registry
b.State.idCounters = idCounters


// Helper function loader
log("debug", "Loading HelperFunction loader");
var HelperFunctions = require('./helper-functions');
b.HelperFunctions = HelperFunctions;


// Sync mode
log("debug", "Loading sync mode controller");
var { syncMode } = HelperFunctions("state")
syncMode(Settings["init-sync-mode"]);
f.syncMode = syncMode;


// Query language and shortcuts
log("debug", "Loading Query processors");
var { Queries, Query, QueryResult, evaluateQuery, registerQueryObject } = require("./query");
f.Queries = Queries;
b.Classes.Query = Query;
b.Classes.QueryResult = QueryResult;
b.registerQueryObject = registerQueryObject;


// History
log("debug", "Loading History");
({
	gameHistory: b.State.gameHistory,
	userGameHistory: f.History,
	History: b.Classes.History,
	UserHistory: b.Classes.UserHistory
} = require('./history'));


//Players
log("debug", "Loading Player class");
({
	_Player: b.Classes._Player,
	Player: f.Player
} = require('./player'));
registry._addType_("players");
idCounters._addType_("player");


//Population
log("debug", "Loading Population classes");
({
	gamePopulation: b.State.gamePopulation,
	Population: f.Population,
	_PlayerList: b.Classes._PlayerList,
	PlayerList: f.PlayerList,
	PlayerList: b.Classes.PlayerList,
	InfoPlayerList: b.Classes.InfoPlayerList
} = require('./population'));


//Information mechanics
log("debug", "Loading Information mechanics");
({
	Information: b.Classes.Information,
	perfectInformation: b.State.perfectInformation
} = require("./information"));

// Misc. classes
log("debug", "Loading Misc. classes");
({ OutcomeTree: b.Classes.OutcomeTree } = require("./outcomeTree"));
({ Summary: b.Classes.Summary } = require("./summary"));

//Playables
log("debug", "Loading Playables");
var { playableClasses, playableInterfaces } = require('./playables/')
for (var _class in playableClasses) {
	registry._addType_(playableClasses[_class].registryName);
	idCounters._addType_(playableClasses[_class].counterName);
}
b.Classes.PlayableClasses = playableClasses
f.Playables = { ...playableInterfaces }


//Symbolic Logic
log("debug", "Loading Play-time Logic");
var LogicClasses = require("./logic");
b.Classes.LogicClasses = LogicClasses
f.Variable = LogicClasses.Variable.creator
f.Expression = LogicClasses.Expression.creator
f.RandomVariable = LogicClasses.RandomVariable.creator
f.ComplexVariable = LogicClasses.ComplexVariable.creator


//Strategies
log("debug", "Loading Strategy loader");
registry._addType_("strategies");
idCounters._addType_("strategy");

({
	registerStrategy: f.registerStrategy,
	registerStrategyObject: f.registerStrategyObject,
	Strategies: f.Strategies
} = require('./strategy'));
({
	loadStrategy: f.loadStrategy,
	loadStrategyFolder: f.loadStrategyFolder
} = require('./strategy-loader'));



log("debug", "Loading Misc functions");

//THIS FUNCTION IS ONLY FOR DEBUGGING.
b.Expose = function (interfacePlayable) {
	return registry.playables[interfacePlayable.id()];
}


f.startREPL = function (toREPL) {
	var repl = require("repl");

	var replServer = repl.start({
		prompt: "Nash >> "
	});

	Object.assign(replServer.context, toREPL);
}

log("silly", "nashJS engine loading complete!");

