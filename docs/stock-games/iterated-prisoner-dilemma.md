# Iterated Prisoner's Dilemma

This is the iterated version of the [Prisoner's Dilemma](./prisoner-dilemma.md). Its arguments are an array of players, a number of iterations, and an optional parameters object. Built using [Iterated](./iterated.md), it returns a `Loop` _playable_.

```js
var players = [p1,p2]
var numIterations = 50
var parameters = {}

var ipd = StockGames["Iterated Prisoner's Dilemma"](players, numIterations, parameters)

ipd.play()
```

* `players` - an array of 2 _Players_
* `numIterations` - the number of times the players face off, defaults to 50
* `parameters` - optional parameters object, which will get passed to the `Loop` _playable_.

## Strategies

This comes with the a number of built-in strategies.

*  [`Tit For Tat`](https://en.wikipedia.org/wiki/Tit_for_tat) - it _Cooperates_ on the first turn, then chooses whatever your opponent choose on the previous turn.
* `Grudger` - Cooperates until your opponent Defects, then only Defects
* `Naive Prober` - Just like `Tit For Tat` but occasionally Defects with default probability 0.1. To change the probability, supply an argument on assignment, eg: `p1.assign("Naive Prober", 0.2)`
* `Tit For Two Tats` - More forgiving `Tit For Tat`. Cooperates, unless your opponent has Defected on the two previous rounds.
