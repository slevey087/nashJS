# Strategy Working Guide

Strategies in `nashJS` are classes, and instances of the class will be created when the strategy is assigned to a player. If that didn't make sense to you, don't worry, it's easy to do. Strategies get coded according to simple guidelines, then you'll register the strategy with `nashJS`, essentially making it aware of the strategy's existence. For more on coding and registering strategies, see the [Strategy Design Guide](./strategy-design.md). This section will focus on how to load strategies from a file, and how to use them once they're registered.

## Loading Strategies

The simplest way to include a strategy is to write the code for it directly into the file with the game itself. However, this is not ideal for large games or for tournaments, so there are ways to load a strategy from a separate file. If you're familiar with Javascript's various module import mechanisms, and you trust the code you're importing, you can use any of them, then register the strategy within your main game file.

But, the problem with this is that it leaves both the game code and `nashJS` itself vulnerable to cheating, for instance a piece of code in the strategy file might change the game, or change another player's score. To prevent this, `nashJS` comes with its own file-loader mechanism, which reads the file directly and runs the code in a separate sandbox.

The `loadStrategy` function has two arguments, `filename` and `trusted`. The latter takes a true/false value, and if false, `nashJS` adds several extra security mechanisms. However, the default value is true, as these extra mechanisms slow down game play. You can also load every file in a folder all at once, using `loadStrategyFolder`, which also takes a `folderPath` and `trusted` arguments. This is primarily intended for tournaments.

```js
var filename = "./tft.js"
var trusted = true
loadStrategy(filename, trusted)

var folderPath = "./strategies"
loadStrategyFolder(folderPath, trusted)
```

If you use these functions, it is assumed that the line of code to register the strategy, a call to either `registerStrategy` or `registerStrategyObject` is already in the file. (However, because this code runs in a constructed sandbox, there is no need to import these functions within the strategy files. They will be injected into the sandbox context.)

## Working With Strategies

`nashJS` provides a `Strategies` object to help you work with strategies. First require it, then call it to see an array of available strategies.

```js
var {Strategies} = require("nashJS")
Strategies()
//returns, for eg.: ["Tit For Tat", "Grudger", "Randomize", "logger"]
```

Running `Strategies.descriptions()` will return an object whose keys are strategy names and whose values are the description of that strategy.

```js
Strategies.descriptions()["Tit For Tat"]
// returns: "Do whatever your opponent did last turn. Cooperate if this is the first turn."
```

To assign a strategy to a player, use the `assign` parameter when a player is created
```js
p1 = Player({assign:"Tit For Tat"})
```

or use `.assign()` after the fact:
```js
p1.assign("Tit For Two Tats")
```
Strategies can be re-assigned at any time, but doing so will reinitialize them, blanking any data that the strategy may have been storing internally.

To see what strategy a player is currently using, use `.strategy()`
```js
p1.strategy() // returns "Tit For Two Tats"
```

## Tester Strategies

The `Strategies` object also comes with two pre-built strategies meant to aid in testing, **debugger** and **logger**. Load them as follows:
```js
Strategies.debugger();
p1.assign("debugger");
// or
Strategies.logger();
p2.assign("logger");
```
However, their loader functions actually return the strategy name as a string, which means you can load and assign in one step like so
```js
p1.assign(Strategies.debugger());
// or
p2.assign(Strategies.logger());
```

**debugger** simply runs the Javascript keyword `debugger` whenever it is asked to choose. In certain execution environments, this pauses execution and allows for probing of local variables. If that doesn't work well for your context, then **logger** might work better. When **logger** is asked to choose, it does a `console.log` on all the information which is passed to it.

Inspecting this data is helpful for both game design and strategy design. Game designers should make sure that the player is seeing the expected information, and strategy designers should peruse the information their strategy will receive, in order to code their response.

## What To Do Next

If you're planning on creating a strategy from scratch, check out the [Strategy Design Guide](./strategy-design.md). Or, if you want to build a game instead, check the [Game Design Guide](./game-design.md).

If you're totally clueless, try the [Quick Start Guide](./quick-start.md). Or if you've aced it all but have more specific questions about `nashJS` components, try the [Component Reference](./components/index.md)
