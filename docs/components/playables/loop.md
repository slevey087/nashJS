# Loop

`Loop` calls a *playable* repeatedly, a given number of times. This is useful to iterated or evolutionary games, as well as cleaning up code for games with repetition.
```javascript
var l1 = Loop(playable, count, {
    id:null,
    logContinue:false
    initializePlayers:false,
    shortCircuit:false,
    writeHistory:true,
});
```
- `playable` - The *playable* to loop.
- `count` - The number of times to loop (defaults to 1)
- Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `logContinue:false` - If false, omit entries to the `gameHistory` record for each time through the loop, and only record when the loop completes.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Sequence` is complete. If true, stop after this `Sequence` is complete. (This will be superceded if the `Sequence` is bundled into any other *playable.*)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the `Sequence` is bundled into any other *playable.*)

Use `Loop` to repeat simple *playables* like `Choice` or `Turn`:
```javascript
var t1 = Turn(['Left', 'Right']);
var l1 = Loop(t1,5);

l1.play();
```
Or with `Sequence` to loop chains of game-steps:
```javascript
var t1 = Turn(['Left', 'Right']);
var t2 = Turn (['Up', 'Down']);
var t3 = Turn(['Back','Forward']);

t2(t1);
t3(t2);

var s1 = Sequence(t1, t3);
var l1 = Loop(s1, 4);           //t1, then t2, then t3 will play 4 times.
```
