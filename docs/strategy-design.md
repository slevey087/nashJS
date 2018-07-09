## Strategy Design

This page outlines how to create your own strategy. There are two different ways to do so: either by script or by object. They are interchangeable, but easier in certain contexts. First we'll cover what's common between them, then how they differ.

Every strategy should have a name, a description, and a constructor function. Strategies can optionally specify a player name that they are allowed to be associated with (for instance, strategy "Punish Child If Misbehaving" might only be allowed to be associated with the player in the role of "Parent").

The constructor function defines the strategy and how it acts. Each time your strategy is assigned to a player, a new instance of the constructor function will be created using the `new` keyword (this way 2 players using the same strategy are not sharing data). A strategy should have a `.choose()` method, which will get called when the player is involved in a `Choice`.

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

Passed to `.choose()` will be `options`, an array of the available options, and `information`, an object containing history, population and other data useful to making the choice. `information` will vary for the different games, so probably the best way to handle is to see it for yourself in your specific context.

`nashJS` provides two built-in strategies to help you do this, `debugger` and `logger`. More on this is covered in the [Strategy Working Guide](./strategy-working.md).


If you are coding a strategy for an existing game (such as to enter a tournament), then you would probably use the script method. If you are coding a strategy to package along with a new stock game, then you would probably use the object method. We'll talk about them in more detail now.

**Note**: if you are registering the strategy from within a file that is called by `loadStrategy` or `loadStrategyFolder`, then `registerStrategy` and `registerStrategyObject` will be injected into the context, so there is no need to fetch them from anywhere. If you are registering the strategy from within a game file, or using Javascript's `require` or `import`, be sure to `require` the function you need, like so `var {registerStrategy} = require("nashJS");`

## Script Method

The _script method_ refers to writing a function exactly as in the previous example, then registering it using the `registerStrategy` function. This is handy if you're just writing a single strategy, especially if it will occupy its own file.

`registerStrategy` takes 4 arguments:
```js
registerStrategy(strategy, name, description, playerName)
```
So, the first example might be,
```js
function chooseFirstOption(){
	this.choose = function(options, information){
		return options[0]
	}
}

registerStrategy(chooseFirstOption, "Choose First Option", "Always selects the first available option.");
```


## Object Method

The _object method_ refers to packing one or more strategy functions, along with a name and description for each, into a Javascript Object, then registering it using the `registerStrategyObject` function. This is handy for creating many strategies at once, particularly short ones, as might happen if you're creating your own [Stock Game](./stock-games/index.md)

The object should have 3 properties, `name`, `description`, and `strategy` (and can optionally have a `playerName` property):

```js
var strategyObject1 = {
	name:"Choose First Option",
	description:"Always selects the first available option.",
	strategy: function(){
		this.choose = function(options, information){
			return options[0]
		}
	}
}

registerStrategyObject(strategyObject1)
```
To put multiple strategies into the same variable, simply create an array of such objects.

## What To Do Next

If you haven't already, be sure to check out the [Strategy Working Guide](./strategy-working.md) to know how to actually deal with these thingies. If you're planning on designing a game, check out the [Game Design Guide](./game-design.md).

If you're totally clueless, try the [Quick Start Guide](./quick-start.md). Or if you've aced it, but you have more specific questions on certain `nashJS` components, check the [Component Reference](./components/index.md)
