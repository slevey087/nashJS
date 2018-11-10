# Lambda

Using `Lambda`, you can create a _playable_ with arbitrary functionality. `Lambda` will run a custom function that you supply when creating it. 

```javascript
Lambda(action, options, {
  id: null,
  initializePlayers: false,
  usePayoffs: false,
  shortCircuit: false,
  writeHistory: true,
});
```

* `action` - a function which will be called when the `Lambda` is executed. 
* Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:false` - If false, then payoffs defined for this Choice will be ignored. (This will be superceded if the Choice is bundled into Turn or any other _playable._)
  * `shortCircuit:false` - If false, proceed down the chain as normal after the Choice is complete. If true, stop after this Choice is complete. (This will be superceded if the Choice is bundled into Turn or any other _playable._)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the Choice is bundled into Turn or any other _playable._)

  `Lambda` is very useful for changing [Variables] (../logic/variable.md) during game-play. Eg.

  ```javascript
var p1 = Player()

// assign a strategy here, etc.

var c1 = Choice(p1,["l","r"])   // A choice for p1 between l and r

var v1 = Variable(5)

c1.l(v1) // assign a payoff for 5

var l1 = Lambda(function(){
    // if p1's score is greater than 5, change the payoff for c1 to 4
    if (p1.score > 3) v1.set(4)     
})
  ```