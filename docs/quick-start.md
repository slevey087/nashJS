# nashJS Quick-Start

This guide contains a broad overview of how to use `nashJS`. It might be sufficient for very simple uses, but it is generally meant to be suplimented with the additional, more specific documentation.

## First Steps

If you haven't already, install `nashJS` and import the parts you'll need. See the [readme](../README.md) for more on this. For this guide, we'll need the following components
```js
var {Player, StockGames, Strategies, Population, History} = require("nashjs")
```

To get a game going, first we'll need players. Create some using `Player`

```js
var p1 = Player();
var p2 = Player();
```

Next we'll want a game for them to play. Games in `nashJS` are made up of units called _Playables_ but for quick-start you won't have to worry about that. The simplest way to get a game is using a pre-build [Stock Game](./stock-games/index.md), like the [Prisoner's Dilemma](./stock-games/prisoner-dilemma.md). We'll load the game, and tell it which players to use:

```js
var PD = StockGames["Prisoner's Dilemma"]([p1,p2])
```

Next our players will need a strategy, and fortunately, loading the Prisoner's Dilemma will have loaded several for us. To see the available strategies, you can use `Strategies`

```js
Strategies();
// should return something like ["Choose First", "Choose Second", "Randomize"]
```

Pick a strategy for each player, and assign them.
```js
p1.assign("Choose First");
p2.assign("Randomize");
```

Now we're ready to run the game!

```js
PD.play()
```

And those are the basics.

## View Game Results

Next we'll want to see the results of the game.

However, games in `nashJS` are played asynchronously. If you are running in a REPL like Node or Chrome DevTools, you can simply move on to the next steps. But if you are running a script from a file, then merely inserting the upcoming code after `PD.play()` would actually cause it to run _before_ the game plays. Instead, you can use promises:

```js
PD.play().then(function(result){
	// Inside this block you'll have access to the game results, such as by doing
	console.log(result)
})
```

You can view a player's score by using `.score()`:
```js
p1.score() // eg. 42
```

You can also view useful information on every player at once, by using `Population`. For instanceof
```js
Population().scores() //eg. [42, 35]
Population().scoresObject() //eg. {player1: 42, player2:35}
```

`Population().leader()` will return the `player` with the highest score, so
```js
Population().leader().id() // will tell you who it is, and
Population().leader().score() //will tell you what their score is
```

If there are a large number of players, it might be useful just to view summary statistics
```js
Population().scoresMean()
Population().scoresRange()
Population().scoresStd()

// Or by strategy
Population().scoresByStrategy()
```

You also might like to know specifically what happened during various steps in the game, and for that you can use `History`. The history is organized into 3 parts, and which part you are interested in will depend on your question. The first part is a **tree view**, which is an object structured to mirror the game play, including nested and chained _Playables_. This is primarily intended for game designers to see how the game progressed from step to step, and what happened along the way. This is the default view, which can be accessed with no modifiers.

```js
History() // returns the tree view
```

Next there is a **log view**. The log view is an array of entries, to tell you what happened in chronological order. This is useful for quickly seeing results for relatively short games. (Note: these entries may not be identical to the tree-view entries, as constructing a tree view requires going out of chronological order.)

```js
History().log // returns the log view
```

And finally, there is the **scores view**, which shows only entries when scores changed.

Because histories display so much information, even medium-sized games can quickly become a nightmare to navigate through. To make it easier, `nashJS` incorporates the JSON query language [JSONata](http://jsonata.org/). Any history object comes with a `.query()` method, which accepts a JSONata string as an argument, eg.
```js
History().query("$.action.results")
//or
History().log.query("$.results[player='player1']")
```
and returns an object that's (hopeully) easier to navigate. See the [JSONata documentation](http://docs.jsonata.org/) for more details.

However, because even JSONata can be kind of a pain, certain games may come with pre-built queries, which you can access with a shortcut rather than figuring out the whole thing. To see the list of available query shortcuts and what they do, use
```js
StockGames.queries()
// Returns something like:
// [
//  {@N-choices: "Players and their choice."},
//  {@N-players: "Who played."}
// ]
```
which should all start with "@". To use the shortcut, just enter its name as you would any query.
```js
History().query("@N-choices")
// returns something like:
// {player1: "Cooperate", player2: "Cooperate"}
```
Because the structure of games varies, and therefore the query needed to produce particular data will vary by game, these query shortcuts are game-specific.

## What To Do Next

If you're running or creating a game, see the [Game Design Guide](./game-design.md)

If you're creating a strategy, such as to participate in a tournament, skip to the [Strategy Working Guide](./strategy-working.md)
