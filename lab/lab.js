({
	Player,
	_Player,
	gamePopulation,
	Population,
	PlayerList,
	registerStrategy,
	Strategies,
	strategyLoader,
	_expose,
	registry,
	Variable,
	Expression,
	RandomVariable,
	ComplexVariable,
	History,
	Queries,
	excludedPlayers,
	startREPL,
	nhistory,
	Information,
	PerfectInformation,
	PluginManager,
	syncMode
} = require("../index"));
({
	Choice,
	Range,
	Turn,
	Sequence,
	Consecutive,
	Loop,
	StochasticLoop,
	HaltIf,
	StochasticHalt,
	Lambda,
	RandomPlayerChoice,
	PopulationDynamics,
	Simultaneous
} = require("../index").Playables);
StockGames = require("../index").StockGames;



p1 = Player();
p2 = Player();
p3 = Player();
ipd = StockGames["Iterated Prisoner's Dilemma"]([p1, p2], 20)
/*
StockGames["Prisoner's Dilemma"]([p1, p2])

p1.assign("chooseFirst")
p2.assign("randomize");

p3 = Player();
p3.assign("chooseSecond");
p4 = Player();
p4.assign("randomize")

c1 = Choice(p1, ["cooperate", "defect"]);
//c1['left'](5) ;
//c1['right'](2);
c2 = Choice(p2, ["Cooperate", "Defect"]);
//c2['up'](1);
//c2['down'](7);

t2 = Turn([c1, c2]);
t3 = Turn([c1, c2]);
t4 = Turn([c1, c2]);
t5 = Turn([c1, c2]);
s1 = Simultaneous([t2, t3, t4, t5])

c = Consecutive([
	Turn([c1, c2]),
	Turn([c2, c1]),
	Choice(p1, ["cooperate", "defect"]),
	Lambda(function() { console.log("hi") }),
	HaltIf(function() { return true })
])

c3 = RandomPlayerChoice(["cooperate", "defect"]);
c4 = RandomPlayerChoice(["Cooperate", "Defect"]);

t1 = Turn([c3, c4]);

v1 = new Variable(3);

t1.defect.Defect([2, 2]);
t1.defect.Cooperate([4, 1]);
t1.cooperate.Defect([1, 4]);
t1.cooperate.Cooperate([v1, v1]);

L1 = Lambda(function() {
	v1.set(v1 + 1);
});

pd1 = PopulationDynamics(1.5, 1);

h2 = HaltIf(function() {
	return Population().onlyAlive().length == 0;
});

L1(t1);
pd1(L1);
h2(pd1);

//s1 = Sequence(t1, h2);

//l1 = Loop(s1, 10, { logContinue: true });

//console.log(_expose(t1).next)
//console.log(_expose(t1).next.cooperate.Cooperate)

h2 = HaltIf(function() {
	return Population().onlyAlive().length == 0;
});

L2 = Lambda(function() {
	p1.kill();
});

t2(L2);

generatePopulation = function() {
	for (i = 0; i < 30; i++) {
		Player({ assign: "chooseFirst" });
	}
	for (i = 0; i < 30; i++) {
		Player({ assign: "chooseSecond" });
	}
};

function gameGenerator() {
	var t = Turn([
		RandomPlayerChoice(["cooperate", "defect"]),
		RandomPlayerChoice(["Cooperate", "Defect"])
	]);

	t.defect.Defect([2, 2]);
	t.defect.Cooperate([4, 1]);
	t.cooperate.Defect([1, 4]);
	t.cooperate.Cooperate([3, 3]);

	return t;
}
//
//
//

//CE = StockGames["Cultural Evolution"](gameGenerator, 1, {generatePopulation});

//n = StockGames["Two-Player Normal"](p1,p2,[["left","right"],["up","down"]]);
//pd1 = StockGames["Prisoner's Dilemma"]([p1, p2]);
//pd2 = StockGames["Prisoner's Dilemma"]([p3, p4]);

//s = Simultaneous([pd1, pd2])

v2 = Variable(1);

//n = StockGames["Simple Zero-Sum"](p1,p2,[["left","right"],["up","down"]], [[v2,2],[3,4]]);

//rpc = StockGames["Rock-Paper-Scissors"]([p1, p2]);
//t = StockGames["Axelrod Tournament"];
//t = StockGames["Iterated Prisoner's Dilemma"]([p1, p2]);
//The code below is to run the repl for testing purposes.
//var toRepl = {_expose, registry,Player,Choice,Turn,Sequence,Loop,StochasticLoop,HaltIf, StochasticHalt, Lambda, p1,c1,c2,t1};
//startREPL(toRepl);
*/
