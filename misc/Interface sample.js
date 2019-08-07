// Defining games

//1 player game

//Define player
player = Player()

//Define choice
choice = Choice(player, ['left', 'right']);

//Define payoffs
choice['left'](4)
choice['right'](2)

//Or
choice.setAllPayoffs([4, 2])


//One player sequence

//Define player
player = Player()


//Define choice 1
c1 = Choice(player, ['left', 'right'])
c2 = Choice(player, ['up', 'down'])(c1)

c1.setAllPayoffs([2, 1])
c2.setAllPayoffs([3, 2])

Game(c1, c2).play()


// Prisoner's dilemma

//Define players
row = Player()
column = Player()

//Define choices
row_choice = Choice(row, ['cooperate', 'defect'])
col_choice = Choice(column, ['cooperate', 'defect'])

//Define a turn
turn1 = Turn([row_choice, col_choice])

//Set payoffs
turn1['cooperate']['defect']([1, 4])
turn1['defect']['defect']([2, 2])
turn1['defect']['cooperate']([4, 1])
turn1['cooperate']['cooperate']([3, 3])

//Or
turn1.setAllPayoffs([
	[
		[3, 3],
		[1, 4]
	],
	[
		[4.1],
		[2.2]
	]
])

//repeat the round
turn2 = turn1.duplicate();
turn2(turn1)

//Or, loop
game = Loop(turn1, 3) // Loop 3 times
//or
game = StochasticLoop(turn1, .1) //Loop with probability .1 of stopping




//Branching

//Define choices
c1 = Choice(row, ['left', 'right'])
c2 = Choice(column, ['cooperate', 'defect'])(c1['left'])
c3 = Choice(column, ['plant early', 'plant late'])(c1['right'])



// Allowing players to select arbitray values
q1 = Query(p1, [0, 5]) // p1 choose a number between 0 and 5

// Branching would be done with an evaluator function, that returns the playable to go to next
// play t2 next if the q1 result is less than 3
t2(q1.outcome(function (value) {
	if (value < 3) return true
}))

// You can assign payoffs when you create a branch
t1 = Turn([q1, q2])
success = t1.outcome(function ([values]) {
	if (values[0] == 7) && (values[1] < 2) return true
})([1, 1])
t2(success)
// You couldn't use tree branching and function branching at the same time,
// but function branching will work where tree branching would

// for player:
function someStrategy() {
	this.choose = function (options, information) {
		// for Choice
	}

	this.query = function (bounds, information) {
		// for Query
	}
}


// Allow named method calling, so that different steps of a game can call particular player functions
c1 = Choice(p1, options, { method: "propose" })
c2 = Choice(p1, options2, { method: "respond" })

function someStrategy() {
	this.propose = function (options, information) { }
	this.respond = function (options, information) { }
}



//Indeterminacy

//Have choices not happen at the same time, with information delivered in between
t1 = StochasticTurn([c1, c2], .4) //40% chance of c1 happening first
t2 = StochasticTurn([c1, c2, c3], [.4, .3]) //40% chance of c1 first, 30% of c2 first


// Have next branch be stochastic
s = Stochastic([.4, .2])
c(s[0])

s1 = Stochastic(t1, [.4, .6])
s2 = Stochastic(t1.left, [.4, .6])
s3 = Stochastic(t1.left.down, [.4, .6])

//Calculations and logic

t1 = * some turn *

	//Define placeholder variable
	v1 = Nash.variable

//Define runtime logic, will be actually computed later
logic = Nash.if((p1.score() > 5), v1.set(4)).else(v1.set(3))(t1)

//or
logic = Lambda(function () {
	if p1.score() > 5 v1.set(4)
	else v1.set(3)
})(t1)

//Run loop with placeholder variable as count, which will be evaluated at runtime
l1 = Loop(c1, v1)(logic)


//Defining strategies

module.exports = function (NASH) {
	function TitForTat() {
		this.name = "Tit for Tat"
		//more metadata here

		this.choose = function (options, information) {
			return choice
		};
	}
	NASH.registerStrategy(TitForTat, 'row')
}


//Display list of strategies
availableStrategies()

//returns an object of the form:
//["Tit For Tat","Punisher","Always Defect"]



//Actually run the game

row.assign(Strategies("Tit For Tat"))
column.assign(availableStrategies()[2])

results = game.play()

//or
results = choice.play()

//or
results = turn.play()


//see score
console.log(row.score())


// using Iterated and stockGames
pdGenerator = StockGames["Prisoner's Dilemma"].createGenerator(parameters)
iPD = Iterated(players, pdGenerator, "Prisoner Dilemma", 49, parameters)
iPD.play()
//or
iPDgenerator = Iterated.createGenerator(pdGenerator, "prisoner", 48, parameters)
iPDgenerator(players, parameters).play()


// iterated prisoner's dilemma stock game
pd = StockGames["Iterated Prisoner's Dilemma"](players, 50, parameters)
pdGenerator = StockGames["Iterated Prisoner's Dilemma"].createGenerator(50)
pdGenerator(players, parameters).play()
