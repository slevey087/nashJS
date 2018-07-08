# The Axelrod Tournament

Modeled after the [Axelrod Tournament](http://journals.sagepub.com/doi/abs/10.1177/002200278002400101), this creates a [Round Robin](./round-robin.md) of the [Iterated Prisoner's Dilemma](./iterated-prisoner-dilemma.md), to test various strategies.

Its arguments are an optional array of players and an optional array of parameters, and it returns a `Loop` _playable_.

```js
var players = []
var parameters = {}

var AT = StockGames["Axelrod Tournament"](players, parameters)

AT.play()
```

* `players` - an optional array of players. This is only used if the `generatePlayers` parameter is set to false.
* `parameters` - an optional array of parameters:
  * `generatePlayers: true` - If true, the loader function will create a population of players for the tournament, based on available strategies.
	* `gameLength: 200` - the number of iterations in the Prisoner's Dilemma.
	* `repeats: 5` - the number of times to loop the Round Robin.

If `generatePlayers` is left `true`, then the loader function will generate 2 players for each registered strategy (one to play each other and one to play itself). If `generatePlayers` is changed to `false`, then the loader will use the `players` supplied in the optional argument. If no players are supplied, then the loader will use any alive and available players.
