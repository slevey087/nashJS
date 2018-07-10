# Population

`nashJS` uses `PlayerLists` to quickly retrieve information about players. To fetch the `PlayerList` which includes every existing player, use the `Population` function

```js
Population() // returns PlayerList of all players.
```
then use the various `PlayerList` methods to filter the list into a smaller `PlayerList`, or return information on the players in the list. Eg.
```js
Population().onlyAlive().scores() // The scores of only alive players
```

Here is detail on the available methods.

### `.exclude(player)``

Returns the `PlayerList` but sans the specified player(s). Argument can be a single player or array of them.

```js
p1 = Player()
p2 = Player()
Population().exclude(p1) // Returns PlayerList with p2
```


### `.generator`

`PlayerLists` can fall out of date if players are reinitialized, because initialization creates a new `Player` entry. To generate the same `PlayerList` but using up-to-date references, you can run the `.generator` function. If you write a function or a [`Lambda` _Playable_](./playables/lambda.md) which requires a `PlayerList` as input, it is recommended that you accept a generator function instead, then run the function as needed to create an up-to-date `PlayerList`.

### `.ids()`

Returns an array containing the id of each player in the `PlayerList`.

```js
p1 = Player()
p2 = Player()
Population().ids() // Returns ["player1", "player2"]
```

### `.info()`

Returns a list containing object summaries of each player, rather than the player objects.



### `.leader()`

Returns the player with the highest score. If there is a single player, it returns that player. If there's a tie, it returns a `PlayerList` of the tied players.


### `.onlyAlive()`

Returns a `PlayerList` with only the members of the current list who are alive.

### `.onlyAvailable`

Returns a `PlayerList` with only the members of the current list who are not marked busy.


"scores",
"scoresObject",
"scoresMean",
"scoresRange",
"scoresStd",
"strategies",
"strategyDistribution",
"usingStrategy",
