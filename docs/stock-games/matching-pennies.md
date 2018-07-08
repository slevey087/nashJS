# Matching Pennies

The Matching Pennies game. Two players select between "Heads" or "Tails." If both players choose the same, then Player 1 wins. If they choose differently, then Player 2 wins.

Its arguments are an array of players and an optional object of parameters. Built on [Simple Zero-Sum](./simple-zero-sum.md), it returns a `Turn` _playable_.

```js
var players = [p1, p2]
var parameters = {}

var game = StockGames["Matching Pennies"](players, parameters)

game.play()
```

* `players` - an array of 2 _Players_
* `parameters` - an optional object of parameters, which will get passed to the `Turn` _playable_.


The default payoff for winning is 1, and the payoff for losing is `-payoff`. The payoff matrix therefore is:

|      |Heads|Tails |
|------|:---:|:----:|
|**Heads** |  1  |  -1   |
|**Tails** |  -1  |  1   |

 To change the default value, set `parameters.payoff`.
