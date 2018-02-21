// Defining games

//1 player game

	//Define player
	player = Player()

	//Define choice
	choice = Choice(player,['left','right']);
	
	//Define payoffs
	choice['left'](4)
	choice['right'](2)

	//Or 
	choice.setAllPayoffs([4,2])
	

//One player sequence

	//Define player
	player = Player()


	//Define choice 1
	c1 = Choice(player,['left','right'])
	c2 = Choice(player,['up','down'])(c1)
	
	c1.setAllPayoffs([2,1])
	c2.setAllPayoffs([3,2])
	
	Game(c1,c2).play()
	

// Prisoner's dilemma
	
	//Define players
	row = Player()
	column = Player()
	
	//Define choices
	row_choice = Choice(row, ['cooperate', 'defect'])
	col_choice = Choice(column, ['cooperate','defect'])
	
	//Define a turn
	turn1 = Turn([row_choice,col_choice])
	
	//Set payoffs
	turn1['cooperate']['defect']([1,4])
	turn1['defect']['defect']([2,2])
	turn1['defect']['cooperate']([4,1])
	turn1['cooperate']['cooperate']([3,3])
	
	//Or
	turn1.setAllPayoffs([[[3,3],[1,4]],[[4.1],[2.2]]])
	
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
	c2 = Choice(column, ['cooperate','defect'])(c1['left'])
	c3 = Choice(column, ['plant early','plant late'])(c1['right'])
	

	
//Indeterminacy
	
	//Have choices not happen at the same time, with information delivered in between
	t1 = StochasticTurn([c1,c2],.4)   		//40% chance of c1 happening first
	t2 = StochasticTurn([c1,c2,c3],[.4,.3])	//40% chance of c1 first, 30% of c2 first
	

//Calculations and logic

	t1 = *some turn*
	
	//Define placeholder variable
	v1 = Nash.variable
	
	//Define runtime logic, will be actually computed later
	logic = Nash.if((p1.score() > 5), v1.set(4)).else(v1.set(3))(t1)
	
	//or
	logic = Lambda(function(){
		if p1.score() > 5 v1.set(4)
		else v1.set(3)
	})(t1)
	
	//Run loop with placeholder variable as count, which will be evaluated at runtime
	l1 = Loop(c1,v1)(logic)
	
	
//Defining strategies

module.exports = function(NASH)	{
	function TitForTat() {
		this.name = "Tit for Tat"
		//more metadata here
		
		this.choose = function(options, information){
			return choice
		};
	}
	NASH.registerStrategy(TitForTat,'row')
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

