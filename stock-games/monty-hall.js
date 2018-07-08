"use strict"

// NashJS engine components
var Engine = require("../lib/engine");

// Playables
var { Choice, Lambda } = Engine.Frontend.Playables;

// logic
var { Variable, ComplexVariable } = Engine.Frontend

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");


var MontyHall = gameWrapper(function(player, parameters = {}) {
	parameters.id = parameters.id || "Monty-Hall"
	var numDoors = parameters.numDoors || 3;
	var numPrizes = parameters.numPrizes || 1;
	var numReveals = parameters.numReveals || 1;
	var prize = parameters.prize || 5;

	// Allow array or single player
	if (Array.isArray(player)) player = player[0]

	//Generate list of doors
	var doors = [];
	for (var i = 0; i < numDoors; i++) {
		doors.push("Door " + i.toString())
	}

	var Choose = Choice(player, doors, { id: "Choose" });


	var prizes
	var scores = Array.apply(null, Array(doors.length)).map(function() {
		return Variable(0)
	})

	//Need to set this here in order for scoring to work
	var doors2 = ComplexVariable(doors.slice());

	var Reveal = Lambda(function({ history }) {

		// Re-initialize payoffs.
		prizes = []
		for (var i = 0; i < scores.length; i++) {
			scores[i].set(0)
		}

		// What door did the player open?
		var playerChoice = history.log.query("$[choice='" + Choose.id() + "'][-1]").result // TODO does this work?

		// Select which doors have prizes
		var revealFrom = doors.slice(); // Copy the doors list
		for (var i = 0; i < numPrizes; i++) {
			var prizeIndex = Math.floor(Math.random() * revealFrom.length) // Select a door from the doors copy
			prizes.push(revealFrom[prizeIndex]) // Add the prize to the lists
			scores[prizeIndex].set(prize) // Set payoffs appropriately
			revealFrom.splice(prizeIndex, 1) // Remove the prized door from the doors copy, so that we don't select it more than once
		}

		//Remove player choice from doors copy
		var playerChoiceIndex = revealFrom.indexOf(playerChoice)
		if (playerChoiceIndex > -1) revealFrom.splice(playerChoiceIndex, 1)

		// Choose doors to reveal
		var reveal = [];
		for (var i = 0; i < numReveals; i++) {
			reveal.push(revealFrom[Math.floor(Math.random()) * revealFrom.length])
		}

		// Copy doors list to send onward, then remove the revealed doors from list
		doors2.set(doors.slice()); // Need to set this here so revealing to work
		for (var i = 0; i < reveal.length; i++) {
			let index = doors2.indexOf(reveal[i])
			doors2().splice(index, 1)
		}

		return reveal.length == 1 ? reveal[0] : reveal;
	}, { id: "Reveal" })

	var SecondChoice = Choice(player, doors2, { id: "Stay-or-Switch", usePayoffs: true });
	SecondChoice.setAllPayoffs(scores)

	Reveal(Choose)
	SecondChoice(Reveal)

	return Sequence(Choose, SecondChoice, parameters);
}, {

	strategyLoader() {
		return [{
				name: "alwaysSwitch",
				description: "Randomly select a door. Then, always switch to a different one.",

				strategy: function alwaysSwitch() {

					this.door = null;

					this.choose = function(options, information) {
						var choice
						if (this.door) {
							options.splice(options.indexOf(this.door), 1)
							this.door = null;
							choice = options[Math.floor(Math.random() * options.length)]
						} else {
							choice = options[Math.floor(Math.random() * options.length)]
							this.door = choice
						}

						return choice
					}
				}
			},
			{
				name: "alwaysStay",
				description: "Randomly select a door. Then, always stay with that door.",

				strategy: function alwaysStay() {
					this.door = null;

					//TODO add strategy description feature
					this.choose = function(options, information) {
						var choice
						if (this.door) {
							choice = this.door
							this.door = null;

						} else {
							choice = options[Math.floor(Math.random() * options.length)]
							this.door = choice
						}

						return choice
					}
				}
			}
		]
	}
})

module.exports = MontyHall
