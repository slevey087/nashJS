# nashJS
A flexible and extendable game theory simulator for Javascript. Meant for testing different games and strategies. This is early days, bug reports and feature requests are very welcome (but might take a while). __This is a work in progress__. Not everything is functional, nor are all the help files written yet. Patience is appreciated.


## Installation

To install using NPM on the command line:

```
npm install nashjs
```
## Usage

`require("nashjs")` will return an object made up of various `nashJS` components. You can either use ES6 destructuring to seperate out the components you want:

```js
var {Player, Strategies, Population} = require("nashjs");
Population();
```

or store them all in one big object and use the components as methods on that object
```js
var NASH = require("nashjs");
NASH.Population();
```

This documentation will generally employ the former method.

## What To Do Next?

For a quick intro on the basics of `nashJS` see the [Quick Start Guide](./docs/quick-start.md). Where to go from there depends on what you're using `nashJS` for.

If you're running or creating a game, see the [Game Design Guide](./docs/game-design.md)

If you're creating a strategy, such as to participate in a tournament, you can skip that and go straight to the guide to [Working With Strategies](./docs/strategy-working).

If you're only designing a game and not a strategy, then you'll be finished there, but to learn to code a strategy, see the [Strategy Design Guide](./docs/strategy-design.md)

For questions about specific `nashJS` components, see the [Component Reference](./docs/components/index.md)
