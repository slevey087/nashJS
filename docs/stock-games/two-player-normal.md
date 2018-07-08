# Two-Player Normal

This game skeleton creates a two-player Normal-form game. Its arguments are an array of players, an array of choices, an array of payoffs, and an optional object of parameters. Built using [Normal](./normal.md), it returns a `Turn` _playable_ (composed with `Choice` _playables_).

```js
var players = [p1, p2]
var choices = [["Left", "Right"],["Up", "Down"]]
var payoffs = [[[1,2],[3,4]],[[0,5],[2,6]]]
var parameters = {}

var game = StockGames["Two-Player Normal"](players, choices, payoffs, parameters)

game.play()
```

* `players` - an array of 2 `Players`
* `choices` - an array of choices. This should be an array of two arrays, where the first inner array are the choices available to player 1 and the second inner array are the choices available to player 2.
* `payoffs` - an array of payoffs. The dimensions of this array are determined by the size of the `choice` arrays. The outermost array represents choices available to player 1, the next inner array represents choices available to player 2, and the innermost arrays represent respective payoffs for players 1 and 2. More below.
* `parameters` - an optional parameters object, which will get passed to the `Turn` _playable_ that ultimately gets returned. To pass parameters down to the `Choice` _playables_ within the `Turn`, pass them as `parameters.parameters`.

## Specifying Payoffs

While it may sound confusing, the `payoff` array is designed in such a way that you should be able to read the payoffs right off of a written Normal Form game matrix if you're using one. For instance, for the above example, a typical Normal Form matrix would look like this:

|         |   Up  |  Down  |
|---------|:-----:|:------:|
|**Left** |  1,2  |  3,4   |
|**Right**|  0,5  |  2,6   |

As typical of zero-sum games, the specified payoffs represent the row player's winnings (the column player's losses).

Either player may have more than 2 choices (but there may only be two players).

## Opponent information

Games generated using _Two-Player Normal_ will re-arrange the information passed to players when `.play()` is called. In addition to the usual `.me` and `.population` fields, there will be a `.opponent` field with information on the opposing player. This is to make strategy coding easier for two-player scenarios.
