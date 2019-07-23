# History

`History` is a class for keeping track of what's happened during game play. Every `playable` adds to the main game `history` when its `.play()` method is called. 

This page will provide documentation for the class. You likely will not need to use it unless you are [building a custom playable](./custom-playable.md) with custom history behavior. 

## Usage

```js
var {History} = require("./lib/engine").Backend.Classes
var history = new History()
```

A `history` is an array, but with three branches instead of one. The main branch (accessed as a normal array, eg `history[2]`) is called the __tree__. There is also a __log__, accessed as `history.log`, and a __score record__, accesssed as `history.scores`.

The __tree__ is written as nested objects. So, if a playable makes use of sub-playables (eg a `Turn` references one or more `Choice` or `Range` playables), then history entries from these sub-playables will be found within properties on the parent playable's history entry object. 

```js
//eg.
history
/* returns
{
  "loop": "Iterated-Prisoner-Dilemma",
  "count": 2,
  "action": [
    {
      "turn": "Prisoner-Dilemma",
      "results": [
        {
          "choice": "Column Player Choice",
          "player": "Column Player",
          "result": "Cooperate",
          "duration": 2.161700963973999
        },
        {
          "choice": "Row Player Choice",
          "player": "Row Player",
          "result": "Defect",
          "duration": 2.037899971008301
        }
      ],
      "payouts": {
        "Column Player": 1,
        "Row Player": 4
      },
      "duration": 3.852299928665161
    },
    {
      "turn": "Prisoner-Dilemma",
      "results": [
        {
          "choice": "Column Player Choice",
          "player": "Column Player",
          "result": "Defect",
          "duration": 1.505000114440918
        },
        {
          "choice": "Row Player Choice",
          "player": "Row Player",
          "result": "Defect",
          "duration": 1.456798791885376
        }
      ],
      "payouts": {
        "Column Player": 2,
        "Row Player": 2
      },
      "duration": 2.2248990535736084
    }
  ],
  "duration": 7.40339994430542
}
*/
```

The __log__ contains history entries in chronological order, so users can see what happened during game play. (Note that the entries in the __log__ may not be identical to the entries in the __tree__. `Playables` should format their entries to maximize readibility and convenience in each branch.)

```js
// eg.
history.log
/* returns
[
  {
    "loop": "Iterated-Prisoner-Dilemma",
    "loopTo": "Prisoner-Dilemma",
    "count": 1
  },
  {
    "turn": "Prisoner-Dilemma",
    "decisions": [
      "Column Player Choice",
      "Row Player Choice"
    ]
  },
  {
    "choice": "Column Player Choice",
    "player": "Column Player",
    "result": "Cooperate",
    "duration": 2.161700963973999
  },
  {
    "choice": "Row Player Choice",
    "player": "Row Player",
    "result": "Defect",
    "duration": 2.037899971008301
  },
  {
    "loop": "Iterated-Prisoner-Dilemma",
    "loopTo": "Prisoner-Dilemma",
    "count": 2
  },
  {
    "turn": "Prisoner-Dilemma",
    "decisions": [
      "Column Player Choice",
      "Row Player Choice"
    ]
  },
  {
    "choice": "Column Player Choice",
    "player": "Column Player",
    "result": "Defect",
    "duration": 1.505000114440918
  },
  {
    "choice": "Row Player Choice",
    "player": "Row Player",
    "result": "Defect",
    "duration": 1.456798791885376
  }
]
*/
```
And finally, the __score record__ returns only entries from when scores changed. 

```js
// eg.
history.scores
/* returns
[
  {
    "turn": "Prisoner-Dilemma",
    "result": [
      "Cooperate",
      "Defect"
    ],
    "payouts": {
      "Column Player": 1,
      "Row Player": 4
    }
  },
  {
    "turn": "Prisoner-Dilemma",
    "result": [
      "Defect",
      "Defect"
    ],
    "payouts": {
      "Column Player": 2,
      "Row Player": 2
    }
  }
]
*/
```
## Methods

### `.add(entry)`

Adds an entry to the history. `entry` should be a JSON object with the history information. 
```js
var entry = {
    lambda: "Lambda1",
    result:"left",
    duration:1.0000000
}
history.add(entry)
```
Entries are added to both the __tree__ and the __log__. (To add only to the __tree__ and not the __log__, use `.addNoLog()`. To add only to the __log__ and not the __tree__, use `.log.add(entry)`)

`.add` will also add entries to the __logs__ of any parent histories (see `.child` for more detail on parent histories)

### `.addNoLog(entry)`

Like `.add`, but only adds to the __tree__, and not to the __log__, (and does not add to any parent histories).

```js
var entry = {
    lambda: "Lambda1",
    result:"left",
    duration:1.0000000
}
history.addNoLog(entry)
```

Since __tree__ entries can contain sub-playable information while __log__ entries should not `addNoLog` is convenient for adding these entries, and is typically used as a `playable` with sub-playables is cleaning up, to report the entire nested results. 

`.log.add()` is for when the chronological log entry shouldn't be included in the __tree__. This might be, for instance, if a `playable` does multiple things that get logged in the __log__ (each `playable` should only appear once in the __tree__).

### `.addScores(scoresEntry)`

Adds an entry to the __scores__ branch. (Be sure to mention what the payouts were!)
```js
var scoresEntry = {
    "turn": "Prisoner-Dilemma",
    "result": [
      "Defect",
      "Defect"
    ],
    "payouts": {
      "Column Player": 2,
      "Row Player": 2
    }
  }
history.addScores(scoresEntry)
```

Like `.add()`, `.addScores()` will cycle up to parent histories, and add the `scoresEntry` to the parent __scores__ branches.

### `.child()`

Creates a new `history`, with a link back to the current one in the `.parent` property.
```js
var childHistory = history.child()

childHistory.parent === history // true
```
Note: the new history will be blank; it will not contain any entries already in the parent. 

The purpose of `.child` is to create a sub-history, which can be passed to sub-playables, so that their history entries will not be written directly into the main __tree__, but rather will be collected and stored, then merged into a property of the main `playable`'s __tree__ entry.

For instance, [`Loop`](../components/playables/loop.md) takes a sub-playable, which it calls `.play` on repeatedly. To handle the history entries, it creates a child history, which it passes to the sub-playable when it calls `.play()`. 

```js
// pseudo-code for Loop.play()
play({history}){
    loopHistory = history.child()

    result = Loop.subPlayable.play({history:loopHistory})
    //... continued below
}
```

As part of the `.play` cycle of every `playable`, `.handleHistory` gets called after the results, to construct the history entry and write it to `history`.
```js
// pseudo-code for Choice.handleHistory()
// (handleHistory gets callled as part of the .play cycle)
handleHistory(history, result){
    // construct history entry
    var entry = {
        choice:this.id,
        result:result
    }
    history.add(entry)
}
```
Then `Loop` merges this information back into its own main `history`, calling `.orphan()` to sever the link.

```js
// continued from above, in Loop.play()
var entry = {
    loop:this.id,
    action:loopHistory.orphan()
}
history.add(entry)
```
And the actual main __tree__ will look something like this:
```js
{
    loop:"Loop1",
    action:{
        choice:"choice1",
        result:"turn left"
    }
}
```
When entries are added to the __log__ or __scores__ branch of the child using `.add` or `.addScores`, they will also get added to the __log__ or __scores__ branch of the parent, respectively, automatically.

### `.childWithContent()`

Same as `.child`, except that when `.print` is called on the child, it will return __log__ and __scores__ with the parent's entries prepended to its own. This will rarely be necessary, and the vast majority of the time, `.child()` is what you're looking for. 


### `.clearHistory()`

Delete historical entries. 

```js
history.clearEntries()
```

Note: this will do an in-place delete on all entries in the __tree__, __log__, and __scores__ branches. It will also delete a link to a parent history, if there is one.

### `.end()`

Sends a signal to end the game. Calling this function will set the `.stop` property to true.

```js
history.end()
history.stop // returns true
```

Why call `.end()` rather than just set `.stop` to true directly? Because `.end()` will also cycle the message back up to any parent histories, and down to any children histories, so that every history in the game can receive the stop message simultaneously.

```js
var child = history.child()
var grandchild = child.child()

child.end()
history.stop // returns true
grandchild.stop // returns true
```

When `.end()` is called, already running _playables_ will be allowed to finish, but no more _playables_ will be allowed to begin a `.play()` cycle. 

### `.orphan()`

Meant only for child histories (see `.child()`). Returns itself, but with the log, scores, and link to the parent deleted. Use this when merging sub-histories back into the parent history.

Note: this will do an in-place delete on the `.parent`, `.log` and `.scores` properties. Do not call it until you're ready to merge the histories.

### `.print()`

Simply provides a slightly cleaner view of a `history`, useful for debugging in REPL while designing a game or `playable`. Not especially necessary.

### `.query(queryString, ...args)`

Run a [__JSONata__](http://jsonata.org) query on the contents of the history. `queryString` is the __JSONata__ query, and `...args` can take any additional arguments.

```js
history.query("turn.decisions")
```

See the [JSONata documentation](http://docs.jsonata.org/overview.html)  for more information. 

## UserHistory

`UserHistory` is a class suitable for displaying history information to a user. Any history data accessible to the frontend should be wrapped in a `UserHistory`. This is because each `UserHistory` is a copy isolated from the original, so changing the values on a `UserHistory` will not edit the original history, or copies received by other code. This is to help prevent cheating by revising history.

Create a `UserHistory` by supplying a `History`.

```js
var history = new History();
var userHistory = new UserHistory(history);
```

`UserHistory` inherits methods from `History`, and runs them on the original history, but will convert any returned `History` into a `UserHistory`. This means the underlying `History` can be added to using `.add()`, and the game can be ended by using `.end()`, etc. (Note that because of these methods, `UserHistory`s are not suitable to be passed to game players during the game. For that, use [`Information`](./information.md))

## gameHistory

This is the main game `History`. It is the default `History` passed to any _playable_ when `.play()` is called, unless some other `History` is supplied instead. 

Import it using the [Backend](./backend.md)
```js
var {gameHistory} = require("./lib/engine").Backend.State
```

or directly
```js
var {gameHistory} = require("./lib/history")
```

## userGameHistory

This is a function which returns a `UserHistory` wrapping of the main `gameHistory`. It can be accessed by the user using `History()`:

```js
var NASH = require("nash-js")
var {   History } = NASH
History() 
```