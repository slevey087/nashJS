# Stock Games
nashJS comes pre-programmed with several common games and game skeletons, to save you some time. To access them, first `require` the StockGames object:

```javascript
var StockGames = require('./nashJS').StockGames;
```

Then you can invoke a game by calling its name, for instance:
```javascript
var pd = StockGames["Prisoner's Dilemma"];
```

Most games require some additional arguments, so the command above will invoke a loader function (which must be called with the proper parameters) rather than the `playable` itself. Read the documentation on each stock game for more details.
