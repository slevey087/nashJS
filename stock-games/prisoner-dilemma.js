"use strict";

var {Choice, Turn} = require('../core.js').Playables;

module.exports = function(p1,p2, {id="Prisoner-Dilemma"}={}){
	
	
	var c1 = Choice(p1,["Cooperate", "Defect"]);
	var c2 = Choice(p2,["Cooperate", "Defect"]);
	
	var t1 = Turn([c1, c2]);
	
	t1.Cooperate.Cooperate([3,3]);
	t1.Cooperate.Defect([1,4]);
	t1.Defect.Cooperate([4,1]);
	t1.Defect.Defect([2,2]);
	
	
	t1.play()
	
	l1 = Loop(t1,5)
	return t1;
};