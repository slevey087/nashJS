# Rock-Paper-Scissors

This is your classic Rock-Paper-Scissors. Two players, head-to-head, pick from Rock, Paper, or Scissors, at the same time. Paper beats Rock, Rock beats Scissors, Scissors beats Paper.

Its arguments are an array of players, and an optional parameters object. Built using [Simple Zero-Sum](./simple-zero-sum.md), it returns a `Turn` _playable_.

```js
var players = [p1,p2]
var parameters = {}

var game = StockGames["Rock-Paper-Scissors"](players, parameters)

game.play()
```

* `players` - an array of 2 players
* `payoff` - an optional single number representing the payoff for winning. The default value is 1.
* `parameters` - an optional parameters object which will get passed to the `Turn` _playable_.

The default payoff is 1. The player who wins the round will receive the payoff, while the player who loses will receive -payoff. In a tie, both players get zero.

|     | Rock  | Paper | Scissors |
|-----|:---:|:----:|:---:|
|**Rock** |  0  |  -1   | 1 |
|**Paper**|  1  |  0   | -1 |
|**Scissors**| -1 | 1 | 0 |

 To change the payoff, use `parameters.payoff`.
