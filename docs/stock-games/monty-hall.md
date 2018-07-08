# The Monty Hall Problem

The classic [Monty Hall Problem](https://en.wikipedia.org/wiki/Monty_Hall_problem). A game show host shows 3 closed doors. One door has a car behind it, the other two have a goat. The player chooses a door randomly, then the host opens one door to reveal a goat. The player then decides whether to stay with the originally selected door or to switch doors.

Its arguments are a single player, and an optional parameters object. It returns a `Sequence` _playable_ which will execute each step of the game.

```js
var player = p1
var parameters = {}
var game = StockGames["Monty Hall"](player, parameters)

game.play()
```

* `player` - a single _Player_, who will make two choices, first the door to select, then a second door to select.
* `parameters` - optional parameters. These include
  * `numDoors = 3` - the number of doors in the game
  * `numPrizes = 1` - the number of doors with the "prize" (i.e. the car)
  * `numReveals = 1` - the number of doors that the hosts opens during the 'reveal' phase
  * `prize = 5` - the payoff for selecting the door with the prize behind it

This game is conducted in three segments. First, a _Choose_ segment, in which the player chooses an initial door. Next a _Reveal_ segment, in which the hosts strikes a door from the running, followed by a _Second Choice_ phase, where the player gets to choose from a revised list of doors. After the _Second Choice_, the payoff is awarded to the player if they have selected the winning door.

## Strategies

This game comes with two simple strategies. Both strategies will select a door randomly, but `Always Stay` will always choose to stay with that door, while `Always Switch` will randomly select from the remaining doors.
