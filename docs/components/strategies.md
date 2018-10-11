# Strategies

TODO: all this stuff Here


## Stock Debugging Strategies

`NashJS` comes with several simple strategies meant for speedy debugging. Each of the following is loaded by calling a method on `Strategies`. Each returns its own name, so that it can be loaded and assigned to a player at the same time, eg.

Each strategy takes a `methods` argument, outlining which strategy methods to create. Even if you supply nothing, `choose` and `range` (the default methods for `Choice` and `Range` will be created)
```js
var p1 = Player({assign:Strategies.dummy()})
```

### dummy
```js
// to load, returns string "dummy"
Strategies.dummy([methods =[]])
```

A simple strategy, which merely calls `return`.

### debugger
```js
Strategies.debugger([methods =[]])
```

Calls to this strategy will invoke the `debugger` keyword, which, in certain Javascript environments, will freeze execution and start the debugger.

### logger
```js
Strategies.logger(methods = [])
```

Calls to this strategy will call `console.log` and display the `options` and `information` data that gets delivered to the strategy.

### quick
```js
Strategies.quick(func, methods = [])
```

Simply a shortcut to create a simple strategy using a user-supplied function. `func` will get called with `(options, information)` and the returned value will be the returned value of the strategy.
