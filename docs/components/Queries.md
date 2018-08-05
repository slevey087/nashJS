# Queries

**NashJS** games tend to return quite a lot of information. To help you sort through the morass, **NashJS** comes packaged with the [**JSONata**](http://jsonata.org/) query languange. The principle interface to use **JSONata** is the `Queries` object.

To run a basic **JSONata** query on a target object,
```js
var target = {
	// Some data object here
}
var queryString = // Some JSONata query here

var result = Queries(queryString, target)
```

If there are additional arguments for the **JSONata** query, just pass them after the data object:
```js
var arg1 = // additional argument
var arg2 = // additional argument

var result = Queries(queryString, data, arg1, arg2)
```

Additionally, `History` objects (such as those returned by a completed game) have a `.query` function, which will run the **JSONata** query directly on the object.

```js
var result = History().query(queryString)
```

Because **JSONata** queries can also be pretty messy, **NashJS** uses "_shortcuts_." _Shortcuts_ are short strings which begin with "@", which stand for longer queries. You can always use a shortcut as a `queryString` instead of a full-blown **JSONata** query.

To display the available shortcuts, simply use `Queries` without argument:
```js
Queries()
/* returns, eg.
[{"shortcut":"@IPD-choices","description":"Results, organized by round."},
{"shortcut":"@IPD-players","description":"Players, organized by round."},
{"shortcut":"@IPD-payouts","description":"Payouts, as array of objects."}]
*/
```

Most shortcut queries will be loaded in with Stock Games, but to save one manually, see the section below.

Running `Queries()` will actually return an array of `Query` objects. These can be evaluated on a target data object by using `.evaluate(target)` on the object.

If you have a query shortcut but would like to see the **JSONata** code it runs, just feed it to `Queries` without a target object. For instance, if you have the shortcut "@IPD-Players" you can do
```js
var code = Queries("@IPD-Players")
```
This also returns a `Query` object, with a `.evaluate` method, for convenience.

## Saving shortcuts

Most shortcut queries will be loaded in with Stock Games, but to save one manually, do the following:
```js
var query = // your JSONata query
var shortcut - // your shortcut text
var description = // a one-sentence description

Queries(query).saveShortcut(shortcut, description)
// returns {shortcut, description}
```

All shortcuts begin with "@". If yours does not, it will be added. If you try to register a duplicate, nothing will happen. If you try to register a different query using a shortcut that's already taken, **NashJS** will automatically choose a different shortcut for you.

These are not saved to the hard disk, and must be loaded in each time you start **NashJS**.
