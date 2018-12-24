# PlayerList

`nashJS` uses `PlayerLists` to quickly retrieve information about players. It is an array, but which includes additional methods to filter and retrieve useful information. To create a playerlist, use the constructor:

```js
var p1 = Player()
var p2 = Player()
var p3 = Player()

var players = new PlayerList([p1,p2,p3])
// or
var players = new PlayerList(p1,p2,p3)
```

The `Population` function is a fast way to get a `playerList` of every eixsting player.

```js
Population() // returns a playerList with every player
```

## Methods



### `.assign(strategy)`

The mass version of the `player` method `.assign()`. Will assign the specified strategy to every player in the list.

```js
var players = new PlayerList(p1,p2,p3)
players.assign("ChooseFirstOption")
```

### `.exclude(player)``

Returns the `PlayerList` but sans the specified player(s). Argument can be a single player or list or array of them.

```js
var players = new PlayerList(p1,p2,p3)

players.exclude(p1) // Returns PlayerList with p2, p3
players.exclude(p1,p2) // Returns PlayerList with p3
players.exclude([p1,p2]) // Returns PlayerList with p3
```


### `.generator`

`PlayerLists` can fall out of date if players are reinitialized, because initialization creates a new `Player` entry. To generate the same `PlayerList` but using up-to-date references, you can run the `.generator` function. If you write a function or a [`Lambda` _Playable_](./playables/lambda.md) which requires a `PlayerList` as input, it is recommended that you accept a generator function instead, then run the function as needed to create an up-to-date `PlayerList`.

```js
var players = new PlayerList(p1,p2,p3)
players.generator() // will return the same PlayerList, but with the latest references
```

### `.ids()`

Returns an array containing the id of each player in the `PlayerList`.

```js
var players = new PlayerList(p1,p2,p3)
players.ids() // Returns, eg. ["player1", "player2", "player3"]
```

### `.info()`

Returns a list containing object summaries of each player, rather than the player objects.

### `.kill()`

Kill all players in the playerlist.

```js
var players = new PlayerList(p1,p2,p3)
players.kill() // marks p1, p2, p3 as not alive.
```

### `.leader()`

Returns the player with the highest score. If there is a single player, it returns that player. If there's a tie, it returns a `PlayerList` of the tied players.

```js
var players = new PlayerList(p1,p2,p3)
players.leader() // if, say, p2 has the highest score, then, returns p2
```

### `.markAvailable`

Registers all players in the list as available for decision-making.

```js
var players = new PlayerList(p1,p2,p3)
players.markAvailable() // marks p1, p2, p3 as available.
```


### `.markBusy`

Registers all players in the list as unavailable for decision-making.

```js
var players = new PlayerList(p1,p2,p3)
players.markBusy() // makrs p1, p2, p3 as unavailable.
```


### `.onlyAlive()`

Returns a `PlayerList` with only the members of the current list who are alive.

```js
var players = new PlayerList(p1,p2,p3)
p2.kill()
players.onlyAlive() // returns playerList of p1, p3
```

### `.onlyAvailable()`

Returns a `PlayerList` with only the members of the current list who are not marked busy.

```js
var players = new PlayerList(p1,p2,p3)
p2.markBusy()
players.onlyAvailable() // returns playerList of p1, p3
```


### `.resetScores()`

Sets the scores of all players in the list to zero.

```js
var players = new PlayerList(p1,p2,p3)
players.resetScores() // sets scores of p1, p2, p3 to zero.
```

### `.scores()`

Returns an array of the scores of each player in the list, in the order that they appear in the list.

```js
var players = new PlayerList(p1,p2,p3)
players.scores() // returns scores array, eg. [2,3,6]
```


### `.scoresByStrategy`

Returns an object whose keys are a strategy name, and whose values are arrays of the scores of players with that strategy.
```js
var players = new PlayerList(p1,p2,p3)
var scores = players.scoresByStrategy() // returns, eg, {ChooseFirst: [2,6], ChooseSecond:[3]}
```

The returned object also comes with a `.totals` method which returns another object with the scores totaled.
```js
scores.totals() // returns, eg, {ChooseFirst:8, ChooseSecond:3}
```


### `.scoresByStrategyTotals`

Returns an object whose keys are a strategy name, and whose values are the total score of all players with that strategy.

```js
var players = new PlayerList(p1,p2,p3)
players.scoresByStrategyTotals() // returns, eg {ChooseFirst:8, ChooseSecond, 3}
```

Note that this is the same as running 
```js
players.scoresByStrategy().totals()
```


### `.scoresObject`

Returns an object whose keys are player ids, and values are their score.

```js
var players = new PlayerList(p1,p2,p3)
players.scoresObject() // returns, eg. {player1:2, player2:3, player3:6}
```


### `.scoresMean()`

Returns the mean the scores of all players in the list.

```js
var players = new PlayerList(p1,p2,p3)
players.scoresMean() // returns, eg. 3.666
```


### `.scoresRange()`

Returns an array whose first value is the lowest score from the players in the list, and whose second (and final) entry is the highest score.

```js
var players = new PlayerList(p1,p2,p3)
players.scoresRange() // returns, eg [2,6]
```


### `.scoresStd()`

Returns the (population) standard deviation of the scores of the players in the list.

```js
var players = new PlayerList(p1,p2,p3)
players.scoresStd() // returns, eg. 1.6997

```

### `.strategies()`

Returns an array of the strategy name of each player in the list, in the order of the players.

```js
var players = new PlayerList(p1,p2,p3)
players.strategies() // returns, eg. ["ChooseFirst", "ChooseSecond", "ChooseFirst"]
```


### `.strategyDistribution()`

Returns an object whose keys are the names of each strategy and whose values are the number of players from the list who are using it. (Strategies not being used by any player in the list are ommitted.)

```js
var players = new PlayerList(p1,p2,p3)
players.strategyDistribution() // returns, eg. {ChooseFirst:2, ChooseSecond:1}
```


### `.usingStrategy(strategy)`

Returns a `playerList` with only players who are using the given `strategy`.

```js
var players = new PlayerList(p1,p2,p3)
players.usingStrategy("ChooseFirst") // returns, eg. a playerList with p1, p3
