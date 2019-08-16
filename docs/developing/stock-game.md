# Creating a Stock Game

One way to extend `nashJS` is to create a stock game. Stock games are simply the games that `nashJS` comes pre-loaded with. However, `nashJS` provides some machinery to make creating stock games easier.

You can place your stock game in the ./stock-games folder, and require the base class... TODO: clarify here

The base `StockGame` class is meant to help you generate your game while doing much of the work for you. It is created in the following manner:
```js
var myGame = new StockGame(builder, parameters)
```
* `builder` - a function which builds the game; must return a _playable_.
* `parameters={}` - optional arguments, which include
    * `argumentValidator: function(){return true}` - a function to validate arguments given by the user. It will be callled with the user arguments when the game is generated. It should return true if the arguments are valid, or return a string with an error message if not.
    * `combineParameters: true` - if true, then parameters will be combined when using `.createGenerator` (see below)
    * `description: "No description given."` - a string description of the game or instructions.
    * `strategyLoader` - a function which returns an object of strategies.
    * `queries` - an object of query shortcuts to register. 

The most critical piece is the builder function, which should return the full-fledged game _playable_. The arguments of this function are very particular. The first argument must be an array of `players` which are the players in the game. The last argument must be an object of optional `parameters` (even if there are none). In between, there can be any number of additional required arguments. The arguments for your builder must take this order, or else the `.createGenerator` function, as explained below, will not work properly.

Note: unless you really want to make all the decisions for the user, it is highly recommended that you provide a channel for the user to pass parameters to your final _playable_, which can be as simple as passing the `parameters` object straight to your _playable_. You _may_ also want to allow for parameters to be passed to any sub-_playables_, possible in a `parameters.parameters` field. This will depend on your application.

Here's a simple example that does both:
```js
var myGame = new StockGame(function(players, someArg1, someArg2, parameters={}){
    var c1 = Choice(players[0],["Left","Right"], parameters.parameters)
    var c2 = Choice(players[1],["Forward","Back"], parameters.parameters)

    var game = Turn([c1,c2], parameters)
    return game;
}, {
    description:"If you can dodge a wrench you can dodge a ball."
})

module.exports = myGame
```
You must then hand-code the `require` for your game into the ./stock-games/index.js file.

Your game will not be generated until the user runs the builder by supplying the arguments. That is,
```js
var players = // an array of players
var myArg1, myArg2, parameters // other arguments
var game = NASH.StockGames["myGame"](players, myArg1, myArg2, parameters) // builds the game 

game.play()
```

## Strategies

You can pre-build strategies for your game using the `strategyLoader` so that the user doesn't have to hand-code common ones. These will be packaged with your game, and won't be loaded until the game is built for the first time. A strategy loader is a function that returns an object of strategies, as described in the [strategy design guide](../strategy-design.md) (Note: you do not need to run the `registerStrategyObject` function, as the `StockGame` class will run it for you with whatever you return from your `strategyLoader`.) Eg.

```js
var builder = // function to build the game
var myGame = new StockGame(builder, {
    strategyLoader: function() {
		return [{
			strategy: function chooseFirst() {
				this.choose = function(choices, information) {
					return choices[0]
				}
			},
			name: "Choose First",
			description: "Always choose first available option."
		}]
    }
)
```

## Queries

You can pre-build some [query](../components/queries.md) shortcuts to help your users navigate the history of your game, such as to quickly extract important results. As a reminder, all query shortcuts must begin with `@`. A good convention is for the first few characters after the `@` to be an identifier for your game, followed by a dash, then the name of the particular query. For instance, here are the queries for the [Iterated Prisoner's Dilemma](../stock-games/iterated-prisoner-dilemma.md):

```js
parameters = {
    queries: [{
			shortcut: "@IPD-choices",
			query: "$map($.[action].results, function($l){$l.result})",
			description: "Results, organized by round."
		},
		{
			shortcut: "@IPD-players",
			query: "$map($.[action].results, function($l){$l.player})",
			description: "Players, organized by round."
		},
		{
			shortcut: "@IPD-payouts",
			query: "$.action.payouts",
			description: "Payouts, as array of objects."
		}
    ]
}
```
These queries will not be loaded until the user runs your builder, just as with strategies. One difference with strategies is that the `strategyLoader` is a function that returns an object, while `queries` is just an object. 

## Argument Validation

This is just a little optional shortcut to help with argment validation. Your `argumentValidator` will be fed with all the arguments passed to the `builder`, and should return `true` if all is well, or return a string with an error message if not. The default value is a function which always returns `true`.

## .createGenerator

Sometimes stock games are meant to be nested. For instance, [Iterated](../stock-games/iterated.md) is meant for quickly building repeated stock games from a stage stock game. Because the stage game must be passed along before it is actually built, we need a way to partially build it, so that we can dictate the necessary settings *before* the user provides players and builds the game.

For that we can use `.createGenerator`. This is a method in the `StockGame` prototype. You can call it with arguments that you'd like to store, where the last one is the optional `parameters` object. It will return a new `stockGame`, which will accept just 2 arguments, `players`, and `parameters`. Any arguments in between will use their stored values from when `.createGenerator` was called. 

An example will help. Suppose we want to used `Iterated` and [`Simple Zero Sum`](../stock-games/simple-zero-sum.md) to create a repeated game. `Simple Zero Sum` takes 3 required arguments (`players`, `choices`, `payoffs`) and the optional `parameters`. We need to set `choices` and `payoffs` argumennt before we pass it off to `Iterated`, which can then create a `stockGame` that only needs `players` and `parameters`.
```js
// base game
var SimpleZeroSum = require("./simple-zero-sum").SimpleZeroSum;
var Iterated = require("./iterated")

var choices = // a matrix of choices
var payoffs = // a matrix of payoffs
var parameters = // optional parameters

var stageGame = SimpleZeroSum.createGenerator(choices, payoffs, parameters)

var players = // an array of players to play the actual game
var parameters = // these parameters will get merged into the original if combineParameters is true
var repeatedGame = Iterated(players, stageGame, parameters)

repeatedGame.play()
```
This way, none of the game will get built until `Iterated` is called. 

To give one more example, the code for the [Iterated Prisoner's Dilemma](../stock-games/iterated-prisoner-dilemma.md) essentially looks like this:

TODO: finish this

```js

```


