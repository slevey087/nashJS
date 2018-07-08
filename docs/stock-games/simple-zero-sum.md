# Simple Zero-Sum

This game skeleton creates a two-player zero-sum game. Its arguments are an array of players, an array of choices, and an array of payoffs, and optional parameters. Built using [Two-Player Normal](./two-player-normal.md), it returns a `Turn` _playable_ (composed of multiple `Choice` _playables_).

```js
var players = [p1, p2]
var choices = [["Left", "Right"],["Up", "Down"]]
var payoffs = [[1,2],[3,4]]
var parameters = {}

var game = StockGames["Simple Zero-Sum"](players, choices, payoffs, parameters)

game.play()
```

* `players` - an array of 2 `Players`
* `choices` - an array of choices. This should be an array of two arrays, where the first inner array are the choices available to player 1 and the second inner array are the choices available to player 2.
* `payoffs` - an array of payoffs. The dimensions of this array are determined by the size of the `choice` arrays. Elements in the outer array represents choices available to player 1 and elements in the inner arrays represent choices available to player 2. More below.
* `parameters` - an optional parameters object, which will get passed to the `Turn` _playable_ that ultimately gets returned. To pass parameters down to the `Choice` _playables_ within the `Turn`, pass them as `parameters.parameters`.

## Specifying Payoffs

While it may sound confusing, the `payoff` array is designed in such a way that you should be able to read the payoffs right off of a written Normal Form game matrix if you're using one. For instance, for the above example, a typical Normal Form matrix would look like this:

|     | Up  | Down |
|-----|:---:|:----:|
|**Left** |  1  |  2   |
|**Right**|  3  |  4   |

As typical of zero-sum games, the specified payoffs represent the row player's winnings (the column player's losses).

Either player may have more than 2 choices (but there may only be two players).
