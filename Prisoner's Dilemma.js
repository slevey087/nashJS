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
	gameHistory,
	excludedPlayers,
	startREPL,
	nhistory,
	Information,
	PerfectInformation
} = require("./index"));
({
	Choice,
	Turn,
	Sequence,
	Loop,
	StochasticLoop,
	HaltIf,
	StochasticHalt,
	Lambda,
	RandomPlayerChoice,
	PopulationDynamics,
	Simultaneous
} = require("./index").Playables);
StockGames = require("./index").StockGames;

rr = StockGames["Round Robin"];

function chooseFirstOption() {
	this.choose = function(options, information) {
		return options[0];
	};
}
registerStrategy(chooseFirstOption, "chooseFirst");

function chooseSecondOption() {
	this.choose = function(options) {
		return options[1];
	};
}
registerStrategy(chooseSecondOption, "chooseSecond");

function randomize() {
	this.choose = function(options, information) {
		var num = Math.floor(Math.random() * options.length);
		return options[num];
	};
}
registerStrategy(randomize, "randomize");

p1 = Player({ assign: "chooseFirst" });

p2 = Player();
p2.assign("randomize");
p3 = Player();
p3.assign("chooseSecond");

c1 = Choice(p1, ["cooperate", "defect"]);
//c1['left'](5) ;
//c1['right'](2);
c2 = Choice(p2, ["Cooperate", "Defect"]);
//c2['up'](1);
//c2['down'](7);

t2 = Turn([c1, c2]);

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

s1 = Sequence(t1, h2);

l1 = Loop(s1, 10, { logContinue: true });

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
pd = StockGames["Prisoner's Dilemma"];

v2 = Variable(1);

//n = StockGames["Simple Zero-Sum"](p1,p2,[["left","right"],["up","down"]], [[v2,2],[3,4]]);

rpc = StockGames["Rock-Paper-Scissors"]([p1, p2]);
t = StockGames["Axelrod Tournament"];
//t = StockGames["Iterated Prisoner's Dilemma"]([p1, p2]);
//The code below is to run the repl for testing purposes.
//var toRepl = {_expose, registry,Player,Choice,Turn,Sequence,Loop,StochasticLoop,HaltIf, StochasticHalt, Lambda, p1,c1,c2,t1};
//startREPL(toRepl);