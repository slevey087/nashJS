# Choice

This is a core building block of nashJS. A `choice` defines a single selection made by a single player. For instance, _player2_ might choose between "cooperate" and "defect."

```javascript
Choice(player, options, {
  id: null,
  initializePlayers: false,
  usePayoffs: false,
  shortCircuit: false,
  writeHistory: true,
  releasePlayer: true
});
```

* `player` - the reference object of the player who makes the choice (more on this in the `player` section.
* `options` - an array of the available options that the player may select from. For instance: `["cooperate","defect"]`.
* Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:false` - If false, then payoffs defined for this Choice will be ignored. (This will be superceded if the Choice is bundled into Turn or any other _playable._)
  * `shortCircuit:false` - If false, proceed down the chain as normal after the Choice is complete. If true, stop after this Choice is complete. (This will be superceded if the Choice is bundled into Turn or any other _playable._)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the Choice is bundled into Turn or any other _playable._)
  * `releasePlayer:true` - When the Choice executes, players will be noted as occupied and prevented from being selected by other _playables_. If true, the Choice will release the player when finished. (This will be superceded if the Choice is bundled into Turn or any other _playable._)

To create a game-step that involves only a single-player making a choice, use Choice by itself. You can set payoffs dependent on the choice made:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
c1.left(3); //Payoff 3 for choosing left
c1.right(4); //Payoff 4 for choosing right.

c1.play();
console.log(p1.score()); //Either 3 or 4
```

You can chain from Choice to create sequences, just like any _playable_:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward

c2(c1); //Play c2 after c1

c1.play();
```

and you can also create specific branches depending on the outcome of the choice:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward
var c3 = Choice(p3, ["Up", "Down"]); //p3 will choose up or down

c2(c1.Left); //If p1 chooses Left, go to c2
c3(c1.Right); //If p1 chooses Right, go to c3

c1.play();
```

You can use the branch function to set the payoff at the same time, ie. `c2(c1.Left(2))``
