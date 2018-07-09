# Working With Strategies

`nashJS` provides a `Strategies` object to help you work with strategies. First require it, then call it to see an array of available strategies.

```js
var {Strategies} = require("nashJS")
Strategies()
//returns, for eg.: ["Tit For Tat", "Grudger", "Randomize", "logger"]
```

Running `Strategies.descriptions()` will return an object whose keys are strategy names and whose values are the description of that strategy.

```js
Strategies.descriptions()["Tit For Tat"]
// returns: "Do whatever your opponent did last turn. Cooperate if this is the first turn."
```

To assign a strategy to a player, use the `assign` parameter when a player is created
```js
p1 = Player({assign:"Tit For Tat"})
```

or use `.assign()` after the fact:
```js
p1.assign("Tit For Two Tats")
```

## Strategy Design

This page outlines how to create your own strategy. There are two different ways to do so: either by script or by object. They are interchangeable, but easier in certain contexts. First we'll cover what's common between them, then how they differ.

Every strategy should have a name, a description, and a constructor function. Strategies can optionally specify a player name that they are allowed to be associated with (for instance, strategy "Punish Child If Misbehaving" might only be allowed to be associated with the player in the role of "Parent").

The constructor function defines the strategy and how it acts. Each time your strategy is assigned to a player, a new instance of the constructor function will be created using the `new` keyword (this way 2 players using the same strategy are not sharing data). A strategy should have a `.choose()` function, which will get called when the player is involved in a `Choice`.

Here's a simple example:
```js
function chooseFirstOption(){
	this.choose = function(options, information){
		return options[0]
	}
}
```

In this case, whenever `.choose()` gets called, it simply returns the first available option. The code in your `.choose()` function should ultimately return one of the options. If it doesn't, the `Choice` will go with the default option.

If you'd like to store data from prior turns, simply create a variable outside `.choose()` and edit it inside. The following example will return the first option the first time it chooses, then the second option subsequent times.

```js
function firstOptionFirst(){
	var firstTurn = true

	this.choose = function(options, information){
		if (firstTurn == true) {
			firstTurn = false;
			return options[0]
		}
		else{
			return option[1]
		}
	}
}
```

## Handling Information

Passed to `.choose()` will be `options`, an array of the available options, and `information`, an object containing history, population and other data useful to making the choice. `information` will vary for the different games, so probably the best way to handle is to see it for yourself in your specific context.

`nashJS` provides two built-in strategies to help you do this, `debugger` and `logger`. For instance,

```js
Strategies.debugger()
p1.assign("debugger")

Strategies.logger()
p2.assign("logger")
```

You can do that by loading the `debugger` strategy, using `Strategies.debugger()`, then assigning it to a player and running your game. The `debugger` strategy is very simple: when `.choose()` is called, the strategy calls the Javascript `debugger` keyword, pausing execution.

If you are coding a strategy for an existing game (such as to enter a tournament), then you would probably use the script method. If you are coding a strategy to package along with a new stock game, then you would probably use the object method.

This
