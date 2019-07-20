# Expression
To have an automatically, dynamically updating numerical parameter, use an `Expression`. Define an `Expression` by providing a function which returns a number. That function can depend on [`Variable`](./variable.md)s you've created, like so:
```javascript
var v1 = Variable(1);

var e1 = Expression(function(){
	return v1 + 5;
});

c1.left(e1);
```

In the example, the value of `e1` will always be whatever the value of `v1` is plus 5. Calling `set()` on `v1` to change its value will therefore cause the value of `e1` to change as well.

Use arrow functions for compactness.
```js
var e1 = Expression(()=>v1 + 5)
```

As of the current version, `Expression`s must return a number. For more complex datatypes, use [ComplexVariable](./complex-variable.md )

To change an expression without breaking any references, use `.set`
```js
var e1 = Expression(()=>v1 + 5)
e1.set(()=>v1 + 6)
```