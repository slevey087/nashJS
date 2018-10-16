# Turn

A `turn` is a collection of [choices](./choice.md) or [ranges](./range.md), called concurrently. Use `turn` when multiple players need to make choices simultaneously \(such as any normal-form game\).

```javascript
Turn(choices, {
  id: null,
  usePayoffs: true,
  initializePlayers: false,
  shortCircuit: false,
  writeHistory: true,
  releasePlayers: true,
	forceOutcomeMode: false
});
```

* `choices` - an array of the `choices` or `ranges` that make up the `turn`.
* Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:true` - If false, then payoffs defined for this `Turn` will be ignored.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Turn` is complete. If true, stop after this `Turn` is complete. \(This will be superceded if the `Turn` is bundled into any other _playable._\)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. \(This will be superceded if the `Turn` is bundled into any other _playable._\)
  * `releasePlayer:true` - When each `Choice` executes, players will be noted as occupied and prevented from being selected by other _playables_. If true, the `Turn` will release all players when finished. \(This will be superceded if the `Turn` is bundled into any other _playable._\)
	* `forceOutcomeMode:false` - if true, the `turn` will operate using `.outcome()` and `Evaluators` even if all of the sub-playables are `Choice`. More on that below.

Bundle any number of `choices` or `ranges` into a `turn`:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward

var t1 = Turn([c1, c2]); //c1 and c2 will execute at the same time
t1.play();
```

```javascript
var r1 = Range(p1, [0,5]); //p1 will choose a number from 0 to 5
var r2 = Range(p2, [5,10]); //p2 will choose a number from 5 to 10
var c3 = Choice(p3, ["Back", "Forward"]); //p3 will choose back or forward

var t2 = Turn([r1, r2, c3]); //c1 and c2 will execute at the same time
t2.play();
```

## Branching and Payoffs

A `turn` operates branching and payoffs in one of two modes, depending on what its sub-playables are. If they are all `choices`, then the `turn` will do branching very similar to [Choice](./choice.md), using a tree of `Branch` objects. If any of the sub-playables are `range`, then the `turn` will handle branching more similar to [Range](./range.md), using `.outcome()` and `Evaluators`.

In "tree" mode, once the `Turn` is created, it will create branches based on the supplied `choice`s as trees on the `turn` object, and you can set payoffs dependent on the actual choices made. There are two ways to do so. With _implicit payoffs_, supply an array to the branch function. The player in the first choice will receive the first payoff in the array, and so on:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward

var t1 = Turn([c1, c2]);
t1.Left.Back([3, 2]); //If p1 picks Left and p2 picks Back, then p1 will receive a payoff of 3 and p2 will receive a payoff of 2
t1.Left.Forward([1, 4]); //If p1 picks Left and p2 picks Forward, then p1 will receive a payoff of 1 and p2 will receive a payoff of 4
t1["Right"]["Back"]([4, 5]); //The same kind of thing, but using the string index notation.

t1.play();
```

You may also follow the _implicit payoffs_ with _explicit payoffs_, where you name the player who should receive a payoff, by supplying an object where the keys are the player id's and the values are the payoffs. \(This is useful if you'd like a Turn to affect the score of a player who was not involved in it\).

```javascript
t1.Right.Back([4, 5, { player1: 2, Jimbob: 8 }]);
```

If you'd only like to set explicit payoffs, just use `null` where the implicit payoffs should be.

```javascript
t1.Right.Back([null, null, { player1: 2, Jimbob: 8 }]);
```

`Turns` can always be chained to other playables in the normal way:

```javascript
c3(t1); //Play c3 after t1, no matter the outcome
```

To make the next game-step depend on the outcome that was selected, in tree mode, use the branch objects

```javascript
c3(t1.Left.Back); //Play c3 if p1 picks Left and p2 picks Back
```

Payoffs can be set at the same time if desired:

```javascript
c3(t1.Left.Back([4,5])); //Play c3 if p1 picks Left and p2 picks Back, and set payoffs 4,5
```

If any of the sub-playables are `Range`, then the `turn` operates using `.outcome()` and `Evaluators`. In this "outcome mode", you can create a branch using `.outcome()`. Supply `.outcome` with an evaluator function which will accept the results of the `turn` as an array, and return true to apply the outcome branch:

```js
var r1 = Range(p1, [0,10]); //p1 will choose a number from 0 to 10
var r2 = Range(p2, [0,10]); //p2 will choose a number from 0 to 10

var t1 = Turn([r1, r2]); //c1 and c2 will execute at the same time
var o1 = t1.outcome(function(results){
	// This outcome will be applied if both players choose low numbers
	if (results[0] < 5 && results[1] < 5) return true
})

// if o1 happens, p1 will receive a payoff of 1 and p2 will receive 4
o1([1,4]);

// If o1 happens, play c3 next.
c3(o1);

t1.play();
```

And of course, the outcome does not have to be split out into a separate variable. The above example can be written in more compact fashion:

```js
var r1 = Range(p1, [0,10]); //p1 will choose a number from 0 to 10
var r2 = Range(p2, [0,10]); //p2 will choose a number from 0 to 10

var t1 = Turn([r1, r2]); //c1 and c2 will execute at the same time

// Create outcome, set payoffs, and set branching all in one step
c3(t1.outcome(function(results){
	if (results[0] < 5 && results[1] < 5) return true
})([1,4]))

t1.play();
```

If all of the sub-playables are `Range`, then the `results` array given to the `Evaluator` should be an array of numbers. But if some of them are `Choice`, then that particular result will simply be the string of the chosen value:

```js
var r1 = Range(p1, [0,10]); //p1 will choose a number from 0 to 10
var c2 = Choice(p2, ["Left","Right"]); //p2 will choose Left or Right

var t1 = Turn([r1, c2]); //c1 and c2 will execute at the same time

t1.outcome(function(results){
	// Apply this outcome if p1 chooses a low number and p2 chooses Left
	if (results[0] < 5 && results[1] == "Left") return true
})([1,4]) // Set payoffs 1,4 for this outcome

t1.play();
```

(If you really prefer outcome mode but you are only using `Choice`s, you can set `forceOutcomeMode` to true when you create the `Turn`)
