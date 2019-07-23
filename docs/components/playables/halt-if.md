# HaltIf

Use this _playable_ to create a conditional ending point for the game.

```js
var h1 = HaltIf(testFunction, parameters)
```
* `testFunction` - a function that returns true or false.
* Optional parameters:
    * `logContinue:false` - if false, omit a history entry if the _playable`_ does _not_ halt the game.

When `.play()` is called, `HaltIf` will execute the `testFunction`. If it returns truthy, the entire game play sequence will be halted. Otherwise, the game will proceed.

`HaltIf` will write an entry to the history log if the game halts. However, you can use `logContinue` to control whether it writes an entry if the game proceeds. (Since `HaltIf` is likely to get used in loops, and it would be very annoying to see a large number of "continue" entries in the history log, `logContinue` is set to false by default.)