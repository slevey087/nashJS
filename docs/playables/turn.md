# Turn

A `turn` is a collection of choices, called concurrently. Use `turn` when players need to make choices simultaneously \(such as any normal-form game\).

```javascript
Turn(choices, {
  id: null,
  usePayoffs: true,
  initializePlayers: false,
  shortCircuit: false,
  writeHistory: true,
  releasePlayers: true
});
```

* `choices` - an array of the `choices` that make up the `turn`.
* Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:true` - If false, then payoffs defined for this `Turn` will be ignored.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Turn` is complete. If true, stop after this `Turn` is complete. \(This will be superceded if the `Turn` is bundled into any other _playable._\)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. \(This will be superceded if the `Turn` is bundled into any other _playable._\)
  * `releasePlayer:true` - When each `Choice` executes, players will be noted as occupied and prevented from being selected by other _playables_. If true, the `Turn` will release all players when finished. \(This will be superceded if the `Turn` is bundled into any other _playable._\)

Bundle any number of `Choices` into a `Turn`:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward

var t1 = Turn([c1, c2]); //c1 and c2 will execute at the same time
t1.play();
```

Once the `Turn` is created, it will create branch functions based on the supplied `Choice`s, and you can set payoffs dependent on the actual choices made. There are two ways to do so. With _implicit payoffs_, supply an array to the branch function. The player in the first choice will receive the first payoff in the array, and so on:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward

var t1 = Turn([c1, c2]);
t1.Left.Back([3, 2]); //If p1 picks Left and p2 picks Back, then p1 will receive a payoff of 3 and p2 will receive a payoff of 2
t1.Left.Forward([1, 4]); //If p1 picks Left and p2 picks Forward, then p1 will receive a payoff of 1 and p2 will receive a payoff of 4
t1["Right"]["Back"]([4, 5]); //The same kind of thing, but using the string index notation.

t1.play();
```

Or you can use _explicit payoffs_, where you name the player who should receive a payoff, by supplying an object where the keys are the player id's and the values are the payoffs. \(This is useful if you'd like a Turn to affect the score of a player who was not involved in it\).

```javascript
t1.Right.Back({ player1: 2, Jimbob: 8 });
```

`Turns` can be chained to other playables in the normal way:

```javascript
c3(t1); //Play c3 after t1, no matter the outcome
```

Or using branches, so that the next game-step depends on the outcome that was selected.

```javascript
c3(t1.Left.Back()); //Play c3 if p1 picks Left and p2 picks Back
```

(Note that the branch function must be called. Payoffs can be set at the same time if desired.)
