# RandomVariable

`RandomVariable` is a play-time logic object specifically meant for generating random numbers as play-time parameters. You can use built-in generators or supply your own.

```js
var r1 = RandomVariable({lowerbound:0, upperbound:10, generator:"uniform"})
r1 + 5 // will return a different number each time.
```

To supply your own random number generator, pass it in in the `generator` argument. It should be a function which returns a single number when called.

Currently, the only built-in generator is the uniform generator. Adjust the `upperbound` and `lowerbound` to get different numbers.
