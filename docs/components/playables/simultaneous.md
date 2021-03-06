# Simultaneous

`Simultaneous` plays multiple _playables_ at the same time. (Javascript is a single-threaded language, so they are not actually being played in parallel, but since _playables_ are asynchronous, `Simultaneous` executes one step of each _playable_, followed by the next step of each _playable_, etc.)

```javascript
Simultaneous(playableArray, {
  id: null,
  initializePlayers: false,
  shortCircuit: false,
  writeHistory: true
});
```

* `playableArray` - an array of _playables_ to execute simultaneously.
* Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Sequence` is complete. If true, stop after this `Sequence` is complete. (This will be superceded if the `Sequence` is bundled into any other _playable._)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the `Sequence` is bundled into any other _playable._)

`Simultaneous` will call `.play()` on each _playable_ supplied within _playableArray_. It will not continue down its next-branch until all _playables_ in the array have completed.

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p2, ["Up", "Down"]);
var c3 = Choice(p3, ["Back", "Forward"]);

var S1 = Simultaneous([c1, c2, c3]);
// c1, c2, and c3 will be called at the same time, and be players in them will be given identical information sets.
```
