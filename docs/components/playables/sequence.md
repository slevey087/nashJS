# Sequence

`Sequence` converts a chain of _playables_ into a _playable._ This is useful for supplying longer chains to _playables_ that act on other _playables_ (such as loops) or for cleaning up code by defining your own composite _playables_.

```javascript
Sequence(playableStart, playableFinish, parameters);
```

* `playableStart` - any _playable_ with which to begin the sequence.
* `playableFinish` - the _playable_ that should end the sequence.
* Optional parameters: none.

`Sequence` will call `.play()` on the _playable_ supplied as _playableStart_, then continue down the chain until either it reaches _playableFinish_ or until the chain finishes.

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p1, ["Up", "Down"]);
var c3 = Choice(p1, ["Back", "Forward"]);

c2(c1);
c3(c2);

var s1 = Sequence(c1, c2);
//Calling t1.play() would cause c1, then c2, then c3 to play. Calling s1.play() will cause only c1 then c2 to play.
```

If the sequence doesn't reach _playableFinish_, it will simply end when there are no more branches to play:

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p1, ["Up", "Down"]);
var c3 = Choice(p1, ["Back", "Forward"]);

c2(c1); //There is no path from c1 to c3

var s1 = Sequence(c1, c3);
//Calling s1.play() will cause c1 then c2 to play.
```

Note that every _playable_ chained to `playableStart` will play, even if that branch does not lead to `playableFinish\*:

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p1, ["Up", "Down"]);
var c3 = Choice(p1, ["Back", "Forward"]);

c2(c1);
c3(c1); //Here, c2 and c3 are both chained to c1

var s1 = Sequence(c1, c2);
//Calling s1.play() will cause c1, c2, and c3 to play, even though c3 is not on the branch that leads to c2.
```
