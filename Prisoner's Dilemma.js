({Player,registerStrategy, strategyLoader, _expose, registry, Variable, gameHistory, excludedPlayers, startREPL} = require('./core'));
({Choice, Turn, Sequence, Loop, StochasticLoop, HaltIf, StochasticHalt, Lambda, RandomPlayerChoice} = require('./core').Playables);

pd = require('./stock-games/prisoner-dilemma');

function chooseFirstOption(){
	
	this.choose = function(options){
		console.log("made it to choosing");
		return options[0];};
}
registerStrategy(chooseFirstOption, "chooseFirst");

function chooseSecondOption(){
	
	this.choose = function(options){
		console.log("second choice");
		return options[1];
	}
}
registerStrategy(chooseSecondOption, "chooseSecond");



p1 = Player();
p1.assign("chooseFirst");
p2 = Player();
p2.assign("chooseFirst");
p3 = Player();
p3.assign("chooseSecond");

 c1 = Choice(p1,['cooperate','defect']);
//c1['left'](5);
//c1['right'](2);
 c2 = Choice(p2,['Cooperate','Defect']);
//c2['up'](1);
//c2['down'](7);


c3 = RandomPlayerChoice(['cooperate','defect']);
c4 = RandomPlayerChoice(['Cooperate','Defect']);

 t1 = Turn([c3,c4])

 v1 = new Variable(3);

t1.defect.Defect([2,2])
t1.defect.Cooperate([4,1])
t1.cooperate.Defect([1,4])
t1.cooperate.Cooperate([v1,v1])

L1 = Lambda(function(){
	v1.set(v1 + 1);
});

h1 = StochasticHalt(.3,{logContinue:true});

h1(t1);
L1(h1);

s1 = Sequence(t1,L1)

l1 = StochasticLoop(s1,.5,{logContinue:true});

//console.log(_expose(t1).next)
//console.log(_expose(t1).next.cooperate.Cooperate)



//The code below is to run the repl for testing purposes. 
var toRepl = {_expose, registry,Player,Choice,Turn,Sequence,Loop,StochasticLoop,HaltIf, StochasticHalt, Lambda, p1,c1,c2,t1, l1, s1, L1};
//startREPL(toRepl);