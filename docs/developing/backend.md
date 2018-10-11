# NashJS Backend

To develop for `NashJS` will require you to make use of the `NashJS` backend components, and this guide will walk you through what they are.

## Accessing

To access the backend, `require` the *engine.js* file directly. It is located in the library ("lib") folder.

```js
// Be sure to edit for the path your file is actually in
var Backend = require("./lib/engine").Backend
```

As usual, we recommend ES6 destructuring to get the components you want.

```js
//eg.
var { PluginManager} = require("./lib/engine").Backend
```

## State

These components contain information about the state of the game, players, etc.

```js
//eg.
var {registry, idCounters} = require("./lib/engine").Backend.State
```

### registry

The `registry` is the main hub for information in the `NashJS` backend. It is an object which stores every player, __playable__, global settings, and more. For more details, see [registry](./registry.md)
