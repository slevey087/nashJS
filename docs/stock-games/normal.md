# Normal

This game skeleton creates a Normal-form game. Its arguments are an array of players, an array of choices, an array of payoffs, and an optional object of parameters. It returns a `Turn` _playable_ (composed with `Choice` _playables_).

```js
var players = [p1, p2, p3]
var choices = [["Left", "Right"],["Up", "Down"], ["Forward", "Back"]]
var payoffs = [[[[1,2,3],[2,3,4]],[[0,2,4],[1,3,5]]],[[[2,5,6],[7,2,1]],[[4,3,1],[2,5,3]]]]
var parameters = {}

var game = StockGames["Two-Player Normal"](players, choices, payoffs, parameters)

game.play()
```

* `players` - an array of `Players`
* `choices` - an array of choices. This should be an array of arrays, where the first inner array are the choices available to player 1 and the second inner array are the choices available to player 2, and so on.
* `payoffs` - an array of payoffs. The dimensions of this array are determined by the size of the `choice` arrays. The outermost array represents choices available to player 1, the next inner array represents choices available to player 2, and so on, until the inner-most arrays represent the payoffs to each player if the game reaches that outcome. More below.
* `parameters` - an optional parameters object, which will get passed to the `Turn` _playable_ that ultimately gets returned. To pass parameters down to the `Choice` _playables_ within the `Turn`, pass them as `parameters.parameters`.

## Specifying Payoffs

While it may sound confusing, the `payoff` array is designed in such a way that you should be able to read the payoffs right off of a written Normal Form game matrix if you're using one. For a two-player game with a Normal-form matrix which looked like this

|         |   Up  |  Down  |
|---------|:-----:|:------:|
|**Left** |  1,2  |  3,4   |
|**Right**|  0,5  |  2,6   |

the appropriate code would read
```js
var choices = [["Left", "Right"],["Up", "Down"]]
var payoffs = [[[1,2],[3,4]],[[0,5],[2,6]]]
```

For 3 or more players, the notation simply generalizes into more dimensions. For each additional player, add an inner array of choices and add another dimension of inner arrays of payoffs (as well as an additional actual payoff).


## Strategies

Using this skeleton will automatically load several simple strategies, primarily meant for testing. These are:

* `chooseFirst` - A player using this strategy will always choose the first available option.
* `chooseSecond` - A player using this strategy will always choose the second available option.
* `randomize` - A player using this strategy will choose randomly from the options presented to it, with equal probability. 
