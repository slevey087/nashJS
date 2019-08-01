# OutcomeTree

OutcomeTree is a class to help with certain forms of complex branching, specifically branching with multiple discrete possibility sets. That is, suppose two Choices are made as part of a Turn, where the first choice is between Left and Right, and the second between Up and Down. The possible results are Left->Up, Left->Down, Right->Up, Right->Down. In order to store different possible payoffs or next-branches for each possible outcome, OutcomeTree can help.

This page will document this class, but you will probably not need to use it unless you are [building a custom playable](./custom-playable.md) with discrete branching behavior.

Create one like so:
```js
var {OutcomeTree} = require("./lib/engine").Backend.Classes

var map = // array of arrays with possible outcome sets, eg [["Left", "Right"], ["Up", "Down"]]
var val = // the value to write to each key in the tree

var tree = new OutcomeTree(map, val)
```

Since the same value gets written to every key, this may present difficulties if you'd like, say, an empty array in each position, as supplying `[]` to `val` would write _the same_ array in each branch. To get around this, you can instead supply a `valGenerator`, a function which will be called to generate the value for each position.

```js
var valGenerator = function(){return []}

var tree = new OutcomeTree(map, null, valGenerator)
```

Additionally, if the `val` is a function, then it will be wrapped such that when it gets called, its first argument will be an array with the path of the tree it's on. 
```js
var val = function(path, otherArgs){ /* do something with the path */}

var tree = newOutcomeTree(map, var) // The function will be wrapped so that it's first argument is the proper path.
```

If you should really need to get at the actual data, it's stored in `.tree`. But you probablhy won't, as the methods below will be sufficient and much faster than manual access.

## Methods for working with values

### .getValue(selector)
Takes `selector`, an array specifying a path through the tree, and returns the value associated with that branch. Eg.
```js
var selector = ["l","d","f"]
tree.getValue(selector) // returns the value in the tree branch associated with l, d, f.
```
If the selector contains branches that are not defined in the tree, `getValue` will return `undefined`. If the selector values are valid but either too long or too short, then it will throw an error. 

### .setValue(selector, value)
Takes `selector`, an array specifying a path through the tree, and sets the value associated with that branch to `value`. Eg.
```js
var value = 8
tree.setValue(["l","d"], 8)
```
It will throw an error if the branches don't exist, or if the selector isn't the right length.

### .push(value)
Will push `value` to every leaf on the tree that is an array.
```js
tree.push(8) // will push 8 to every array on the tree
```
`.push` will call `.push` on every array in the tree. If they are different arrays, this will add one element to each array; but if they are the same array, then this will add the element multiple times, one for each leaf in the tree. Bear in mind that to create a tree with multiple separate blank arrays, you must use `valGenerator` in the constructor, described above. If you actually want each leaf to have the same array, but want to push the value just once, use `.getValue` to fetch an array and then push to it:
```js
tree.getValue(selector).push(value)
```

### .collapse(object = {})
Collapses the data in the tree into a simple object, which it returns. `object` parameter is optional: if none is supplied, the data will be collapsed into a new object; if one is supplied, the data will be added into `object`. (The original outcomeTree will not be harmed.)
```js
var tree = new OutcomeTree([["Left","Right"],["Up","Down"]], 5)
var object = {}
tree.collapse(object)
object.Right.Up === 5 // true
```

## Methods for checking tree properties

### .layers()
Returns the number of layers (ie. choice sets) in the tree.
```js
var map = [["l","r"], ["u","d"]]
var tree = new OutcomeTree(map, 5)
tree.layers() // returns 2 (one for l/r, one for u/d)
```

### .mapDimensions()
Returns an array with the number of dimensions of the choice set. Eg.
```js
var tree = new OutcomeTree([["l", "c", "r"], ["l", "r"]], 5)
tree.mapDimensions() // returns [3,2]
```
Contrast with `.branchDimensions()`.

### .branchDimensions()
Returns an array with the number of dimensions that the branches contain in total. This will always be larger than the mapDimensions, because at each stage of the tree the branches multiply.
```js
var tree = new OutcomeTree([["l", "c", "r"], ["l", "r"]], 5)
tree.branchDimensions() // returns [3,6]
```

### .map()
If you should need to see (a copy of) the map, call `.map()`
```js
var map = [["l","r"], ["u","d"]]
var tree = new OutcomeTree(map, 5)
tree.map() // returns [["l","r"], ["u","d"]]
```