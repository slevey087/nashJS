"use strict";

var log = require('../logger');

//External dependency
var poisson = require('randgen').rpoisson;

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {isFunction}	= require('../helperFunctions')("general");
var {idHandler} 	= require('../helperFunctions')("state");

//Parent class
var {_Playable, Playable} = require('./playable');

//Player controllers
var {_Player, Player} = require('../player');
var {PlayerList, UserPlayerList, _Population, Population} = require('../population');

//Update this each time .play is called, but leave it available to the whole scope so that 
//growth and decay can access it
var population;

//Default growth function
var growthDefault = function growth(player, population, birthRate, selectiveMultiplier) {
	var score = player.score;
	var mean = population.scoresMean();
	var std = population.scoresStd();
	
	var Z = !(isNaN(std) || std==0) ? (score-mean)/std : 0
	
	console.log(score, mean, std,Z);
	
	var rate = birthRate + selectiveMultiplier*Z;

	var generated = poisson(rate);
	log("silly","growthDefault: generated random number " + generated.toString()+ " using rate "+ rate.toString());
	
	return generated;
}

//Default decay function
var decayDefault = function decay(player, population, deathRate, selectiveMultiplier) {
	var score = player.score;
	var mean = population.scoresMean();
	var std = population.scoresStd();
	
	console.log(score, mean, std);
	
	var Z =  !(isNaN(std)||std==0) ? (score-mean)/std : 0;
	
	console.log(Z)
	var rate = deathRate - selectiveMultiplier*Z;
	
	var generated = poisson(rate);
	log("silly","decayDefault: generated random number " + generated.toString()+ " using rate "+ rate.toString());
	return generated;
}



//Backend function class for PopulationDynamics
function _PopulationDynamics(id, birthRate,deathRate, {growthFunction=growthDefault, decayFunction=decayDefault, selectiveMultiplier= .5, playerParameters={}}={}){
	_Playable.call(this,id);
	
	pd = this;
	
	this.birthRate = birthRate;
	this.deathRate = deathRate;
	this.selectiveMultiplier = selectiveMultiplier;
	
	//Wrap the growth and decay functions, so that the user doesn't have to worry about calling this.birthRate or this.deathRate
	this.growth = function(player){
		log("silly","_pd.growth: Checking grow condition");
		return growthFunction(player, population, pd.birthRate, pd.selectiveMultiplier)
	};
	this.decay = function(player){
		log("silly","_pd.decay: Checking decay condition");
		return decayFunction(player, population, pd.deathRate, pd.selectiveMultiplier);
	};
	
	this.playerParameters = playerParameters;
	
	registry.controllers[id] = this;
}
_PopulationDynamics.prototype = Object.create(_Playable.prototype);


_PopulationDynamics.registryName = "controllers";
_PopulationDynamics.counterName = "populationDynamics";


_PopulationDynamics.prototype.play = function({initializePlayers=false, shortCircuit=false, history=gameHistory}={}){
	
	var pd = this;
	
	var births = 0;
	var deaths = 0;
	
	//Update population using whoever's alive currently
	population = _Population().onlyAlive();
		
	
	//Kill cycle
	var killed = new PlayerList([]);
	population.forEach(function(player){
		// If the decay function is returns truthy, kill.
		
		if (pd.decay(player)) {
			log("silly","must kill...")
			player.kill();
			deaths++;
			killed.push(player);
			log("silly","dead");
		}
		
		
	});
	
	//Update update again to prevent the recently deceased from reproducing
	population = _Population().onlyAlive();
	
	if (population.length == 0) {
		//Everybody's dead. Let's wrap it up.
		var reason = {result:"Population Collapse", playable:pd};
		history.end();
		return Promise.resolve(reason);
	}
	
	//Birth cycle
	var born = new UserPlayerList([]);
	population.forEach(function(player){
		//Birth whatever number is returned
		var numBirth = pd.growth(player)
		console.log(numBirth);
		for (var i=1; i<=numBirth; i++){
			log("silly", "Player " + player.id +" giving birth!");
			
			var playerParameters = Object.assign({},{
					assign:player.strategy ? player.strategy._id : "",
					parent:player.id}
				,pd.playerParameters);
			
			born.push(Player(playerParameters));
		}	
	});
	
	
	var result = {births, deaths};
	
	var resultObject = {
		result,
		'playable':pd,
		historyEntry:{
			populationDynamics:pd.id,
			result
		}
	};
	
	return Promise.resolve(resultObject);
};



function PopulationDynamics(birthRate=.05, deathRate = .05, parameters={}){
	var id = idHandler(parameters.id,"populationDynamics")
	
	if (parameters.growth && !isFunction(growth)) log("error",id + ": growth should be a function.");
	if (parameters.decay && !isFunction(decay))   log("error",id + ": decay should be a function.");
		
	//Create backend lambda object
	var _pd = new _PopulationDynamics(id, birthRate, deathRate, parameters);
	
	
	//Return this reference object to the user. Run the function to select a source
	var pd = Playable(_pd);	
	return pd;	
}


module.exports = {_PopulationDynamics, PopulationDynamics};