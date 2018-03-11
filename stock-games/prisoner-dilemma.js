"use strict";

var {Choice, Turn} = require('../lib/engine.js').Playables;

module.exports = function(p1,p2, {id="Prisoner-Dilemma"}={}){
	
	var t1 = Turn([
		Choice(p1,["Cooperate", "Defect"]), 
		Choice(p2,["Cooperate", "Defect"])
	], {
		id:id
	});
	
	t1.Cooperate.Cooperate([3,3]);
	t1.Cooperate.Defect([1,4]);
	t1.Defect.Cooperate([4,1]);
	t1.Defect.Defect([2,2]);
	
	return t1;
};