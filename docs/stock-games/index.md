# Stock Games
nashJS comes pre-programmed with several common games and game skeletons, to save you some time. To access them, first `require` the StockGames object:

```javascript
var StockGames = require('./nashJS').StockGames;
```

Then you can invoke a game by calling its name, for instance:
```javascript
var pd = StockGames["Prisoner's Dilemma"];
```

Most games require some additional arguments, so the command above will invoke a loader function (which must be called with the proper parameters) rather than the `playable` itself. Read the documentation on each stock game for more details.

## Description

To see a description of the game, use `.description()`:

```js
console.log(StockGames["Prisoner's Dilemma"].description());
```


## Strategies

Some games come with pre-build `strategies`. These will get loaded automatically when the game-loader function is called. Assign them in the normal way.

Note that these strategies will only get loaded one time, even if a loader-function is called repeatedly.

## Generators

Game skeletons may require a function which generates a game, for instance so that multiple copies of the same game can be created. Stock games provide an easy way to do this, using the `.createGenerator()` method. `.createGenerator()` returns a function whose arguments are `(players, parameters)` which returns a game _playable_ when called. You can supply arguments to `.createGenerator()` **except** `players`, which it will pass to the game loader.

Here's an example. The Iterated Prisoner's Dilemma stock game takes 3 arguments: an array of players, the number of iterations, and optional parameters, like so:
```js
var players = [p1,p2]
var numIterations = 10
var parameters = {}

var ipd = StockGames["Iterated Prisoner's Dilemma"](players, numIterations, parameters)

ipd.play()
```

To create a generator instead, simply omit players, but pass any other relevant variables:
```js
ipdGenerator = StockGames["Iterated Prisoner's Dilemma"].createGenerator(numIterations, parameters)
```

Now the function `ipdGenerator` can be called and supplied players and parameters, to return the final game:
```js
var ipd = ipdGenerator(players, parameters)
ipd.play()
```
Generators will store any arguments passed to them. In this example, each time `ipdGenerator` is called, it will create a game where `numIterations` is 10. `parameters` that get passed to the generator will get merged with the `parameters` originally passed to `createGenerator()`.


## Stock Game Reference

### Complete Games

* [Matching Pennies](./matching-pennies.md)
* [Monty Hall Problem](./monty-hall.md)
* [Prisoner's Dilemma](./prisoner-dilemma.md)
* [Rock-Paper-Scissors](./rock-paper-scissors.md)

### Game Skeletons

* [Normal](,/normal.md)
* [Two-Player Normal](./two-player-normal.md)
* [Simple Zero Sum](./simple-zero-sum.md)
* [Iterated](./iterated.md)
* [Round Robin](./round-robin.md)
