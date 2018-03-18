"use strict";

var {_TwoPlayerNormal} = require('./simple-normal');
var {Variable, Expression} = require('../lib/logic');

module.exports = function(p1,p2, {id="Prisoner-Dilemma", payoffScale=Variable(1), payoffSpread=Variable(4)}={}){
	
	//TODO: fix the case of negative scale.
	
	var lowerMiddle = Expression(function(){
		return payoffScale * (1 + (payoffSpread - 1) * 1/3)
	})
	var upperMiddle = Expression(function(){
		return payoffScale * (1 + (payoffSpread - 1) * 2/3);
	})
	var upper = Expression(function(){
		return payoffScale * payoffSpread;
	})

	// Pass along parameters, be sure to include id.
	var parameters = arguments[2] || {};
	parameters.id = parameters.id || id;
	
	var choices = [["Cooperate","Defect"],["Cooperate","Defect"]];
	var payoffs = [[[upperMiddle,upperMiddle],[payoffScale,upper]],[[upper,payoffScale],[lowerMiddle,lowerMiddle]]];
	
	
	return _TwoPlayerNormal(choices, payoffs, parameters)(p1,p2);
};