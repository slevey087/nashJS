# NashJS

A flexible and extendable game theory simulator. Define a game, players, and strategies, then run the simulation and view the results. Primarily meant as a research tool, and to play around with concepts from game theory.

There are multiple ways to define a game in **nashJS**, depending on the level of complexity and control over parameters you desire. The simplest way is to use a pre-written Stock Game, which comes with **nashJS** (for instance, the Prisoner's Dilemma). These are completely plug-and-play. More complicated, you can use Stock game components, which are game outlines within which you fill in the details (for instance, a Two-Player Zero Sum game).

For more even more specificity, you can assemble your game using the **nashJS** components known as _Playables_. These are individual game elements with a `.play()` method, which can be combined to form a game. The simplest way to combine them is using a `Consecutive` _playable_, which executes each _playable_ in order. For more involved or contingent sequences, _playables_ can be chained together directly.

This page will provide an overview of each of these strategies in turn.

## Stock Games

**nashJS** comes pre-loaded with a number of Stock Games. To load one, first `require` the stock game loader.

```js
StockGames = require("nashJS").StockGames;
```

This is an object whose keys are the names of games. Its values are the loader-functions for each stock game. Each game probably requires some arguments to be given to the loader function. See the specific entry on the game you're using for more details. But it is typical for the first argument to be an array of _Players_ while the last argument is an (optional) object of parameters.
Then you can invoke a game by calling its name, for instance:

```javascript
var PD = StockGames["Prisoner's Dilemma"]([p1, p2]);
PD.play();
```

## Stock Game Skeletons

Within the Stock Games list are several game skeletons. These require some more detail or configuration, or might even require another game to wrap around, but they are shortcuts for creating slightly more complicated games from common patterns, without having to assemble them from scratch every time.

Among the useful game skeletons include
* 
