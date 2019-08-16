# RandomPlayerChoice

Use this _playable_ when you need a [`Choice`](./choice.md) but instead of a pre-determined player, you'd like `nashJS` to select one at random each time.
```js
var options = ["Left","Right"] // the player's options to choose from
var parameters = // optional parameters
var rpc = RandomPlayerChoice(options, parameters)

rpc.play()
```

* `options` - an array of the options that the player may choose from
* Optional parameters:
    * `playerList: "all"` - a list of players from which to choose a random player. Can be a `player`, an array of `player`s, a `playerList`, or the string "all".
    * `excludePlayers:null` - a list of players to not allow to be chosen. Can be a `player`, an array of `player`s or a `playerList`.

`RandomPlayerChoice` will randomly choose a player from the `playerList` that is both alive and available, and not on the `excludePlayers` list. This happens during the `prePlay` phase of the `.play` cycle. 

## Additional Methods

Besides the methods below, `RandomPlayerChoice` also inherits methods from `Choice`. 

### `.playerList(playerList)`

Use to change the `playerList` after the `RandomPlayerChoice` has been created. Can be a `player`, an array of `player`s, a `playerList`, or the string "all".

### `.excludePlayers(playerList)`

Use to change the `excludePlayers` list after the `RandomPlayerChoice` has been created. Can be a `player`, an array of `player`s, or a `playerList`.