# Summary

`Summary` is an internal class used by playables when `.summarize` is called, to help pass data around to construct the summary properly.

This page will provide documentation for the class. You likely will not need to use it unless you are [building a custom playable](./custom-playable.md) with custom summary behavior. You will encounter it primarily when overwriting the `.summaryThis` or `.summaryNext` methods.

## Basic Usage

There will not typically be a need to require the `Summary` constructor, as an instance of the class will be passed in the arguments when `.summaryThis` or `.summaryNext` are called.

A `summary` instance contains within it the object which will be reported as the summary data. The most basic and salient usage is to set a key/value within that data, which can be done by calling the `summary` instance as if it were a function.

```js
summary("player",player.id) // set the "player" field in the summary to the id of the player
```

If for some reason you need to delete a key after it's created, use `.delete()`
```js
summary.delete("player") // delete the "player" field.
```

To collapse the `summary` into a simple object suitable to present to the user, use `.print`
```js
summary.print() // returns a pure object suitable to return to a user
```
`.print()` will recursively crawl through all the branches of the summary, and collapse any other `summaries` that live in its branches.

## Branching

The summary of a game is meant to include all the branches that the game could take. Therefore, `Summary` provides a series of methods to make branching easier, so that nested summary entires show up correctly. You will typically only need these if you are creating a `playable` with custom branching behavior (eg. `Choice`, for which the next game step may be determined by the player's decision).

NOTE: `Summary` contains an internal mechanism to prevent circular recursion. That is, if your game has loops in its game structure (perhaps a branch that returns to the start if a certain choice is made), then `Summary` will eventually terminate rather than looping forever. Therefore, *do not create your own summary branching. You will break the recursion prevention.* Use the summary branching functionality provided, as detailed below.

For adding simple data points, it is fine to just add the data to a key, as in `summary("plauyer", player.id)`. But for more sophisticated nesting and tree structures, you will want your branches to themselves be `summary` objects. Particularly, if you call `.summarize()` on any _playable_, the first argument should be a `summary`, and it should not be your parent `summary`, but rather a child of that object, created using one of the branching methods below.

As a word of advice, bear in mind that if you are asking sub-_playables_ for summaries, you may, depending on the exact behavior, want to set `shortCircuit` to true, so that the sub-_playable_ does not continue down its own `next` branches. This is called as `playable.summarize(summary, true)`.

### .branch
Creates a simple branch in the form of a key whose value is a new `Summary`.  The argument is the name of the branch, and the function returns the newly created `Summary.`
```js
summary.branch("action") // returns a summary that will live in the "action" branch.
```
To create simple branch summary of a _playable_, do this
```js
playable.summarize(summary.branch("action")) 
// creates a branch in the original summary called "action
// which the new playable's summary will be written into.
```

### .array
Creates a branch whose value is an array of summaries. The array is created by applying a specified function to an array provided by the caller. This is primarily meant for retrieving summaries from an array of next-steps. 
```js
var anArray = // an array of playables, for instance
var func = // a function to retrieve a summary from a playable, for instance
var arrayIfOne = false // defaults to false
summary.array("next", anArray, func, arrayIfOne) // appllies `func` to each item in `anArray`, generating a summary for each, then stores this array of summaries as the value for the "next" key in the original summary data.
```
The `func` function will get called with two arguments. The first will be the item from the array (`anArray` in the example above) and the second will be a newly created `summary`, which the function can, say, write data into. The function should return the summary passed to it. 

Here's how you would fetch summaries from an array of _playables_ and store them in a branch called "next".
```js
var playables = // an array of playables, for instance
var func = function(playable, summary){
    return playable.summarize(summary)
}
summary.array("next", playables, func) 
```

If `arrayIfOne` is false, then if the resultant array of summaries only has length 1, it will be extracted to a single value rather than an array.

### .tree
Creates a branch whose value is in the form of an outcome tree of summaries. TODO: write this.

### .treeArray
Creates a branch whose value is in the form of an outcome tree of arrays of summaries. TODO: write this.

### .mapArray
Creates a branch from a Map. TODO: write this.
