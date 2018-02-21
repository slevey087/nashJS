# nashJS
A flexible and extendable game theory simulator for Javascript. Meant for testing different games and strategies. This is early days, bug reports and feature requests are very welcome (but might take a while).

## Installation

```
npm install nash-js
```

## Defining a Game
In nashJS, the game structure is defined in advance, then executed. The atom unit in nashJS is called a *playable.* A *playable* is an object that can be called to execute a step of the game, using the `.play()` function. *Playables* can be chained together in various ways to form multi-step games, and these chains can themselves form a *playable.* 

### Working With *Playables*
A *playable* is created by calling its parent function, with the necessary arguments and optional parameters.

```
var {Choice} = require('nash-js');

var c1 = Choice(*** arguments here ***, {*** optional parameters here ***});
```

You can execute this step of the game by using `.play()':
```
c1.play();
```

You can form sequences by chaining *playables* together:
```
var c2 = Choice(*** some other options ***);
c2(c1);

c1.play();  //c1 will execute, followed by c2
```
Some *playables* also can form several branches of chains. This is outlined in more detail in specific *playable* descriptions, following immediately.

### Choice
This is core building block of nashJS. A `choice` defines a single selection made by a single player. For instance, *player2* might choose between "cooperate" and "defect." 

``` 
var c1 = Choice(player, options, {
    id:null, 
    initializePlayers:false, 
    usePayoffs:false, 
    shortCircuit:false, 
    writeHistory:true, 
    releasePlayer:true
});
```

- `player` - the reference object of the player who makes the choice (more on this in the `player` section.
- `options` - an array of the available options that the player may select from. For instance: `["cooperate","defect"]`.
- Optional parameters:
-- `id:null` - The id for this playable. If not provided, one will be generated automatically.
-- `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
-- `usePayoffs:false` - If false, then payoffs defined for this Choice will be ignored. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)
-- `shortCircuit:false` - If false, proceed down the chain as normal after the Choice is complete. If true, stop after this Choice is complete. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)
-- `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)
-- `releasePlayer:true` - When the Choice executes, players will be noted as occupied and prevented from being selected by other *playables*. If true, the Choice will release the player when finished. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)

To create a game-step that involves only a single-player making a choice, use Choice by itself. You can set payoffs dependent on the choice made:
```
var c1 = Choice(p1, ["Left", "Right"]);      //p1 will choose left or right
c1.left(3);                                 //Payoff 3 for choosing left
c1.right(4);                                //Payoff 4 for choosing right.

c1.play();
console.log(p1.score())                     //Either 3 or 4
```

You can chain from Choice to create sequences, just like any *playable*:
```
var c1 = Choice(p1, ["Left", "Right"]);      //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]);    //p2 will choose back or forward

c2(c1);                                     //Play c2 after c1

c1.play();
```
and you can also create specific branches depending on the outcome of the choice:
```
var c1 = Choice(p1, ["Left", "Right"]);      //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]);    //p2 will choose back or forward
var c3 = Choice(p3, ["Up", "Down"]);        //p3 will choose up or down

c2(c1.Left());                              //If p1 chooses Left, go to c2
c3(c1.Right());                             //If p1 chooses Right, go to c3

c1.play();
```
Please note the syntax: to use a branch sequence, call the branch function (ie `c1.Left()`) as the argument to the next *playable*

### Turn
A `turn` is a collection of choices, called concurrently. Use `turn` when players need to make choices simultaneously (such as any normal-form game). 

```
var t1 = Turn(choices, {
    id:null,
    usePayoffs:true, 
    initializePlayers:false, 
    shortCircuit:false, 
    writeHistory:true, 
    releasePlayers:true
});
```

- `choices` - an array of the `choices` that make up the `turn`.
- Optional parameters:
-- `id:null` - The id for this playable. If not provided, one will be generated automatically.
-- `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
-- `usePayoffs:true` - If false, then payoffs defined for this `Turn` will be ignored.
-- `shortCircuit:false` - If false, proceed down the chain as normal after the `Turn` is complete. If true, stop after this `Turn` is complete. (This will be superceded if the `Turn` is bundled into any other *playable.*)
-- `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the `Turn` is bundled into any other *playable.*)
-- `releasePlayer:true` - When each `Choice` executes, players will be noted as occupied and prevented from being selected by other *playables*. If true, the `Turn` will release all players when finished. (This will be superceded if the `Turn` is bundled into any other *playable.*)

Bundle any number of `Choices` into a `Turn`:
```
var c1 = Choice(p1, ["Left", "Right"]);      //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]);    //p2 will choose back or forward

var t1 = Turn([c1, c2]);                    //c1 and c2 will execute at the same time
t1.play();
```

You can set payoffs dependend on the choices made. There are two ways to do so. With *implicit payoffs*, supply an array to the branch function. The player in the first choice will receive the first payoff in the array, and so on:
```
var c1 = Choice(p1, ["Left", "Right"]);      //p1 will choose left or right
var c2 = Choice(p2, ["Back", "Forward"]);    //p2 will choose back or forward

var t1 = Turn([c1, c2]);
t1.Left.Back([3,2]);                        //If p1 picks Left and p2 picks Back, then p1 will receive a payoff of 3 and p2 will receive a payoff of 2
t1.Left.Forward([1,4]);                     //If p1 picks Left and p2 picks Forward, then p1 will receive a payoff of 1 and p2 will receive a payoff of 4
//etc.
t1.play();
```
Or you can use *explicit payoffs*, where you name the player who should receive a payoff, by supplying an object where the keys are the player id's and the values are the payoffs. (This is useful if you'd like a Turn to affect the score of a player who was not involved in it).
```
t1.Right.Back({'player1':2, 'Jimbob':8});
```

`Turns` can be chained to other playables in the normal way:
```
c3(t1);
```
Or using branches, so that the next game-step depends on the outcome that was selected.

## Defining a Strategy