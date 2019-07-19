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

## Branching

The summary of a game is meant to include all the branches that the game could take. Therefore, `Summary` provides a series of methods to make branching easier, so that nested summary entires show up correctly. You will typically only need these if you are creating a `playable` with custom branching behavior (eg. `Choice`, for which the next game step may be determined by the player's decision).

NOTE: `Summary` contains an internal mechanism to prevent circular recursion. That is, if your game has loops in its game structure (perhaps a branch that returns to the start if a certain choice is made), then `Summary` will eventually terminate rather than looping forever. Therefore, *do not create your own summary branching. You will break the recursion prevention.* Use the summary branching functionality provided, as detailed below.

### .branch
Creates a simple branch in the form of a key whose value is a new `Summary`.  The argument is the name of the branch, and the function returns the newly created `Summary.`
```js
summary.branch("next") // returns a summary that will live in the "next" branch.
```

### .array
Creates a branch whose value is an array of summaries. The array is created by applying a specified function to an array provided by the caller. This is primarily meant for retrieving summaries when an array of next-steps. 
```js
var anArray = // and array of playables, for instance
var func = // a function to retrieve a summary from a playable, for instance
var arrayIfOne = false // defaults to false
summary.array("next", anArray, func, arrayIfOne) // appllies `func` to each item in `anArray`, generating a summary for each, then stores this array of summaries as the value for the "next" key in the original summary data.
```
The `func` function will get called with two arguments. The first will be the item from the array (`anArray` in the example above) and the second will be a newly created `summary`, which the function can, say, write data into. The function should return the summary passed to it. 

If `arrayIfOne` is false, then if the resultant array of summaries only has length 1, it will be extracted to a single value rather than an array.

### .tree
Creates a branch whose value is in the form of an outcome tree. 

