# nashJS
A flexible and extendable game theory simulator for Javascript. Meant for testing different games and strategies. This is early days, bug reports and feature requests are very welcome (but might take a while).

<!-- toc -->

- [Installation](#installation)
- [Creating Players](#creating-players)
- [Defining a Game](#defining-a-game)
  * [Working With *Playables*](#working-with-playables)
- [The Most Common Playables](#the-most-common-playables)
  * [Choice](#choice)
  * [Turn](#turn)
  * [Sequence](#sequence)
  * [Loop](#loop)
  * [HaltIf](#haltif)
- [Additional Playables](#additional-playables)
  * [StochasticLoop](#stochasticloop)
  * [StochasticHalt](#stochastichalt)
  * [RandomPlayerChoice](#randomplayerchoice)
  * [Lambda](#lambda)
- [Defining a Strategy](#defining-a-strategy)
  * [Loading Strategies](#loading-strategies)
- [Play-time Logic](#play-time-logic)
- [Stock Games](#stock-games)
- [Creating Your Own Playables](#creating-your-own-playables)

<!-- tocstop -->

## Installation

```
npm install nash-js
```

## Creating Players
A game requires players. First import the `Player` parent function, then create some players like so:
```
var {Player} = require('nash-js');
var p1 = Player({**optional parameters**});;
```
Players require a *strategy*, which is a sequence of code that tells the player what to do. (See the section below for how to create a *strategy*). Assign a player a strategy by referring to the strategy by name. You can do so when creating the player:
```
var p1 = Player({assign:"TitForTat"});
```
Or later using the `assign` function:
```
var p1 = Player();
p1.assign("TitForTat");
```
To view a player's ID, call `p1.id()`. To view its current score, call `p1.score()`. To view the strategy currently assigned to it, call `p1.strategy()`.
## Defining a Game
In nashJS, the game structure is defined in advance, then executed. The atom unit in nashJS is called a *playable.* A *playable* is an object that can be called to execute a step of the game, using the `.play()` function. *Playables* can be chained together in various ways to form multi-step games, and these chains can themselves form a *playable.* 

### Working With *Playables*
Import the *playables* you'd like to use using `require`, for instance:
```
var {Choice, Turn, Sequence, Loop} = require('nash-js').Playables;
```
A *playable* is created by calling its parent function, with the necessary arguments and optional parameters.

```
var c1 = Choice(*** arguments here ***, {*** optional parameters here ***});
```

You can execute this step of the game by using `.play()':
```
c1.play();
```

You can form sequences by chaining *playables* together. This can be done in 2 ways. Either use a throw-away variable (this is useful for simple sequence games):
```
var game = Choice(*** arguments here ***);                  //This Choice will play first
var x = Choice(*** some other arguments ***)(game);         //then this one
x = Choice(*** even more arguments ***)(x);             //then this one
x = Choice(*** so argumentative ***)(x);                   //And finally this one

game.play();  //Run the game!
```
Or create a name for each *playable* (this is helpful for games with more complicated and branching structures):
```
var c1 = Choice(*** arguments here ***);                  //This Choice will play first
var c2 = Choice(*** some other arguments ***);         
var c3 = Choice(*** even more arguments ***);       

c2(c1);                                         //Play c2 after c1
c3(c2);                                         //Play c3 after c2

c1.play();
```
Some *playables* also can form several branches of chains. This is outlined in more detail in specific *playable* descriptions, following immediately.

## The Most Common Playables

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
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:false` - If false, then payoffs defined for this Choice will be ignored. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)
  * `shortCircuit:false` - If false, proceed down the chain as normal after the Choice is complete. If true, stop after this Choice is complete. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)
  * `releasePlayer:true` - When the Choice executes, players will be noted as occupied and prevented from being selected by other *playables*. If true, the Choice will release the player when finished. (This will be superceded if the Choice is bundled into Turn or any other *playable.*)

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
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `usePayoffs:true` - If false, then payoffs defined for this `Turn` will be ignored.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Turn` is complete. If true, stop after this `Turn` is complete. (This will be superceded if the `Turn` is bundled into any other *playable.*)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the `Turn` is bundled into any other *playable.*)
  * `releasePlayer:true` - When each `Choice` executes, players will be noted as occupied and prevented from being selected by other *playables*. If true, the `Turn` will release all players when finished. (This will be superceded if the `Turn` is bundled into any other *playable.*)

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
c3(t1);                             //Play c3 after t1, no matter the outcome
```
Or using branches, so that the next game-step depends on the outcome that was selected.
```
c3(t1.Left.Back());                 //Play c3 if p1 picks Left and p2 picks Back
```

### Sequence
`Sequence` converts a chain of *playables* into a *playable.* This is useful for supplying longer chains to *playables* that act on other *playables* (such as loops) or for cleaning up code by defining your own *playables*. 
```
var s1 = Sequence(playableStart, playableFinish, {
    id:null,
    initializePlayers:false, 
    shortCircuit:false, 
    writeHistory:true, 
});
```
- `playableStart` - any *playable* with which to begin the sequence.
- `playableFinish` - the *playable* that should end the sequence.
- Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Sequence` is complete. If true, stop after this `Sequence` is complete. (This will be superceded if the `Sequence` is bundled into any other *playable.*)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the `Sequence` is bundled into any other *playable.*)

`Sequence` will call `.play()` on the *playable* supplied as *playableStart*, then continue down the chain until either it reaches *playableFinish* or until the chain finishes.

```
var t1 = Turn(['Left', 'Right']);
var t2 = Turn (['Up', 'Down']);
var t3 = Turn(['Back','Forward']);

t2(t1);
t3(t2);

var s1 = Sequence(t1, t2); 
//Calling t1.play() would cause t1, then t2, then t3 to play. Calling s1.play() will cause only t1 then t2 to play.
```
If the sequence doesn't reach *playableFinish*, it will simply end when there are no more branches to play:
```
var t1 = Turn(['Left', 'Right']);
var t2 = Turn (['Up', 'Down']);
var t3 = Turn(['Back','Forward']);

t2(t1);             //There is no path from t1 to t3

var s1 = Sequence(t1, t3); 
//Calling s1.play() will cause t1 then t2 to play. 
```

Note that every *playable* chained to `playableStart` will play, even if that branch does not lead to `playableFinish*:
```
var t1 = Turn(['Left', 'Right']);
var t2 = Turn (['Up', 'Down']);
var t3 = Turn(['Back','Forward']);

t2(t1);
t3(t1);         //Here, t2 and t3 are both chained to t1

var s1 = Sequence(t1, t2); 
//Calling s1.play() will cause t1, t2, and t3 to play, even though t3 is not on the branch that leads to t2.
```

### Loop
`Loop` calls a *playable* repeatedly, a given number of times. This is useful to iterated or evolutionary games, as well as cleaning up code for games with repition.
```
var l1 = Loop(playable, count, {
    id:null,
    logContinue:false
    initializePlayers:false, 
    shortCircuit:false, 
    writeHistory:true, 
});
```
- `playable` - The *playable* to loop. 
- `count` - The number of times to loop (defaults to 1)
- Optional parameters:
  * `id:null` - The id for this playable. If not provided, one will be generated automatically.
  * `logContinue:false` - If false, omit entries to the `gameHistory` record for each time through the loop, and only record when the loop completes.
  * `initializePlayers:false` - If true, then players scores and strategies will be reset when `.play()` is called.
  * `shortCircuit:false` - If false, proceed down the chain as normal after the `Sequence` is complete. If true, stop after this `Sequence` is complete. (This will be superceded if the `Sequence` is bundled into any other *playable.*)
  * `writeHistory:true` - If false, omit entries to the `gameHistory` record. (This will be superceded if the `Sequence` is bundled into any other *playable.*)
Use `Loop` to repeat simple *playables* like `Choice` or `Turn`:
```
var t1 = Turn(['Left', 'Right']);
var l1 = Loop(t1,5);

l1.play();
```
Or with `Sequence` to loop chains of game-steps:
```
var t1 = Turn(['Left', 'Right']);
var t2 = Turn (['Up', 'Down']);
var t3 = Turn(['Back','Forward']);

t2(t1);
t3(t2);

var s1 = Sequence(t1, t3); 
var l1 = Loop(s1, 4);           //t1, then t2, then t3 will play 4 times.
```
### HaltIf


## Additional Playables
### StochasticLoop
### StochasticHalt
### RandomPlayerChoice
### Lambda

## Defining a Strategy
A *strategy* is a prototype class. An instance of the class will be created for each player assigned that strategy. You must define a constructor function, then call the `registerStrategy` function to register it. The strategy must have a `.choose()` function, which will get called with the options presented by a `Choice`, and that function must return one of those options. Here is a simple example:
```
function chooseFirstOption(){
	
	this.choose = function(options){
		return options[0];
	};
}
var {registerStrategy} = require('nash-js');
registerStrategy(chooseFirstOption, "chooseFirst");
```
In this example, the function `chooseFirstOption` is the constructor function, which will be called when a `Player` is assigned this strategy. `this.choose` is a function that will be called by any `Choice`, and `options` will be the options defined for the `Choice`, as an array (such as `['cooperate', 'defect']`). This simple strategy just selects the first option presented to it, but your strategy may get as complicated as you like (with the following caveat: it may not use outside libraries.) You can keep use internal variables to keep track of data if you wish. The first argument of `registerStrategy` is your constructor function, and the second should be a string naming your strategy (and this is the string used to `assign` a strategy to a *player*.

### Loading Strategies
You can create a single Javascript file which defines both the game and the *strategies* you would like to use, or you can fetch the strategies from seperate files (as might happen if they are coming from different authors). If you know the name of the file containing the strategy, simply `require` it in the file that defines the game (don't forget to use `./` prefix in the `require` string to require local files). Alternatively, if perhaps you are doing a contest with an unknown number of entries, nashJS can load all the scripts in a given directory for you.
## Play-time Logic
To make games more dynamic, you can use play-time logic (which is like run-time logic, but it runs during the game!). For any numerical parameter given in the structure of the game, you can instead create a `Variable` object, and pass that. This object can be updated using `.set()` during the game, to change the structure of the game. This is most commonly done using `Lambda`:
```
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

You can also specify a value to always be some function of a `Variable` by using an `Expression`. Define an `Expression` by using a function which returns a number. That function can depend on `Variable`s you've created, like so:
```
var e1 = Expression(function(){
    return v1 + 5;
});

c1.left(e1);
```
In the example, the value of `e1` will always be whatever the value of `v1` is plus 5. Calling `.set()` on `v1` will therefore cause the value of `e1` to change.
## Stock Games
## Creating Your Own Playables