"use strict";

var {_TwoPlayerNormal} = require('./simple-normal');

module.exports = function(p1,p2, {id="Prisoner-Dilemma"}={}){
	
	var parameters = arguments[2] || {id:"Prisoner-Dilemma"};
	var choices = [["Cooperate","Defect"],["Cooperate","Defect"]];
	var payoffs = [[[3,3],[1,4]],[[4,1],[2,2]]];
	
	return _TwoPlayerNormal(choices, payoffs, parameters);
};