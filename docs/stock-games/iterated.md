# Iterated

This game skeletal component is for quickly creating repeating versions of other games, for instance the Iterated Prisoner's Dilemma.

Its arguments are the players, a game generator function, the game name, the number of iterations, and an optional parameters object. It returns a `Loop` _playable_.

```js
var players = [p1,p2]
var pdGenerator = StockGames["Prisoner's Dilemma"].createGenerator()
var gameName = "Prisoner's Dilemma"
var numIterations = 50
var parameters = {}

var ipd = StockGames["Iterated"](players, pdGenerator, gameName, numIterations, parameters)

ipd.play()
```

* `players` - player or players, which will get passed to the game generator
* `gameGenerator` - a function whose arguments are `(players, parameters)` and which returns a _Playable_ of some kind.
* `gameName` - a string with the name of the game. "Iterated-[gameName]" will become the id of the `Loop` _playable_.
* `numIterations` - the number of times to iterate the game. Defaults to 50.
* `parameters` - optional parameters, which will get passed to the `Loop`.
