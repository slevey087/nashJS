# Stochastic

This place-holder _playable_ allows for stochastic next-branching. That is, calling `.play` on it doesn't really do anything, but the magic is all in the branching: it will randomly select a branch to continue down, with user-defined probabilities.

```js
var probabilities = [ /* an array of positive numbers, which add to no more than 1 */ ]
var s1 = Stochastic(probabilities, {
    omitHistories: true
})
```

* `parameters` - should be an array of positive numbers, which should add to no more than 1. They can add to less than 1. 
* Optional parameters:
    * `omitHistories:true` - if set to `true`, then no history will be logged by this _playable_. This is meant to keep logs tidy, as playing this _playable_ doesn't really *do* anything per se, and by looking at the log for other entries it will be obvious what the results of this one were.

`probabilities` should be an array of the probability values. However, these do not have to sum to 1, because `Stochastic` will add an extra, residual value, which takes on the difference between 1 and the sum, even if that's zero. (This is so that you can use [`Variable`s](../logic/variable.md) in order to change the values during game-play.)

Once defined, `Stochastic` creates an array of branches attached to the _playable_, which can be used for next-chaining in the same was as normal _playables_. Each item in the array corresponds to the corresponding probability in the `probabilities` list. 
```js
var l1 = // some other playable
var l2 = // also a playable

var probabilities = [.4, .6]
var s1 = Stochastic(probabilities)

l1(s1[0])
l2(s1[1])

s1.play() // will play l1 with a 40% chance, or l2 with a 60% chance
```

The probabilities do not need to add to 1, as `Stochastic` will always create one extra entry to take on any residual probability. 

```js
var l1 = // some other playable
var l2 = // also a playable
var l3 = // also a playable

var probabilities = [.4, .1]
var s1 = Stochastic(probabilities)

l1(s1[0])
l2(s1[1])
l3(s1[2])

s1.play() // will play l1 with a 40% chance, l2 with a 10% chance, or l3 with  50% chance
```