# Expression
To have an automatically, dynamically updating numerical parameter, use an `Expression`. Define an `Expression` by providing a function which returns a number. That function can depend on `Variable`s you've created, like so:
```javascript
var v1 = Variable(1);

var e1 = Expression(function(){
	return v1 + 5;
});

c1.left(e1);
```
In the example, the value of `e1` will always be whatever the value of `v1` is plus 5. Calling `set()` on `v1` to change its value will therefore cause the value of `e1` to change as well.
