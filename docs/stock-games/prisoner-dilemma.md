# Prisoner's Dilemma

The classic [Prisoner's Dilemma](https://en.wikipedia.org/wiki/Prisoner%27s_dilemma). Its arguments are an array of players and an optional parameters object. Built using [Two-Player Normal](./two-player-normal.md), it returns a `Turn` _playable_.

```js
var players = [p1,p2]
var parameters = {}
var game = StockGames["Prisoner's Dilemma"](players, parameters)

game.play()
```

* `players` - an array of 2 _Players_
* `parameters` - an optional array of parameters, which will get passed on to the returned `Turn` _playable_

The Prisoner's Dilemma requires 4 payoffs: a Reward for mutual cooperation, a Temptation to defect, a Punishment for mutual defection, and a Sucker's prize for cooperating when your opponent defects.

|     | Cooperate  | Defect |
|-----|:---:|:----:|
|**Cooperate** |  R,R  |  S,T   |
|**Defect**|  T,S  |  P,P   |

These must be chosen such that T > R > P > S, and 2R > T + S if the game is going to be iterated. The default values are [1,2,3,4], but you can select different values by providing a `parameters.payoffs`, an array of 4 numbers. (The loader function will sort the numbers for you).
