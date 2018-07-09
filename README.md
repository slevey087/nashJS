# nashJS
A flexible and extendable game theory simulator for Javascript. Meant for testing different games and strategies. This is early days, bug reports and feature requests are very welcome (but might take a while).

<!-- toc -->



<!-- tocstop -->

## Installation

```
npm install nashJS
```
## Usage

`require("nashJS")` will return an object made up of various `nashJS` components. You can either use ES6 destructuring to seperate out the components you want:

```js
var {Player, Strategies, Population} = require("nashJS");
Population();
```

or store them all in one big object and use the components as methods on that object
```js
var NASH = require("nashJS");
NASH.Population();
```

This documentation will generally employ the former method.

## What To Do Next?

Where to go from here depends on what you're using `nashJS` for.

For a quick intro on the basics of `nashJS` see the [Quick Start Guide](./docs/quick-start.md).

If you're running or creating a game, see the [Game Design Guide](./docs/game-design.md)

If you're creating a strategy, such as to participate in a tournament, see the [Strategy Design Guide](./docs/strategy-design.md)

TODO: Transfer/rewrite everything below here.

## Defining a Strategy
A *strategy* is a prototype class. An instance of the class will be created for each player assigned that strategy. You must define a constructor function, then call the `registerStrategy` function to register it. The strategy must have a `.choose()` function, which will get called with the options presented by a `Choice`, and that function must return one of those options. Here is a simple example:
```javascript
function chooseFirstOption(){

	this.choose = function(options, information){
		return options[0];
	};
}
var {registerStrategy} = require('nashJS');
registerStrategy(chooseFirstOption, "Choose First");
```
In this example, the function `chooseFirstOption` is the constructor function, which will be called when a `Player` is assigned this strategy. `this.choose` is a function that will be called by any `Choice`, and `options` will be the options defined for the `Choice`, as an array (such as `['cooperate', 'defect']`), while `information` will contain histories and other useful data to help make the choice.

This simple strategy just selects the first option presented to it, but your strategy may get as complicated as you like (with the following caveat: it may not use outside libraries.) You can use internal variables to keep track of data if you wish. The first argument of `registerStrategy` is your constructor function, and the second should be a string naming your strategy (and this is the string used to `assign` a strategy to a *player*.

### Loading Strategies
You can create a single Javascript file which defines both the game and the *strategies* you would like to use, or you can fetch the strategies from seperate files (as might happen if they are coming from different authors). If you know the name of the file containing the strategy, simply `require` it in the file that defines the game (don't forget to use `./` prefix in the `require` string to require local files). Alternatively, if perhaps you are doing a contest with an unknown number of entries, nashJS can load all the scripts in a given directory for you.
