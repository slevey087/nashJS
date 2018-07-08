# Battle Of The Sexes

This is [Battle of the Sexes](https://en.wikipedia.org/wiki/Battle_of_the_sexes_(game_theory)). A married couple are trying to decide how to spend their evening. The husband would like to go to a Football game, while the wife would like to go to the Opera. If they each go to the Football game, the husband will be happier than the wife. If they each go to the Opera, the wife will be happier than the husband. If they go to different events, neither will be happy.

Its arguments are an array of 2 players and an optional parameters object. Built using [Two-Player Normal](./two-player-normal.md), it returns a `Turn` _playable_.

```js
var players = [p1,p2]
var parameters = {}

var game = StockGames["Battle Of The Sexes"](players, parameters)

game.play()
```

* `players`- an array of 2 players. Player 1 is the wife and player 2 is the husband.
* `parameters` - optional parameters object, which will be delivered to the `Turn` _playable_.

The game uses the following payoff matrix:

|     | Opera  | Football |
|-----|:---:|:----:|
|**Opera** |  2,1  |  0,0   |
|**Football**|  0,0  |  1,2   |
