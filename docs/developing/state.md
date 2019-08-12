# nashJS Engine State Variables

## The Registry

The registry is the central information hub in the `nashJS` engine. It stores information on all _playables_, players, strategies, global settings, and queries, as well as the `Promise` constructor (to allow for sync or async modes. See more [here](./sync-mode.md))

The registry is just an object, and to read data from it, just `require` it and read it.
```js
var { registry } = require("./lib/engine").Backend.State
registry.players // an object listing every playable
```
The exact keys in the registry can vary, as `nashJS` extensions can create their own keys using the `._addType_` method, detailed below.  But here are the standard keys which are always present.

* `registry.players` is an object whose keys are player ids and whose values are the player's backend instance. 
* `registry.playables` is an object whose keys are _playable_ ids and whose values are the _playable_'s backend instance.
* `registry.Promise` contains the `Promise` constructor that any potentially async code should use (which will get replaced with a different constructor in sync mode).
* `registry.queries` contains all the query shortcuts that are registered. See [queries](./queries) for more on that.
* `registry.Settings` is the object with global settings. See more on Settings [here](./settings.md)

Additionally, when a _playable_ declares a `registryName`, that will result in a key by that name getting created in the registry, with those _playables_ getting filed under both `registry.playables` and `registry[registryName]`. See the doc on [custom _playables_](custom-playable.md) to see where that declaration goes.

### `._addType_`

The `._addType_` function is the correct way to add a key to the registry. Its single argument is a name for the key, and it will create a new object and attach it to the registry with that key. Eg.
```js
registry._addType_("things")
registry.things // returns {}
```
**NOTE:** This will not typically be necessary unless you're making a major change to the `nashJS` engine!

## idHandler and the Id Counter

Many objects in `nashJS` require unique ids, and so `nashJS` provides a handy way to generate/validate them using the `idHandler` function, with data stored in `idCounters`. Ids are generated in the following fashion: a "counterName" is supplied, and ascending integers are attached to the end of it, eg. "turn5", then "turn6" then "turn7" and so on.

If you are creating an object and need to validate or generate an id, you'll need the `idHandler` function. You can fetch it with
```js
var { idHandler } = require("./lib/engine").Backend.HelperFunctions("state")
```
(However, don't forget that for all Backend objects, if you are working on code that will run before the game engine has fully-loaded, then you'll have to access the source file directly, since the `Backend` object won't exist yet. )

`idCounters` is an object whose keys are different "counterNames", and whose value is the most recent integer associated with an id. Eg. if "turn5" was just created, the `idCounters.turn` will be 5. Here's how you can access `idCounters`:
```js
var { idCounters } = require("./lib/engine").Backend.State
```
