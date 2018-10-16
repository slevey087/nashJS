# Range

A core building block of nashJS,  `Range` is very much like [Choice](./choice.md), except instead of discrete `options,` the user can select from a continuous range, given lower and upper `bounds`. A `range` defines a single continuous selection made by a single player. For instance, _player2_ might be asked to select a number between 1 and 100.

```javascript
Range(player, bounds, {
  id: null,
  initializePlayers: false,
  usePayoffs: false,
  shortCircuit: false,
  writeHistory: true,
  releasePlayer: true
});
```

* `player` - the reference object of the player who makes the choice (more on this in the `player` section.
* `options` - an array of specifying the bounds that player may select from in between. For instance: `[1,100]`. The first value is the lower bound, the second value is the upper bound, and an optional 3rd value specifies an increment (see below).
* Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:false` - If false, then payoffs defined for this Range will be ignored. (This will be superceded if the Range is bundled into Turn or any other _playable._)
  * `shortCircuit:false` - If false, proceed down the chain as normal after the Range is complete. If true, stop after this Range is complete. (This will be superceded if the Range is bundled into Turn or any other _playable._)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the Range is bundled into Turn or any other _playable._)
  * `releasePlayer:true` - When the Range executes, players will be noted as occupied and prevented from being selected by other _playables_. If true, the Range will release the player when finished. (This will be superceded if the Range is bundled into Turn or any other _playable._)

To create a game-step that involves only a single-player making a choice, use Range by itself.

```javascript
var r1 = Range(p1, [0,30]); //p1 will choose a number between 0 and 30 inclusive
r1.play();
```

To specify an increment, use a third value in the `bounds`, eg. to ask the user to pick a multiple of 5 between 0 and 30, use `[0,30,5]`. (If the user doesn't choose the correct increment, their response will be rounded to the nearest correct value)

```javascript
var r1 = Range(p1, [0,30,5]); //p1 will choose a multiple of 5 between 0 and 30 inclusive
r1.play(); 	// If the user chose 22, it would be rounded to 20.
```

## Branching and Payoffs

You can chain from Range to create sequences, just like any _playable_:

```javascript
var r1 = Range(p1, [0,5]); //p1 will choose from 0 to 5
var r2 = Range(p2, [5,10]); //p2 will choose from 5 to 10

r2(r1); //Play r2 after r1

r1.play();
```

Much like `Choice`, you can provide branching and payoff behavior dependent on the player's response. However, because the player has (nearly) an infinite array of options, this interface is somewhat more complex than that of `Choice`. You can create a possible branch using the `.outcome` method, which must be supplied an `evaluator` function which returns true for a certain set of outcomes.

For instance, suppose the user was asked to choose between 0 and 10, and you wanted payoffs/branching to be determined by whether the response was greater or less than 5:

```javascript
var r1 = Range(p1, [0,10]); //p1 will choose 0 through 5

var r1_low = r1.outcome(function(result){
	if (result < 5) return true
})

var r1_high = r1.outcome(function(result){
	if (result >= 5) return true
})


r1_low(2)	// set the payoff for choosing a number less than 5 to be 2
r1_high(3)	// set the payoff for choosing a number greater than or equal to 5 to be 3

r1.play();
```

The exact same structure works for branching

```javascript
var r1 = Range(p1, [0,10]); //p1 will choose 0 through 5

var r1_low = r1.outcome(function(result){
	if (result < 5) return true
})

var r1_high = r1.outcome(function(result){
	if (result >= 5) return true
})


var c1 = Choice(p2, ["left","right"]) // p2 will choose between left or right
var c2 = Choice(p2, ["up","down"]) 	// p2 will choose between up or down

c1(r1_low)	// If p1 chooses a number less than 5 for r1, play c1 next.
c2(r1_high)	// If p1 chooses a number greater than or equal to 5, play c2 next.

r1.play();
```

You can use the outcome object to set the payoff at the same time, ie. `c2(r1_low(2))`.

Obviously, a more compact way to write the branching for the previous example would be
```js
var r1 = Range(p1, [0,10]); //p1 will choose 0 through 5
var c1 = Choice(p2, ["left","right"]) // p2 will choose between left or right
var c2 = Choice(p2, ["up","down"]) 	// p2 will choose between up or down

c1(r1.outcome(function(result){
	if (result < 5) return true;
}));

c2(r1.outcome(function(result){
	if (result >= 5) return true;
}));

r1.play();
```

Much like with `Choice`, you can simulate the payoffs that will be awarded using the `.payoffs()` method. Analogous to how a `choice.payoffs()` call returns an object whose keys are possible outcomes, a `range.payoffs()` call returns a function whose argument is a possible outcome. That is,
```js
var r1 = Range(p1, [0,10]); //p1 will choose 0 through 5
var c1 = Choice(p2, ["left","right"]) // p2 will choose between left or right

c1.payoffs()["left"] // returns the payout for choosing "left"
r1.payoffs()(4) 	// returns the payout for choosing 4.
```
