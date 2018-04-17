# Variable
For any numerical parameter given in the structure of the game, you can instead create a `Variable` object, and pass that. This object can be updated using `.set()` during the game, to change the structure of the game. This is most easily done using `Lambda`:
```javascript
var v1 = Variable(3);

var c1 = Choice(['left','right']);
c1.left(5);
c1.right(v1);

var L1 = Lambda(function(){
	v1.set(6);
});

c1(L1);

L1.play();
```
In this example, the value of the payoff of 'right' is set to 3 when the game is defined, but when `L1` is played, the value changes to 6. You can also use the original value of the `Variable` to set the new value, such as `v1.set(v1+1)`.This is especially handy for loops.
