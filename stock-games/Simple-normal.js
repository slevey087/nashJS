"use strict";

//Game engine
var {Choice, Turn} = require('../lib/engine.js').Playables;

//Backend utility function, meant to be used by other stock-games
function _TwoPlayerNormal(choices, payoffs=null, parameters={}){
	
	return function(p1,p2){
		var t1 = Turn([
			Choice(p1,choices[0]), 
			Choice(p2,choices[1])
		], parameters);
	
		if (payoffs) t1.setAllPayoffs(payoffs);
	
		return t1;
	};
}

//Front end wrapper for the user to quickly define a game.
function TwoPlayerNormal(p1, p2, choices, payoffs=null, parameters={}){
	//TODO: validate all variables
	
	return _TwoPlayerNormal(choices, payoffs, parameters)(p1,p2)
}

module.exports = {_TwoPlayerNormal, TwoPlayerNormal}