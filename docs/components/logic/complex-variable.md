# Complex Variables

While [`Variable`](./variable.md) can be used for numbers and [`Expression`](./expression.md) for functions, to use dynamic play-time logic with arrays or objects, you must use `ComplexVariable`. 

```js
var c = ComplexVariable([1,5,9])
c[0] // 1

var d = ComplexVariable({a:"hi"})
c.a // "hi"
```

While you can often simply use a regular object or array instead, the beauty of `ComplexVariable` is that you can call `.set()` on it to change it to an entirely different object, without breaking any references. 

```js
c = ComplexVariable([1,5])
c[0] // 1
c.set([5,9])
c[0] // 5
```
In exchange however, you give up easy comparison.
```js
var a = // some array or object
c = ComplexVariable(a)
c === a // false
c == a // false
```
However you can call the `ComplexVariable` to retrieve the reference object.
```js
c() === a // true
```

