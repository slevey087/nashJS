({Player, _Player, _Population, Population, PlayerList, registerStrategy, strategyLoader, _expose, registry, Variable, Expression, gameHistory, excludedPlayers, startREPL, nhistory, Information, PerfectInformation} = require('./index')); 
({Choice, Turn, Sequence, Loop, StochasticLoop, HaltIf, StochasticHalt, Lambda, RandomPlayerChoice, PopulationDynamics, Simultaneous} = require('./index').Playables);
StockGames = require('./index').StockGames;

pd = StockGames["Prisoner's Dilemma"];


//pd = require('./lib/stock-games/prisoner-dilemma');




function chooseFirstOption(){
	
	this.choose = function(options, information){
		console.log("Information is: ", JSON.parse(JSON.stringify(information)));
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



p1 = Player({assign:"chooseFirst"});
//p1.assign("chooseFirst");
p2 = Player();
p2.assign("chooseFirst");
p3 = Player();
p3.assign("chooseSecond");

 c1 = Choice(p1,['cooperate','defect']);
//c1['left'](5) ;
//c1['right'](2);
 c2 = Choice(p2,['Cooperate','Defect']);
//c2['up'](1);
//c2['down'](7);

t2 = Turn([c1,c2])


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

pd1 = PopulationDynamics(1.5,1);

h2 = HaltIf(function(){
	return (Population().onlyAlive().length == 0);
});

L1(t1);
pd1(L1);
h2(pd1)

s1 = Sequence(t1,h2)

l1 = Loop(s1,10,{logContinue:true});

//console.log(_expose(t1).next)
//console.log(_expose(t1).next.cooperate.Cooperate)


h2 = HaltIf(function(){
	return (Population().onlyAlive().length == 0);
});


L2 = Lambda(function(){
	p1.kill();
});

t2(L2);


Pairing = Lambda(function(){
	var pool = Population().onlyAlive();
	var p1 = pool[Math.floor(Math.random()*pool.length)];
	var p2 = pool[Math.floor(Math.random()*pool.length)];
	
	if (p1.score() > p2.score()) p1.assign(p2.strategy());
	else if (p1.score() == p2.score()) null;
	else p2.assign(p1.strategy());
	return [p1.id(),p2.id()];
});

Pairing(t1);
s3 = Sequence(t1, Pairing);
l4 = Loop(s3, 5, {playableParameters:{initializePlayers:true}});


L1 = Lambda(function(){
	console.log("1")
});

L2 = Lambda(function(){
	console.log("2")
});

LA = Lambda(function(){
	console.log("A")
});

LB = Lambda(function(){
	console.log("B")
});

L2(L1);
LB(LA);

s1 = Sequence(L1,L2);
s2 = Sequence(LA, LB);

l1 = Loop(L1,3);
la = Loop(LA,3);

n = StockGames["Two-Player Normal"](p1,p2,[["left","right"],["up","down"]]);
pd = StockGames["Prisoner's Dilemma"](p1,p2);

//The code below is to run the repl for testing purposes. 
var toRepl = {_expose, registry,Player,Choice,Turn,Sequence,Loop,StochasticLoop,HaltIf, StochasticHalt, Lambda, p1,c1,c2,t1};
//startREPL(toRepl);