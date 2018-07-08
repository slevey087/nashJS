# Exchange

This 2-player game uses the `balance-sheet` plugin to model simple exchanges. Terms of trade are proposed, which players may Accept or Reject. If both players Accept, then balance sheets are updated to reflect the new distribution.

Its arguments are an array of players, an object outlining the terms of trade, and an optional parameters object.

```js
var players = [p1, p2]
var termsOfTrade = {orange:2, apple:-1}
var parameters = {}

var exchange = StockGames["Exchange-Complex"](players, termsOfTrade, parameters)

exchange.play()
```

* `players` - an array of 2 players.
* `termsOfTrade` - an object outlining the terms of trade. More below.
* `parameters` - an optional parameters object. Parameters include:
  * `initialEndowment` - an array of two objects, specifying what each player begins with.
	* `utilityFunctions` - an array of 2 functions specifying the utility of each player. If given, these are used to update scores. More below.
	* `utilityMode:'absolute'` - a string, either "absolute" or "relative" which describes how the utility functions behave. More below.

## Terms Of Trade

The terms of trade should be specified in terms of player 1. That is, if the exchange is that player 1 gives up 1 apple in exchange for 2 oranges from player 2, then the terms of trade would be expressed as `{orange:2, apple:-1}`. The names of these entries ('orange' and 'apple') will be automatically created on the players' balance sheets if they're not already present.

Additionally, players may borrow or lend. For instance, to specify that player 1 should give player 2 an apple in exchange for an IOU, the terms of trade would be `{apple:-1, lend:{IOU:1}}`. For the reverse trade, in which player 1 receives an apply by borrowing from player 2, use `{apple:1, borrow:{IOU:1}}`.

## Utilities

If no utility functions are present, scores will not be updated and only balance sheets will change. If utility functions are given, scores will be updated.

To calculate the utility, the results of the transaction will be passed to each utility function as an array with entries for each distribution that changed. If `utilityMode` is set to "absolute", then the returned value will be assigned to the player's score. If `utilityMode` is set to "relative" then the returned value will be added to the player's original score in order to calculate the new score. (This is to make it easier to write utility functions.)
