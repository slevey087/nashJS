# Players

A game requires players. First import the `Player` parent function, then create some players like so:

```javascript
var {Player} = require('nash-js');
var p1 = Player({/*optional parameters*/});;
```

Players require a *strategy*, which is a sequence of code that tells the player what to do. (See [Strategies](./strategies.md) for how to create a *strategy*). Assign a player a strategy by referring to the strategy by name. You can do so when creating the player:
```javascript
var p1 = Player({assign:"Tit For Tat"});
```
Or later using the `assign` function:
```javascript
var p1 = Player();
p1.assign("Tit For Tat");
```

If the strategy allows for parameters, they can be passed using `.assign`:
```js
//Naive Prober can take a single parameter specifying a probability.
p1.assign("Naive Prober", 0.2)
```

## Methods

Player objects have a number of methods. The most useful are probably `.assign` to assign a strategy and `.score()` to view its current score. But here's more detail.

### .alive()

Returns a true/false specifying if the player is alive. If the player is not alive, certain _playables_ will throw an error.

### .assign(strategy, ...args)

Assigns the `strategy` to the player, using the additional `args` if present. `strategy` should be a string, the strategy name.

### .available()

Returns true/false specifying if the player is available. If the player is not available, certain actions (such as `RandomPlayerChoice`) will not select this player. This is toggled using `.busy()` and `.release()`.

### .busy()

Sets the player's `available` property to false.

### .history()

Returns the history of the player.

### .id()

Returns the player's id.

### .kill()

Sets the player's `alive` property to false. Can only be called once.

### .release()

Sets the player's `available` property to true.

### .resetScore()

Sets the player's score to zero.

### .score()

Returns the value of the player's score.

### .strategy()

Returns the name of the strategy currently assigned to the player.
