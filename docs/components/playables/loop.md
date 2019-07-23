# Loop

`Loop` calls a *playable* repeatedly, a given number of times. This is useful to iterated or evolutionary games, as well as cleaning up code for games with repetition.
```javascript
var l1 = Loop(playable, count, {    
    logContinue:false,
    parameters:{}
});
```
- `playable` - The *playable* to loop.
- `count` - The number of times to loop (defaults to 1)
- Optional parameters:
  * `logContinue:false` - If false, omit entries to the `gameHistory` record for each time through the loop, and only record when the loop completes.
  * `parameters:{}` - these parameters will be passed to `.play()` of the underlying _playable_. (However, standard parameters such as `history` and `inflrmation` may be overwritten to facilitate looping.) 
  
Use `Loop` to repeat simple *playables* like `Choice` or `Turn`:
```javascript
var t1 = Turn(['Left', 'Right']);
var l1 = Loop(t1,5);
// play t1 5 times
l1.play();
```
Or with `Sequence` or `Consecutive` to loop chains of game-steps:
```javascript
var t1 = Turn(['Left', 'Right']);
var t2 = Turn (['Up', 'Down']);
var t3 = Turn(['Back','Forward']);

var c1 = Consecutive([t1, t2, t3]);
var l1 = Loop(c1, 4);           //t1, then t2, then t3 will play 4 times.
```
