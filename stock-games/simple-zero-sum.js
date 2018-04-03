"use strict";

// Game state controller
var {registry} = require("../lib/state");

// Play-time logic
var {Variable, Expression} = require('../lib/logic');


function _SimpleZeroSum(choices, payoffs=[[0,0],[0,0]], parameters){
	
	return function(p1, p2){
		var t1 = Turn([
			Choice(p1,choices[0]), 
			Choice(p2,choices[1])
		], parameters);
		
		var e;
		
		choices[0].forEach(function(choice0,index0){
			choices[1].forEach(function(choice1, index1){
				
				// Set expression
				e = Expression(function(){
					//Return the negative payoff, or zero
					return 0 - registry.turns[t1.id()].payoffsImplicit[choice0][choice1][0] || 0;
				})
				
				//Set payoffs
				t1[choice0][choice1]([payoffs[index0][index1], e]);
			});
		})
		
		return t1;
	}
}



function SimpleZeroSum(p1, p2, choices, payoffs, parameters){
	//TODO: validate all parameters
	
	return _SimpleZeroSum(choices, payoffs, parameters)(p1,p2);
}

module.exports = {_SimpleZeroSum, SimpleZeroSum};