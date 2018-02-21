var {Player,registerStrategy} = require('./core');
var {Choice, Turn, Loop, StochasticLoop} = require('./core').Playables;


function chooseFirstOption(){
	
	this.choose = function(options){
		console.log("made it to choosing");
		return options[0];};
}
registerStrategy(chooseFirstOption, "chooseFirst");


var p1 = Player();
var p2 = Player();
p1.assign("chooseFirst");
p2.assign("chooseFirst");
var c1 = Choice(p1,['cooperate','defect']);
//c1['left'](5);
//c1['right'](2);
var c2 = Choice(p2,['cooperate','defect']);
//c2['up'](1);
//c2['down'](7);
c2(c1); 
var t1 = Turn([c1,c2])
t1.defect.defect([2,2])
t1.defect.cooperate([4,1])
t1.cooperate.defect([1,4])
t1.cooperate.cooperate([3,3])