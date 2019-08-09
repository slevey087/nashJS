# StochasticHalt

Use this _playable_ to create a stochastic stopping point for the game. Supply a probability, and when `.play` is called, `StochasticHalt` will end the game randomly with that probability.
```js
var probability = // a number between 0 and 1
var parameters = // optional parameters object
var sh = StochasticHalt(probabillity, parameters)

var p1 = // some playable
var p3 = // some other playable

sh(p1)  // play sh after p1
p3(sh)  // play p3 after sh

p1.play() // will play p1, then there's a chance that it will either halt the game, or go on to p3
```
`StochasticHalt` is an extension of [`HaltIf`](./halt-if.md), and so they share the same optional parameters.
