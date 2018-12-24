# Population

`nashJS` uses [`PlayerLists`](./playerList.md) to quickly retrieve information about players. To fetch the `playerList` which includes every existing player, use the `Population` function

```js
Population() // returns PlayerList of all players.
```
then use the various `PlayerList` methods to filter the list into a smaller `PlayerList`, or return information on the players in the list. Eg.
```js
Population().onlyAlive().scores() // The scores of only alive players
```

For details on various inherited methods, see [`PlayerList`](./playerList.md). 

There is also a method unique to `Population`, the `.size` shortcut. This is a way to quickly determine the number of existing players, without need of creating a `playerList`.

```js
Population.size() // returns the number of existing players, eg. 5
```

Note that `Population` is not called as a function to use the `.size()` shortcut, but it is called as a function to return the full `playerList` in order to use `PlayerList` methods. 

