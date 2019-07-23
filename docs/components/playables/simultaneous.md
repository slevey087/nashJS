# Simultaneous

`Simultaneous` plays multiple _playables_ at the same time. (Javascript is a single-threaded language, so they are not actually being played in parallel, but since _playables_ are asynchronous, `Simultaneous` executes one step of each _playable_, followed by the next step of each _playable_, etc.)

```javascript
Simultaneous(playableArray, parameters);
```

* `playableArray` - an array of _playables_ to execute simultaneously.
* Optional parameters: none.

`Simultaneous` will call `.play()` on each _playable_ supplied within _playableArray_. It will not continue down its next-branch until all _playables_ in the array have completed.

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p2, ["Up", "Down"]);
var c3 = Choice(p3, ["Back", "Forward"]);

var S1 = Simultaneous([c1, c2, c3]);
// c1, c2, and c3 will be called at the same time, and be players in them will be given identical information sets.
```
