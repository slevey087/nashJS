# Custom Playables

The basic unit of `NashJS` is the __playable__, an object with a `.play()` attribute, that is called to run the game functionality. `NashJS` comes with a number of built-in __playables__, (full list [here](../components/playables/index.md)). It also comes with a __playable__ specifically meant for users to define custom functionality, called [Lambda](../components/playables/lambda.md).

But, if none of those are powerful enough to accomplish your specific use case, you can create a custom __playable__, and this guide will walk you through it.

## Classes

_Playables_ are made up of two classes, a backend class and a frontend class. The backend class is the object on which the actual game functions are performed, while the frontend class is an object safe for the user to handle, which is tied to the backend class. That is, during actual game-play, when the end-user calls `.play()`, it is running that function on the frontend object, which triggers a call to `.play()` on the backend object. (This seperataion is to make cheating more difficult, and to mask complexity from the user.)

To create a new _playable_, you must extend the basic `_Playable` backend class and the `Playable` frontend class. These classes are found in the _./lib/playables/playable.js_ file. Fortunately, much of the basic functionality is handled for you already within these classes, and your job as _playable_-creator is simply to overwrite various methods as your particular _playable_ requires. 

So, the basic structure of every _playable_ looks like this:
```js
"use strict";

// Parent class
var { _Playable, Playable } = require("./playable");

// Helper functions
var { idHandler } = require("../helper-functions")("state");

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode

class _MyPlayable extends _Playable{
    constructor(id, myArgs, parameters={}){    // myArgs can actually be more than one argument
        super(id, parameters);
        
        // do setup here, such as save arguments to object properties
    }

    // Overwrite other methods here as needed, especially `.play()`
}
_MyPlayable.registryName = "myPlayables";
_MyPlayable.counterName = "myPlayable";

class MyPlayable extends Playable{
    constructor(myArgs, parameters={}){  // myArgs can actually be more than one argument
        var id = idHandler(parameters.id, _MyPlayable.counterName);

        // validate any user-supplied parameters here

        var _myPlayable = new _MyPlayable(id, myArgs, parameters);
        super(_myPlyable);

        // do any additional setup here
    }

    // Create any additional methods here.
}

module.exports = { _MyPlayable, MyPlayable};
```

The `_Playable` super-constructor will deal with complications like adding the _playable_ to the registry and assigning the basic parameters that all playables support. The `Playable` super-constructor will create the basic chaining functionality. 

The backend class should include the properties `registryName` and `counterName`. `registryName` refers to the category in which to add these _playables_ to in the global registry when they are created. You may use a name already used by another _playable_ class if these are thematically related and likely to be referend in idential contexts, eg. both `Choice` and `Range` use "decision". Or if not, supply your own string. 

The `counterName` is used for id uniqueness. Each _playable_ instance **MUST** have a unique id. If the user supplies an id in the parameters, then the `idHandler` function will check to see if it is unique, and throw an error if not. If the user doesn't supply an id, then `idHandler` will generate one automatically. It stores a number for each `counterName`. When a new id needs to be created, it will increment the number then tack it to the end of the `counterName`. Eg. "turn5". So, the `counterName` should be whatever you want the default form of the _playable_ ids to take, and it should also be passed to `idHandler` as the second argument, so that it knows where to look. 

The convention is to use the procedure above, where your code runs `idHandler` in the frontend constructor, then passes returned id to the backend constructor as the first argument, which then passes it to the backend super-constructor. The reason this must be done explicitly is to allow for the possibility of you generating ids in a different fashion, if this default behavior is unsatisfactory for your application. This also aids in testing.

And, finally, your code should overwrite the `Promise` built-in class with the code stored in `registry.Promise`. This is done because, as explained below, the `.play` cycle is all written in terms of promises, but when `nashJS` is running in "sync mode," the standard `Promise` is replaced with [`SynchronousPromise`](https://www.npmjs.com/package/synchronous-promise). 

## Methods

The specific functionality for your _playable_ is created by overwriting the standard methods, or creating new ones as necessary. Almost certainly, unless perhaps you are merely extending another _playabble_, you will need to overwrite the `.play()` method. You will also likely need to overwrite the `.summaryThis` method which is used to provide information on the _playable_ to the user in the form of a [`Summary`](./summary.md). If your _playable_ has branching behavior that is more sophisticated than the default, then you may need to overwrite the methods related to branching, which include `.findNext`, and `.summaryNext`. If the default history-recording behavior isn't suitable for your application, then you may need to overwrite `.handleHistory` as well. Each of these will be covered in turn below.


## The `.play` Cycle

`.play()` is where all the action in `nashJS` is. It is the central method of a _playable_, the method which runs during game execution and performs the game functions. 

However, a call to `.play` on your _playable_ does not merely call your `.play` method, but is in fact a whole cycle of method calls, and your `.play` method will get wrapped when `nashJS` loads it with a function that will do some prep then call the whole cycle. 

The standard arguments passed to all methods in the `.play` cycle are 1st an object of `parameters` for game play, and second the `results` of the previous method in the `.play` cycle. 

```js
method({
    history,
    information
    initializePlayers,
    shortCircuit,
    usePayoffs,
    writeHistory
}={}, result)
```

The functions that get called in the `.play` cycle are the following. Some of these can/should be overwritten to create your functionality, while others should not be. **NOTE**: Every one of these methods **MUST** return a `Promise` (even if it is merely `Promise.resolve(result)`, where `result` is that second argument), except for `.findNext`.
```
1 _Playable.prototype._startTimer
2 .checkInit
3 .prePlay
4 .play
5 .postPlay
6 _Playable.prototype._stopTimer
7 .handleHistory
8 .proceed
9 .playNext
10 .findNext
```

`_startTimer` and `_stopTimer` between them create the `duration` value which gets recorded into the history, showing how long the _playable_ took to execute the game step. Unlike the other methods, which are called from your own class prototype, these are called directly on the `_Playable.prototype`. **DO NOT OVERWRITE**.

`.checkInit` deals with the `initializePlayers` parameter, which can be used to re-initialize all or some players when `.play` is called. **DO NOT OVERWRITE**.

`.prePlay` is called prior to `.play` and can be used for any initialization you need to do. The prototype method does nothing, and you are free to overwrite it. However, this is not typically necessary, as it's usually just fine to place setup code within `.play` itself. The exception is in circumstances with "simultaneity" (such as with [`Simultaneous`](../components/playables/simultaneous.md), or [`Turn`(../components/playables/turn.md)) which will call each `.play` cycle step in a dovetailed fashion. That is, every "simultaneous" `.prePlay` will be called, followed by all `.play`s, then all `.postPlay`s, and so on.

`.play` is where the main attraction is. This is covered in more detail in the section below. 

`.postPlay` is called after `.play` and is a free space should you need it for teardown. The prototype method is blank, and you are welcome to overwrite it. However, as with `.prePlay`, this will rarely be necessary, as teardown can usually be done just as well in `.play` itself. The main exception is again for cases of "simultaneity."

`.handleHistory` is where the entry to be added to the game record is automatically written for you. This is covered in more detail below, but the short version is that the object you return from `.play` (the result of the `Promise`) or `.postPlay` should include a key called `historyEntry` whose value is an object to add to the `History` tree and log.

`.proceed` deals with sending us on our merry way to the next steps in the game. If all is well (the _playable_ has not been `shortCircuit`ed - more on that below), then `.proceed` will call `.playNext`, which will call `.findNext` and then call `.play` on the _playables_ returned (initiating the `.play` cycle on those _playables_). **DO NOT OVERWRITE `.proceed` OR `.playNext`**. To implement custom branching, overwrite `.findNext` (which should *not* return a `Promise`, but should return an array of _playables_ to play next). More on this in the section below on branching.

## `.play` Itself

When `.play` gets called during the `.play` cycle, the first argument will be an object of `parameters` for play, and the second will be any `results` from previous functions in the `.play` cycle. The function itself should return a `Promise`, whose resolve value is an object containing results and history information, in a particular format as explained below.

```js
play({
    history,
    information
    initializePlayers,
    shortCircuit,
    usePayoffs,
    writeHistory
}={}, result){
    
    // do .play stuff here

    return Promise.resolve(result).then(function(result){
        // do potentially async .play stuff here (and remember that calling other playables may be async!)
        return result;
    });
}
```

The values for most of the parameters default to stored values for `playParameters`; these are the parameters that every _playable_ supports when being created or calling `.play`. One addition to the list is `shortCircuit`, which, if true, will prevent `.proceed` from continuing down any next-branches. This is used is the _playable_ is called from within another _playable_, and should not continue. For instance, if a `Choice` is played from within a `Turn`, any next-branches on the `Choice` will be ignored. 

The correct way to call another _playable_ from within `.play` is using `Promises`.
```js
return somePlayable.play(parameters).then(function(result){
    // do something with the result
    return result;
})
``` 

Your `.play` code is responsible for returning a `result` in the correct form (or conceivably your `.postPlay` code could do so instead). That should look like this:
```js
result = {
    historyEntry: {
        /* history data here */
    },
    result: /* a result value */
}
```
`.handleHistory`, if not overwritten, will automatically add the duration then write the `historyEntry` to the appropriate locations in the `History`. `result.result` may get used for complex branching (For instance, `Turn` uses `result.result` to pass the result of the players' choices to `.findNext` in order to determine what the next game step should be.), but is optional.

You're free to use other keys in this object to pass data around between methods in the `.play` cycle. 

One more thing to bear in mind: for large games with lots of repitition, `.play` may potentially get called many times. Therefore, whatever it does, it should do it _fast_. While testing your _playable_, be sure to check the `duration` times that get written to the `History` to see that all is well. They should not be any longer than a few miliseconds. 

## Branching

Branching behavior is governed by the `.next` property on the backend instance, as well as by the `.addNext` and `.findNext` methods. Overwrite the code for these to implement custom branching behavior, or do nothing to inherit the default behavior.

 `.addNext` will get called when _playables_ get chained together in the standard form, eg
```js
c2(l1)
// this calls .addNext on the backend instance for l1, passing the backend instance for c2 as an argument.
```
while `.findNext` gets called from within `.playNext` during the `.play` cycle, and should return an array of the _playables_ to play next.

The default behavior is that your _playable_ can proceed to multiple next game-steps, but these are chosen independent of the results of play. This is accomplished with `.next` taking the form of an array. In that case `.addNext` will simply push to that array, and `.findNext` will simply return the entire contents of that array. This is the default setup, and requires no additional coding in your _playable_.

If that behavior isn't sufficient, then you can have your `.next` property take a different form. `.addNezt` and `.findNext` automatically support arrays and [`outcomeTrees`](./outcometree.md) of arrays, but for more complicated structures you may need to rewrite these methods. 

The default form of `.addNext` works in the following manner:
```js
//Add reference to next playable branch, to chain playables together.
	addNext(nextPlayable, path = "all") {
		if (path == "all") this.next.push(nextPlayable); // works whether this.next is array or OutcomeTree
		else {
			this.next.getValue(path).push(nextPlayable); // only works for OutcomeTree. Overwrite for other types.
		}
	};
```
If `.next` is an `outcomeTree`, then the `path` argument will tell it where in the tree to add the `nextPlayable`.

For help with this kind of discrete branching, you can use the helper class [`Branch`](./branch.md). `Branch` provides a simple way to easily extend the _playable_ chaining functionality, because the argument in the chaining doesn't just have to be a `Playable`, but can be a `Branch` as well. This will automatically look up the associated _playable_ and call `.addNext` on it, with the appropriate path argument. 

The most common way to do this is to add a `.generateBranches()` method to your backend `_playable` prototype, and then call it from your frontend `playable` constructor. That method can create new `Branch`es and add them to your frontend `playable` instance as object values. Then you can pass these in during chaining. 

For instance, when a `Choice` is created, it creates `Branch`es for each option, and adds them to the interface object.
```js
var c = Choice(player, ["up","down"])
// the above code creates two new Branch objects, one for "up" and one for "down", and adds them to c as object keys: c.up and c.down. These can then be passed during chaining

l2(c.down) // l2 will look up the playable associated with the branch at c2.down, and call .addNext, with the "path" argument set to ["down"]
```

The default behavior of `.findNext` is as follows:
```js
// Return the next playable in the sequence. Overwriteable for playables with more complicated branching.
	findNext(result) {
		if (this.next.getValue) return this.next.getValue(result.result);
		return this.next;
    };
```    
If the `.next` property is an `outcomeTree`, this will use data stored in `result.result` as the path to lookup the proper branch in the tree. If `.next` isn't an `outcomeTree`, this code just returns it. That's find if it's a normal array, but if not, then you'll need to overwrite `.findNext`, to return an array of _playables_.

## History

The basic handling of histories goes like this: any data entered into the `result.historyEntry` object received by `.handleHistory` will be recorded to both the tree and log of whatever history is passed to `.play`, which by default is the complete `gameHistory`.

If you need additional entries besides this, you can simply write them as needed. A `history` is provided in the parameters to every method that gets called during the `.play` cycle (except `.findNext`). Simply pull it from the argument and write to it using the [`history` API](./history.md).

If you need to change the behavior of `.handleHistory`, then you can overwrite it with your own behavior. As with all `.play` cycle methods, its arguments are `parameters` and the `result` from previous entries, and it should return a `Promise` with the (possibly mutated) `result`. Here's the standard code:
```js
    //Called after timer stops, to write history. Overwiteable if playable has specific logging behavior.
	handleHistory({ history = gameHistory } = {}, result) {
		return Promise.resolve(result).then(function (result) {
			if (result.historyEntry) history.add(result.historyEntry);
			return result;
		});
	};
```
Overwrite as necessary. Bear in mind though that you'll want to neatly distribute your `history` entries between the tree and the log. As a reminder, the tree should have a single entry per _playable_, potentially with sub-_playable_ activities within it, while the log may have multiple entries for different actions as needed, and should not have sophisticated nesting.

## Summarize

_Playables_ have a `summarize` functionality, to allow the user to more quickly observe the structure of the game and its components. That summary is put together when `.summarize` is called, but you will not need to directly overwrite that method.

Instead, every _playable_ will need to overwrite the `.summaryThis` method, which provides information on the specific _playable_. Additionally, _playables_ with more complex branching will need to overwrite the `.summaryNext` method, which takes us on our merry way to the next game steps for summarization.

The `.summaryThis` method will get called with a single argument, which will be a [`Summary`](./summary.md) object. You should use that standard API to write data to the `summary`, then return the `summary`. Eg.
```js
summaryThis(summary){
    summary("player", this.player.id)
    return summary;
}
```
The `.summarize` handler in the super-class will take care of adding an `id` field for you, so you can just add supplemental information.

(Remember that summaries are not histories - it should convey information about the _playable_ in general, not related to a specific run through the `.play` cycle. You should also keep the summaries short and sweet, just convey a few pieces of useful information.)

The `.summaryNext` method will get called if the summary is proceeding to the next-branches of the _playable_. This notably won't happen if the `shortCircuit` argument to `.summarize()` is set to true. If your `.next` property is just an array, then the default coding of `.summaryNext` should be sufficient. If you have more complicated branching, such as `outcomeTrees` or other data types, then you'll need to rewrite `.summaryNext`. Fortunately, the branching functionalilty built into the [`Summary`](./summary.md) class should help out. See those docs for more details. `.summarizeNext` is called with a single argument, a new `summary` in which to write your data, and it should return that `summary`.

### How to summarize another _playable_

If you _playable_ has sub-_playables_ (eg. every `Turn` will have `Choice`s or `Range`s as sub-_playables_), then you should call `.summarize` on that _playable_ and feed it a `summary` created by one of the branching functions of your `summary`. To see what that means, let's take a look at the `.summaryThis` method for `Loop`. `Loop` has a single sub-_playable_, the _playable_ to be looped. The summary for `Loop` includes the id (added automatically), the "count" of the number of times it will loop, and a field called "action" which will include a summary of the _playable_ that will get looped.
```js
summaryThis(summary) {
	summary("count", this.count);
	this.playable.summarize(summary.branch("action"), true);

	return summary;
};
```
`summary.branch("action")` creates a key in the `summary` called "action", and returns a new `summary` object, linked to the parent `summary`, which will occupy that value. `this.playable` is the _playable_ to be looped, and calling `.summarize` requests a summary, to be stored in the `summary` returned by `summary.branch`. The second argument to `.summarize` is `shortCircuit`, which, when set to true as above, prevents the _playable_ from summaring its own next-branches. This is because `Loop` only loops the single _playable_, and ignores any of its next-branches.

Whenever you have to summarize a `playable`, you should **make sure** to use the various branching methods available on `Summary` (such as `.branch`, `.array`, `.tree`, etc). This handles several important features in the background for you, such as preventing the summary from going on infinite loops.


## Incorporating Your _Playable_ Into nashJS

The file for your _playable_ should live in the _./lib/playables_ folder. Then, your _playable_ must be hard-coded into the _./lib/playables/index.js_ file, in 3 places. First, add a `require` statement to require the backend and frontend classes. Then, in the `module.exports.playableClasses` add an export for your backend class, and in `module.exports.playableInterfaces`, add an export for your frontend class. If you've followed the standard conventions thus far, it should be fairly obvious what to do. 

## Testing and Docs

It is definitely recommended that you write the docs and tests as you write your _playable_ code. Ideally, you'd finish all three at the same time. 

Add a file for tests to the _./test/playables/_ folder. See the other test files to get a sense of what needs to be done. Don't forget that your `.play` function will be wrapped by the `.play` cycle handler, and so your test cannot test the function directly, but tests the whole cycle. You can however directly test other individual parts of the cycle, eg. `.prePlay`. Probably the easiest way to check the output object of the `.play` cycle is with snapshot testing, but bear in mind that you'll have to delete the `duration` key, as it will be slightly different every run-through. See the other _playable_ tests for examples.

Add a markdown documentation file to the _./docs/components/playables/_ folder. There is a rough format that the other _playable_ docs use, that you should consider as your starting place. However, the docs for `nashJS` have a more free-form, heuristic feel, where concepts are explained as needed in a logical order, rather than documenting methods in alphabetical order, and your doc should follow that approach.

## Misc

* If your _playable_ allows any user-defined numbers at all, then you should be prepared for them to be [logic classes](../logic/index.md) rather than actual numbers. In most places, this won't affect your code at all, but it will for equality comparisons. Strict equality (=== or Object.is) will yield false even when the object's numerical value is equal to your comparison number. To facilitate use of these objects, either a) always use loose equality (==), or b) do something to convert any object to a number, such as multiply by 1. Again, this is only necessary for equality comparisons. Arithmetic operations like multiplication and addition will work fine as normal.
* Generally, you should do validation of arguments in the frontend class, and the backend class should assume that the arguments are valid. This makes it easier to build new _playables_ by extending old ones. If you're going to do that, most likely you will want to extend the backend class, but right an entirely new frontend class.
* If you want your _playable_ to bring halt the game mid-way through, then the correct way to do that is by calling `history.end()` (or, its light-hearted alias, `history.fukuyama` (get it????)). This will allow any _playables_ in progress to wind down, but will stop any new _playables_ from begininng the `.play` cycle. Note: after `history.end` has been called, no new _playables_ can play until `.clearHistory` has been called to reset it. This happens by default when the user calls `.play()` on a frontend instance (though not when other _playables_ call `.play()` on a backend instance), but they may disable that in order to step through games one section at a time. This is on them to deal with!