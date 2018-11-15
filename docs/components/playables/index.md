# Playables

In **nashJS**, the game structure is defined in advance, then executed. The atom unit in **nashJS** is called a _playable._ A _playable_ is an object that can be called to execute a step of the game, using the `.play()` function. _Playables_ can be chained together in various ways to form multi-step games, and these chains can themselves form a _playable._

### Working With _Playables_

Import the _playables_ you'd like to use using `require`, for instance:

```js
var { Choice, Turn, Sequence, Loop } = require("nashJS").Playables;
```

A _playable_ is created by calling its parent function, with the necessary arguments and optional parameters.

```js
var c1 = Choice(*** arguments here ***, {*** optional parameters here ***});
```

You can execute this step of the game by using `.play()`:

```js
c1.play();
```

You can form sequences by chaining _playables_ together. This can be done in 2 ways. Either use a throw-away variable \(this is useful for simple sequence games\):

```js
var game = Choice(*** arguments here ***); //This Choice will play first
var x = Choice(*** some other arguments***)(game); //then this one

x = Choice(*** even more arguments***)(x); //then this one
x = Choice(*** so argumentative ***)(x); //And finally this one

game.play(); //Run the game!
```

Or create a name for each _playable_ (this is helpful for games with more complicated and branching structures\):

```js
var c1 = Choice(***arguments here ***); //This Choice will play first
var c2 = Choice(*** some other arguments***);
var c3 = Choice(*** even more arguments***);

c2(c1); //Play c2 after c1
c3(c2); //Play c3 after c2

c1.play();
```

_Playables_ can have multiple next-steps, simply by chaining multiple times:

```javascript
c2(c1); //Play c2 after c1
c3(c1); //Also play c3 after c1.
```

Some _playables_ also can form several branches of chains. This is outlined in more detail in specific _playable_ descriptions, following immediately.

## Playable Reference

### Basic Playables

* [Choice](./choice.md)
* [Range](./range.md)
* [Turn](./turn.md)

### Control Playables

* [Sequence](./sequence.md)
* [Simultaneous](./simultaneous.md)
* [Loop](./loop.md)
* [Lambda](./lambda.md)

### Stochastic Playables
