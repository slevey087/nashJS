# Choice

This is a core building block of nashJS. A `choice` defines a single selection made by a single player. For instance, _player2_ might choose between "cooperate" and "defect."

```javascript
Choice(player, options, {  
  defaultOption:options[0],
  informationFilter:null,
  playerMethod:"choose"
});
```

* `player` - the reference object of the player who makes the choice (more on this in the `player` section.
* `options` - an array of the available options that the player may select from. For instance: `["cooperate","defect"]`.
* Optional parameters:
  * `defaultOption:options[0]` - the option chosen automatically if the player selects no response. By default it is the first option supplied in `options`.
  * `informationFilter:null` - You can supply a function to filter the information object that the player receives. See the section below on `.play()` for more on this.
  * `playerMethod:"choose"` - the name of the method on the player to call when `.play()` is called. See the section below on `.play()` for more on this.

To create a game-step that involves only a single-player making a choice, use Choice by itself. You can set payoffs dependent on the choice made:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
c1.left(3); //Payoff 3 for choosing left
c1.right(4); //Payoff 4 for choosing right.

c1.play();
console.log(p1.score()); //Either 3 or 4
```
See the section below "Branching and Payoffs" for more on this.

## .play()
```js
c1.play();
```
will execute the choice. This will call the method on the player object whose name matches `playerMethod`, eg. if using the default "choose",  `c1.play()` will call `.choose()` on the player's strategy instance. If will be called with two arguments, `options`, an array of the available responses, and `information`, an object containing information about the game. (See the [Strategy Design Guide](../strategy-design.md) for more details on implementing strategies.) The player's response will be written to the history and payoffs will be assigned, unless these functions are disabled (as will typically be the case of the `Choice` is bundled into another _playable_ like [`Turn`](./turn.md)).

`.play()` can be called with several optinoal parameters:
```js
var parameters = {
  informationFilter:this.informationFilter,
  releasePlayer:true
};
c1.play();
```

* `informationFilter:this.informationFilter` - a function that will receive the information object bound for the user, and may perform operations on it before passing it along. Defaults to any `informationFilter` assigned when the `Choice` was created.
* `releasePlayer:true` - When the `Choice` executes, players will be noted as occupied and prevented from being selected by other _playables_. If true, the `Choice` will release the player when finished. (This will be superceded if the `Choice` is bundled into `Turn` or any other _playable._)

The `informationFilter` should be a function that takes this form: 
```js
function(information){
  // do something to the information object
  return information;
}
```
Keep in mind that this will happen during the game, and if it's an iterated game that loops the same _playable_, the information filter may potentially get called many times. Therefore, whatever it does, it should do it *fast*. 

## Branching and Payoffs

You can chain from Choice to create sequences, just like any _playable_:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward

c2(c1); //Play c2 after c1

c1.play();
```

and you can also create specific branches depending on the outcome of the choice:

```javascript
var c1 = Choice(p1, ["Left", "Right"]); //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]); //p2 will choose back or forward
var c3 = Choice(p3, ["Up", "Down"]); //p3 will choose up or down

c2(c1.Left); //If p1 chooses Left, go to c2
c3(c1.Right); //If p1 chooses Right, go to c3

c1.play();
```

You can use the branch function to set the payoff at the same time, ie. `c2(c1.Left(2))``

An alternative way to set payoffs is to use the `.setAllPayoffs` method:
```js
var c1 = Choice(p1, ["Left", "Center", "Right"]);

c1.setAllPayoffs([2,5,8])
```

The array of payoffs must be the same size as the number of possible choices (in this case, 3, for left, right, or center).

To view the payoffs, use the `.payoffs` method, which will return an object whose keys correspond to possible options, and values are the payoffs associated with it. Eg.,
```js
var c1 = Choice(p1, ["Left", "Center", "Right"]);
c1.setAllPayoffs([2,5,8]);

c1.payoffs()["Left"]; // returns 2
```
(Note: the object returned by `.payoffs` is a copy of the current state of the payoffs array, NOT a reference to the actual array. So, changing it will have no effect on the payoffs for the `choice`, and if the `choice` payoffs change (ie. due to a change in a [Variable](../logic/Variable.md)), it will NOT be automatically updated into the object previously returned by `.payoffs()`. You must call `.payoffs()` again to see the change.)
