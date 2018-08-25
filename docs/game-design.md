# Game Design

There are multiple ways to define a game in **nashJS**, depending on the level of complexity and control over parameters you desire. The simplest way is to use a pre-written Stock Game which comes with **nashJS** (for instance, the Prisoner's Dilemma). These are completely plug-and-play. More complicated, you can use Stock game components, which are game outlines within which you fill in the details (for instance, a Two-Player Zero Sum game).

For more even more specificity, you can assemble your game using the **nashJS** components known as _Playables_. These are individual game elements with a `.play()` method, which can be combined to form a game. The simplest way to combine them is using a `Consecutive` _playable_, which executes each _playable_ in order. For more involved or contingent sequences, _playables_ can be chained together directly.

This page will provide an overview of each of these strategies in turn, then we'll talk about what to do next.

## Stock Games

**nashJS** comes pre-loaded with a number of Stock Games. To load one, first `require` the stock game loader.

```js
StockGames = require("nashjs").StockGames;
```

This is an object whose keys are the names of games. Its values are the `generator` functions for each stock game. Each game probably requires some arguments to be given to the `generator` function. See the specific entry on the game you're using for more details. But it is typical for the first argument to be an array of _Players_ while the last argument is an (optional) object of parameters.
Then you can invoke a game by calling its name, for instance:

```javascript
var PD = StockGames["Prisoner's Dilemma"]([p1, p2]);
PD.play();
```

See more details and the list of available games [here](./stock-games/index.md).

## Stock Game Skeletons

Within the Stock Games list are several game skeletons. These require some more detail or configuration, or might even require another game to wrap around, but they are shortcuts for creating slightly more complicated games from common patterns, without having to assemble them from scratch every time.

Among the useful game skeletons include
* Normal form games
* Two-player normal form
* Simple zero-sum games
* Iterated games
* A round-robin builder
* A "Cultural Evolution" model

See the specific pages for more details on these. However, some of these game skeletons may require you to pass in a `game generator,` which, when called as a function, will return the actual _playable_. Each Stock Game comes equipped with a method to make this easer called `createGenerator()`.

See more details and the list of available game skeletons [here](./stock-games/index.md).

## `Consecutive` Playables

By digging deeper into the guts of **nashJS**, you can assemble a game to your exact specifications from scratch, using individual _Playables_. These can be chained together using a `Consecutive`. For example:

```js
var Game = Consecutive([
	Choice(/*some arguments here*/),
	Choice(/*some more arguments*/),
	Lambda(/*there would be a function here*/),
	StochasticHalt(/*arguments*/),
	Choice(/*more choicey arguments*/)
]);
Game.play();
```

See the specific pages on [Consecutive](./playables/consecutive.md) and the various [_Playables_](./playables/index.md) for more details

## _Playable_ Chaining

All _playables_ can be chained together in the following fashion:

```js
C1 = Choice(**some arguments here**)
C2 = Choice(**more arguments here**)

C2(C1)
C1.play()  // Play C1 followed by C2
```

Additionaly, some _playables_ have more sophisticated chaining capabilities, which allow branching. For instance:
```js
C1 = Choice(player1, ["Air", "Sea"])
C2 = Choice(player1, ["Jet", "Helicopter"])
C3 = Choice(player1, ["Surfboard", "Sailboat"])

C2(C1["Air"]())	// Play C2 after C1, but only if "Air" is chosen
C3(C1["Sea"]())	// Play C3 after C1, but only if "Sea" is chosen

C1.play()
```
See the guides on specific [_Playables_](./playables/index.md) for more details.

## What To Do Next

After you've built the game you want, you'll need strategies to play it. See the [Strategy Working Guide](./strategy-working.md). If that all makes sense and you'd like to create your own strategies, see the [Strategy Design Guide](./strategy-design.md).

If you're totally confused, try going back to the [Quick Start Guide](./quick-start.md). Or, if you've mastered it thus far but still have more questions, try the [Component Reference](./components/index.md)
