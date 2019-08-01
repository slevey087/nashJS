# Information

`Information` makes up the class used to provide the information sent to players during game play. It takes the form of an object with various useful properties, including the game history and population information. This page will document the class, but you most likely will not need to use it unless you are [creating a custom playable](./custom-playable.md) with unique information mechanics.

An `information` object is created by supplying a `history` and a `playerList`, which serve as the reference objects for the `information`. If none is supplied, then `gameHistory`, the complete `history` for the game, and `gamePopulation`, the list of all players, will be used. 
```js
var {Information} = require("./lib/engine").Backend.Classes
var information = new Information()

// or

var history = // some History object here
var playerList = // some playerList object here
var parameters = {}
var information = new Information(history, playerList)
```

* `history = gameHistory` - the history to serve as reference history.
* `playerList = gamePopulation` - the population to serve as reference population.
* Additional optional parameters:
    *  `parentHistory:[]` - if the reference `history` is a child, you may want to consider including the log from its parent `history`. More on that in the section below on information branching. 

When `.deliver()` is called, the `information` will return an object suitable to pass to a player, which contains history and population data, as well as the summary-tree of the game structure.

NOTE: The reference history and population are not what actually gets delivered to the player. When the `information` is created, or when `.update()` is called, the history and population will be cahced *in their current form* and that is what will be delivered when `.deliver()` is called. As such the returned information will be out-of-date unless `.update()` was called prior to the most recent changes to the history or population. 

Why does `information` work like this? For time-consistency. In many applications, multiple decisions happen "simultaneously" (or as simultaneous as Javascript gets). For instance, if there are two `Choice`s in a `Turn`, then these are meant to imply that each choice happens at the same time, so neither player knows what the other one did. However, since Javascript doesn't have parallel processing, one of those choices will happen first. The player who chooses second should not receive information about what the first one did - because as far as they are concerned, it hasn't happened yet. In this situation, you can safely call `.update()` on your `information` instance *before* it is delivered to either player, in order to create an up-to-date cache, then calling `.deliver()` will return the same information set *even after the first Choice gets made.*
```js
var info = new Information();
// ...
info.update(); // call this to cache the most recent versions of the history and population and freeze them
info.deliver(); // will return an object safe to pass to a player.
```


The exception to this behavior is the `perfectInformation` construct. Being "perfect," it is always up-to-date at all times. So, for situations with simultinaity (and, obviously, for imperfect information games), don't use `perfectInformation.` (Either create your own information set, or use `.child()` to create an "imperfect" clone.)

Once you've built your information object and called `.update()`, you may want to add additional information specific to the local context. There are multiple ways to do so. The first way is using the arguments to `.deliver()`. 
```js
info.deliver(player = null, local = null)
```
`player` can be a `_Player` object, representing the player about to receive the data. If present, `.deliver()` will fetch data on the player from the `population`, and place in the `.me` property, so that players can investigate `information.me` to learn about themselves. `local` can be an object that will get merged into the delivered information object.

To add information prior to deliverance, you can use `.addAdditional()`. An object passed to `addAdditional` will get merged in when `.deliver()` is called (however, calling `.update()` will erase any information that has been added this way).

You can also use compilers. Compilers are functions that can be attached to the `information` instance, which will run if `.compile()` is called. The compiler function will be called such that the `this` value is the `information` instance itself. For an example, see the section below outlining how the `Turn`/decision compiling works.

And finally, the information object can be directly edited after `.deliver()` has been called. This is the principle behind the `informationFilter` argument used by [`Choice`](../playables/choice.md) and [`Range`](../playables/range.md)



## Basic Methods

### `.update(player = null, local = null)`

`.update` will update the local copies of `history` and `population` to be in line with the reference sources.
```js
info.update();
```
It will also return a copy of the information. NOTE: this is intended for quick comparison purposes ONLY. It is NOT safe to deliver this copy to the user, as it contains references to the underlying data objects (therefore, if one player were to edit the information, it would potentially alter the information seen by other players.)

You can use the optional `player` and `local` arguments just as you would with `.deliver()`.
```js
info.update(player, local)
```

### `.deliver(player = null, local = null)`

```js
info.deliver(); // returns an object safe to pass to a player.
```

`.deliver` will return an information object that is safe to pass to the user. By design, it can be out-of-date relative to the underlying data sources. For the most recent data, call `.update` *before* calling `.deliver()`. 

To add additional information upon deliverance, use the optional arguments.
```js
info.deliver(player = null, local = null)
```
* `player` - a `_Player` object. `.deliver` will fetch the player from the reference population, then include it in a `.me` property on the returned information object.
* `local` - an object that will get merged into the returned information object. Eg.
```js
result = info.deliver(null, {time:"now"})
result.time // "now"
```

### `.addAdditional(entry)`
Adds an additional entry that will get merged into the data when it is delivered. Eg.
```js
info.addAdditional({time:"now"});
result = info.deliver();
result.time // "now"
```
Multiple entries can be added using `.addAdditional`. However, they will all be erased when `.update()` is called. (This assumes that if `.update()` is being called, then this information is potentially out of date and should be re-written anyway.)

### `.child()`
Quickly clones an `information` instance. Creates a new `information`  with the same reference history and population, and the same `parentHistory`.

## CallingPlayable

The information delivered to a player will include a summary of the game structure. In order to accomplish this, when the user calls `.play()` to start the game, `perfectInformation` will request the game summary from that playable, and store it. This can be recalled by calling `.getGameSummary()`.

### `.getGameSummary()`
```js
info.getGameSummary() // returns an object with the game summary
```
Returns the game summary, which by default was archived when the user called `.play()` to start the game.

Note that you do not need to call `.getGameSummary()` on `perfectInformation`, it can be called from any `Information` instance, but the data is stored in `perfectInformation` and will be fetched from there.

Additionally, by changing the setting `"store-game-summary"` setting in the [settings](../components/settings.md) file from true to false, the information will request the summary every time `.getGameSummary()` is called, rather than simply storing it on `.play()`.

### `.setCallingPlayable()`
```js
info.setCallingPlayable(playable) // sets the callingPlayable to playable
```
Stores a playable as the _callingPlayable_, which is the _playable_ used to request a summary of the game structure. The _callingPlayable_ is a single global variable, stored on `perfectInformation`, however `.setCallingPlayable` can be called from any `Information` instance, and it will write to `perfectInformation`.

(Note also that when `.play()` is called from a `Playable`, the _callingPlayable_ will automatically be set to that playable.)

### `.getCallingPlayable()`
```js
info.getCallingPlayable() // returns the callingPlayable
```
Returns the `callingPlayable`, should you need to know on which _playable_ the game was initiated.

### .`clearCallingPlayable()`
```js
info.clearCallingPlayable() // sets perfectInformation.playable to undefined.
```

## Turn/Decision Compiling

Multiple decisions (`Choice` or `Range`) can be bundled into a `Turn`. The information delivered to each player should contain a tree structure that explains where the user is in the game. Information will always contain the `.game` property with the game-tree summary, but to avoid making the player dig through a potentially large and non-standard tree to figure out where they are in the game, `Turn`, `Choice` and `Range` operate a special compiling sequence to bundle this information in an accessible form.

`Turn` first creates a child `information` from whatever `information` is passed to it (which defaults to `perfectInformation`), to be passed to any of its associated sub-_playable_ `Choice`s or `Range`s. It attaches a compiling function to this `information`, which will get called from within the sub-_playables_.  Due to the nature of the threading of the `.play()` calls, _every sub-playable will call the compile function **before** any data is passed to any player_. This compile function creates a turn entry in the `information.additional` array, and respectively adds data from each sub-_playable_ to that turn entry. The result is that for each simultaneous sub-_playable_, the player receives information about which `Choice` or `Range` she is in, plus data on the containing `Turn`, which itself includes data on *all* of the `Choice`s and `Range`s within it.  