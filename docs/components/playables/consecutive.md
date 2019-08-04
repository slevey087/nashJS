# Consecutive

`Consecutive` converts a series of _playables_ into a _playable._ This is useful for supplying longer chains to _playables_ that act on other _playables_ (such as loops) or for cleaning up code by defining your own composite _playables_.

```javascript
Consecutive(playablesArray, parameters);
```

* `playablesArray` - an array of _playables_ to play one after another.
* Optional parameters: none.

When `.play()` is called, `Consecutive` will call `.play()` on each _playable_ in the `playablesArray`, one at a time, in order. 

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p1, ["Up", "Down"]);
var c3 = Choice(p1, ["Back", "Forward"]);

var s1 = Consecutive([c1, c2, c3]);
//Calling s1.play() will run c1, then c2, then c3.
```

`Consecutive` will **only** call the _playable_ itself, and will not let any of these sub-_playables_ continue down their own next-branches (it will "short-circuit" them).

```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p1, ["Up", "Down"]);
var c3 = Choice(p1, ["Back", "Forward"]);

var c4 = Choice(p1, ["Now","Later])
c4(c3)

var s1 = Consecutive([c1, c2, c3]);
//Calling s1.play() will run c1, then c2, then c3. It will NOT call c4, even though calling c3.play() by itself would run c3 then c4.
```

`Consecutive` also comes with a helper function to quickly get the ids of all its sub-playables.
```javascript
var c1 = Choice(p1, ["Left", "Right"]);
var c2 = Choice(p1, ["Up", "Down"]);
var c3 = Choice(p1, ["Back", "Forward"]);

var s1 = Consecutive([c1, c2, c3]);

s1.ids() // returns the same as [c1.id(), c2.id(), c3.id()]
```


