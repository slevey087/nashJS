# Round Robin

This game skeleton generates a Round Robin style tournament from a two-player game. Its arguments are an array of players, a game generator function, and an optional parameters object. It returns a `Sequence` _playable_ which will run the tournament, pitting each player against every other player and recording the scores.

Eg.
```js
var players = [p1, p2, p3, p4, p5]

var numIterations = 10
var gameGenerator = StockGames["Iterated Prisoner's Dilemma"].createGenerator(numIterations)

var parameters = {}

var game = StockGames["Round Robin"](players, gameGenerator, parameters)

game.play()
```

* `players` - an array of _Players_
* `gameGenerator` - a function whose arguments are `(players, parameters)` that returns a _Playable_. These can be created from any `StockGame` using the `.createGenerator` function, or they can be hand-coded.
* `parameters` - an optional parameters object, which will get passed to the returned `Sequence` _playable_. To pass parameters down to the actual game _playable_, use `parameters.parameters`.

At the beginning of each round, the players will be reset.

Each round includes a "Record Scores" phase, which will appear in the game history, containing the scores.
