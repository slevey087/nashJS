(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
//Main module code
var NashJS = require('./lib/engine').Frontend;

//Stock-games
NashJS.StockGames = require('./stock-games');


module.exports = NashJS;

},{"./lib/engine":6,"./stock-games":77}],5:[function(require,module,exports){
({
	Player,
	_Player,
	gamePopulation,
	Population,
	PlayerList,
	registerStrategy,
	Strategies,
	strategyLoader,
	_expose,
	registry,
	Variable,
	Expression,
	RandomVariable,
	ComplexVariable,
	gameHistory,
	excludedPlayers,
	startREPL,
	nhistory,
	Information,
	PerfectInformation,
	PluginManager
} = require("../index"));
({
	Choice,
	Turn,
	Sequence,
	Consecutive,
	Loop,
	StochasticLoop,
	HaltIf,
	StochasticHalt,
	Lambda,
	RandomPlayerChoice,
	PopulationDynamics,
	Simultaneous
} = require("../index").Playables);
StockGames = require("../index").StockGames;

console.log("h")

function chooseFirstOption() {
	this.choose = function(options, information) {

		return options[0];
	};
}
registerStrategy(chooseFirstOption, "chooseFirst");


function chooseSecondOption() {
	this.choose = function(options, information) {
		//console.log("second choice");

		return options[1];
	};
}
registerStrategy(chooseSecondOption, "chooseSecond");


function randomize() {
	this.choose = function(options, information) {
		debugger;
		var num = Math.floor(Math.random() * options.length);
		return options[num];
	};
}
registerStrategy(randomize, "randomize");


p1 = Player();
p1.assign("chooseFirst")
p2 = Player();
p2.assign("randomize");
p3 = Player();
p3.assign("chooseSecond");
p4 = Player();
p4.assign("randomize")

c1 = Choice(p1, ["cooperate", "defect"]);
//c1['left'](5) ;
//c1['right'](2);
c2 = Choice(p2, ["Cooperate", "Defect"]);
//c2['up'](1);
//c2['down'](7);

t2 = Turn([c1, c2]);
t3 = Turn([c1, c2]);
t4 = Turn([c1, c2]);
t5 = Turn([c1, c2]);
s1 = Simultaneous([t2, t3, t4, t5])

c = Consecutive([
	Turn([c1, c2]),
	Turn([c2, c1]),
	Choice(p1, ["cooperate", "defect"]),
	Lambda(function() { console.log("hi") }),
	HaltIf(function() { return true })
])

c3 = RandomPlayerChoice(["cooperate", "defect"]);
c4 = RandomPlayerChoice(["Cooperate", "Defect"]);

t1 = Turn([c3, c4]);

v1 = new Variable(3);

t1.defect.Defect([2, 2]);
t1.defect.Cooperate([4, 1]);
t1.cooperate.Defect([1, 4]);
t1.cooperate.Cooperate([v1, v1]);

L1 = Lambda(function() {
	v1.set(v1 + 1);
});

pd1 = PopulationDynamics(1.5, 1);

h2 = HaltIf(function() {
	return Population().onlyAlive().length == 0;
});

L1(t1);
pd1(L1);
h2(pd1);

//s1 = Sequence(t1, h2);

//l1 = Loop(s1, 10, { logContinue: true });

//console.log(_expose(t1).next)
//console.log(_expose(t1).next.cooperate.Cooperate)

h2 = HaltIf(function() {
	return Population().onlyAlive().length == 0;
});

L2 = Lambda(function() {
	p1.kill();
});

t2(L2);

generatePopulation = function() {
	for (i = 0; i < 30; i++) {
		Player({ assign: "chooseFirst" });
	}
	for (i = 0; i < 30; i++) {
		Player({ assign: "chooseSecond" });
	}
};

function gameGenerator() {
	var t = Turn([
		RandomPlayerChoice(["cooperate", "defect"]),
		RandomPlayerChoice(["Cooperate", "Defect"])
	]);

	t.defect.Defect([2, 2]);
	t.defect.Cooperate([4, 1]);
	t.cooperate.Defect([1, 4]);
	t.cooperate.Cooperate([3, 3]);

	return t;
}
//
//
//

//CE = StockGames["Cultural Evolution"](gameGenerator, 1, {generatePopulation});

//n = StockGames["Two-Player Normal"](p1,p2,[["left","right"],["up","down"]]);
//pd1 = StockGames["Prisoner's Dilemma"]([p1, p2]);
//pd2 = StockGames["Prisoner's Dilemma"]([p3, p4]);

//s = Simultaneous([pd1, pd2])

v2 = Variable(1);

//n = StockGames["Simple Zero-Sum"](p1,p2,[["left","right"],["up","down"]], [[v2,2],[3,4]]);

//rpc = StockGames["Rock-Paper-Scissors"]([p1, p2]);
//t = StockGames["Axelrod Tournament"];
//t = StockGames["Iterated Prisoner's Dilemma"]([p1, p2]);
//The code below is to run the repl for testing purposes.
//var toRepl = {_expose, registry,Player,Choice,Turn,Sequence,Loop,StochasticLoop,HaltIf, StochasticHalt, Lambda, p1,c1,c2,t1};
//startREPL(toRepl);

},{"../index":4}],6:[function(require,module,exports){
"use strict";

// Start plug-in manager
var PluginManager = require("./plugin-manager")
PluginManager.start(function() {})


//Logging
var log = require("./logger");
//log.useWinston();  				Winston doesn't work with browserify, so this is a shim. Uncomment to use Winston.
log.setLevel("debug");
log("info", "Starting NashJS");


//Game state controllers
var { registry, idCounters } = require('./state');


// History
var { gameHistory, History, UserHistory } = require('./history');


//Players
var { _Player, Player } = require('./player');
registry._addType_("players");
idCounters._addType_("player");


//Population
var { gamePopulation, Population, PlayerList, UserPlayerList } = require('./population');


//Information mechanics
var { Information, PerfectInformation } = require("./information");


//Playables
var { playableClasses, playableInterfaces } = require('./playables/')
for (var _class in playableClasses) {
	registry._addType_(playableClasses[_class].registryName);
	idCounters._addType_(playableClasses[_class].counterName);
}

//Symbolic Logic
var {
	variablePrototype,
	Variable,
	expressionPrototype,
	Expression,
	RandomVariable,
	ComplexVariable
} = require("./logic");


//Strategies
registry._addType_("strategies");
idCounters._addType_("strategy");

var { registerStrategy, registerStrategyObject, Strategies } = require('./strategy');
var strategyLoader = require('./strategy-loader');


// Helper function loader
var HelperFunctions = require('./helperFunctions');


//THIS FUNCTION IS ONLY FOR DEBUGGING. REMOVE IT FROM MODULE EXPORTS WHEN PUBLISHING
function Expose(interfacePlayable) {
	return registry.playables[interfacePlayable.id()];
}


function startREPL(toREPL) {
	var repl = require("repl");

	var replServer = repl.start({
		prompt: "Nash >> "
	});

	Object.assign(replServer.context, toREPL);
}



var Engine = {
	Frontend: {
		Player,
		_Player, //REMOVE THIS LINE WHEN PUBLISHING
		gamePopulation, //REMOVE THIS LINE WHEN PUBLISHING
		'PlayerList': UserPlayerList,
		Population,
		Information, //REMOVE THIS LINE WHEN PUBLISHING
		PerfectInformation, //REMOVE THIS LINE WHEN PUBLISHING
		'Playables': playableInterfaces,
		registerStrategy,
		registerStrategyObject,
		Strategies,
		strategyLoader,
		gameHistory,
		Expose, //REMOVE THIS LINE WHEN PUBLISHING
		registry, //REMOVE THIS LINE WHEN PUBLISHING
		startREPL, //Should this line be removed when publishing?
		Variable,
		Expression,
		RandomVariable,
		ComplexVariable,
		PluginManager //REMOVE THIS LINE WHEN PUBLISHING
	},

	Backend: {
		logger: log,
		State: { registry, idCounters, gameHistory, gamePopulation, PerfectInformation },
		Classes: {
			Player: _Player,
			History,
			UserHistory,
			PlayerList,
			UserPlayerList,
			Information,
			PlayableClasses: { playableClasses },
			variablePrototype,
			expressionPrototype
		},
		HelperFunctions,
		PluginManager,
		Expose
	}
}

module.exports = Engine;

},{"./helperFunctions":8,"./history":25,"./information":26,"./logger":27,"./logic":28,"./playables/":32,"./player":43,"./plugin-manager":45,"./population":49,"./state":50,"./strategy":52,"./strategy-loader":51,"repl":1}],7:[function(require,module,exports){
var general = {
	//Check if variable is an Object
	isObject(a) {
		return !!a && a.constructor === Object;
	},

	//What do you think?
	isFunction(a) {
		return typeof a === "function";
	},

	//Provide a function, a context ('this'), and an argument array.
	//Returns a function that can be called.
	applyBind(func, that, argArray) {
		return func.bind.apply(func, [that].concat(argArray));
	},

	//Wraps a function to ensure it only gets called one time.
	once(fn, context) {
		var result;

		return function() {
			if (fn) {
				result = fn.apply(context || this, arguments);
				fn = null;
			}

			return result;
		};
	},

	// Randomly re-order array
	shuffle(array) {
		var currentIndex = array.length,
			temporaryValue,
			randomIndex;

		// While there remain elements to shuffle...
		while (0 !== currentIndex) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}
};

module.exports = general;

},{}],8:[function(require,module,exports){
"use strict";

var log = require("../logger");

log("debug", "helperFunctions-index: Loading helper functions loader.");

/*
var general  = require('./general');
var player   = require('./player');
var playable = require('./playable');
var turn 	 = require('./turn');
var state 	 = require('./state'); 
*/

function loader(file) {
	return require("./" + file + ".js");
}

module.exports = loader;
//module.exports = {general, player, playable, turn, state};

// Hack to compile Glob files (in browserify). Don´t call this function!
(function() {
	require('./general.js');require('./index.js');require('./logic.js');require('./playable.js');require('./player.js');require('./state.js');require('./stock-games.js');require('./tournament.js');require('./turn.js');
});

},{"../logger":27,"./general.js":7,"./index.js":8,"./logic.js":9,"./playable.js":10,"./player.js":11,"./state.js":12,"./stock-games.js":13,"./tournament.js":14,"./turn.js":15}],9:[function(require,module,exports){
"use strict";

var logic = {

	// Check to see if object is Variable/Expression or not. Returns true/false
	isLogic(logic) {

		if (logic instanceof Function && logic == logic * 1) return true
		else return false;
	}
};

module.exports = logic;

},{}],10:[function(require,module,exports){
"use strict";

var { SynchronousPromise } = require('synchronous-promise');

//Game state controllers
var { registry } = require('../state');

var playable = {
	// Generates the function that gets returned when a Playable is called, which can then be called to chain playables together.
	chainerGenerator(externalObj, internalObj) {
		externalObj = this;
		return function(source) {
			var previousPlayable, path;

			//TODO: verify that source is the right type

			return SynchronousPromise.all([function() {
				if (source instanceof Promise || source instanceof SynchronousPromise) {
					source.then(function(result) {
						previousPlayable = registry.playables[result.playable.id()];
						path = result.path
						return SynchronousPromise.resolve();
					});
				}
				return SynchronousPromise.resolve()
			}(), function() {
				if (!(source instanceof Promise || source instanceof SynchronousPromise)) {
					previousPlayable = registry.playables[source.id()];
					path = source.path;
				}
				return SynchronousPromise.resolve();
			}()]).then(function(result) {

				if (path == "all") previousPlayable.addNext(internalObj);
				else {

					outcomeTreeGetValue(previousPlayable.next, path).push(internalObj);
				}

				//previousPlayable.next[selected].push(_choice);

				return SynchronousPromise.resolve({
					'playable': externalObj,
					path: "all"
				});
			});
		};
	},


	//Use to set every value of an outcome tree
	outcomeTreeAddAll(tree, value) {

		//If it's an array, then we're already done.
		if (Array.isArray(tree)) {
			tree.push(value); //Use push here because this will be a unique array
		} else {
			var recurse = function(obj, val) {

				for (var keys in obj) {

					//If no keys left to traverse, then assign value. If not, recurse.
					if (Array.isArray(obj[keys])) {
						obj[keys] = obj[keys].slice().concat(val); //Use slice-concat here because this might not be a unique array (the creation process duplicates them)
					} else recurse(obj[keys], val);

				}
			};
			recurse(tree, value);
		}
	},


	//Traverse an outcome tree to obtain the value for a desired key-set
	//Argument one is a nested object, while argument 2 is an array of keys for the object, 1 layer at a time.
	outcomeTreeGetValue(tree, selector) {

		//Find the next item in the chain associated with the resultant outcome
		for (var i = 0, len = selector.length; i < len; i++) {
			tree = tree[selector[i]];
		}

		return tree;
	},


	//Traverse an outcome tree to set the value for a desired key-set
	//Argument one is a nested object, while argument 2 is an array of keys for the object, 1 layer at a time.
	outcomeTreeSetValue(tree, selector, value) {

		//Find the next item in the chain associated with the resultant outcome
		for (var i = 0, len = selector.length - 1; i < len; i++) {
			tree = tree[selector[i]];
		}

		return tree[selector[i]] = value;
	}
}



module.exports = playable;

},{"../state":50,"synchronous-promise":71}],11:[function(require,module,exports){
"use strict";

//  Game state
var { registry } = require("../state");

// helper function
var { isFunction } = require("./general");

// Player claass
var { _Player } = require("../player");

// Population
var { gamePopulation } = require("../population")

// Plugins
var PluginManager = require("../plugin-manager/")

var player = {

	//reset all players. Recreate from class, re-assign strategy, loop through objects that reference player to set new reference. result argument is only for pass-through.
	reinitializePlayers(population = "all", result = null) {
		return Promise.resolve().then(function() {
			var oldPlayer, strategy, parameters;

			// if no population is supplied, fetch everybody
			if (population === "all") population = Object.keys(registry.players)
			else(population = population.ids())

			//Redefine each player
			for (var i = 0; i < population.length; i++) {
				var player = population[i];

				oldPlayer = registry.players[player];
				strategy = oldPlayer.strategy ? oldPlayer.strategy._id : null;
				parameters = {}; //TODO: when adding player parameters, be sure they're included here

				registry.players[player] = new _Player(oldPlayer.id, parameters);
				registry.players[player].interface = oldPlayer.interface;
				strategy && registry.players[player].assign(strategy);

				// Plugin, to alter players in re-initialization
				PluginManager.run("player-reinitialize", registry.players[player]);
			}

			//For each choice, recreate player references
			for (var choice in registry.choices) {
				if (registry.choices[choice].player)
					registry.choices[choice].player = registry.players[registry.choices[choice].player.id];
			}

			return Promise.resolve(result);
		});
	}
};

module.exports = player;

},{"../player":43,"../plugin-manager/":45,"../population":49,"../state":50,"./general":7}],12:[function(require,module,exports){
"use strict";

var log = require('../logger');

// State variables
var {idCounters, registry} = require('../state');

var state = {
	
	//Handle ID setting for all objects that get stored in the registry
	idHandler: function idHandler(id, type, recursing=false){
		//Assign id
		
		idCounters[type]++;
		var counter = idCounters[type];
		
		if (!id) {
			return type + counter.toString();
		}
		else {
			
			// Check that id isn't taken. If it is, construct a new one.
			
			//Construct list of all objects by extracting all registry entries
			var items = []
			Object.keys(registry).forEach(function(reg){items.push.apply(items, Object.keys(registry[reg]))})
			
			// if id is already taken, generate a new one by adding a number at the end.
			if (items.indexOf(id) > -1) {
				
				var match, oldNum, exp, newId;
				var oldId = id;
				
				do {
					// This finds a number at the end, and increments it, or starts with 1 if there wasn't one.
					match = /\d+$/.exec(id);
					oldNum = match ? match[0] : "";
					exp = new RegExp(oldNum + "$");
					id = id.replace(exp, Number(oldNum) + 1)
				
				}	
				while (items.indexOf(id) >-1)
				
				// Log warning
				log("warn", "ID " + oldId + " is taken. Using instead " + id);
			}
			
			return id
		}
	}
};

module.exports = state;
},{"../logger":27,"../state":50}],13:[function(require,module,exports){
"use strict";

// Strategy registration
var { registerStrategyObject } = require("../engine").Frontend;

// Helper functions
var { isFunction, once } = require("./general");

//External dependency
var esprima = require("esprima");

var stockGames = {
	// utility function to create two ways to call a game, either with all the arguments, or curried, where the returned function takes players and parameters
	// The combineParameters setting will
	gameWrapper(game, {
		argumentValidator = function() { return true; },
		combineParameters = true,
		strategyLoader = null
	} = {}) {

		// If there's a strategy loader, make sure it only runs once
		var loadStrategies
		if (isFunction(strategyLoader)) loadStrategies = once(function() {
			registerStrategyObject(strategyLoader());
		});
		else loadStrategies = function() {}

		// run the game. Optionally, validate the arguments and load strageies first
		var generate = function(...args) {
			var result = argumentValidator(...args)
			if (result === true) {
				loadStrategies();
				return game(...args);
			} else throw new Error(result);
		}

		// creates a wrapper around the game, which accepts the first argument (players) and last argument (parameters), and passes it forward.
		// If combineParameters is set to true, then the second argument of the returned function will get merged with the last argument
		// given when generator is called.
		generate.createGenerator = function(...args) {

			var gameCode = esprima.parseScript("(" + game.toString() + ")")

			var gameArgs = gameCode.body[0].expression.params
			var lastArg = gameArgs[gameArgs.length - 1]

			var originalParameters
			if ((lastArg.name && lastArg.name.toLowerCase() === "parameters") || lastArg.type === "ObjectPattern" ||
				(lastArg.type == "AssignmentPattern" && lastArg.left.type == "ObjectPattern")) {
				// Check that the game arguments and createGenerator arguments are the correct lengths. createGenerator should be
				// 1 less than game, because players is omitted.
				// TODO: use esprima to allow players to be anywhere in the game definition (or even omitted) rather than first
				if (args.length == gameArgs.length - 1) originalParameters = args.pop();
			}


			return function(players, parameters = {}) {

				// If combining parameters, merge and remove from arguments
				if (combineParameters && originalParameters) parameters = Object.assign({}, originalParameters,
					parameters)

				return generate(players, ...args, parameters)
			}
		}

		return generate;
	}


}

module.exports = stockGames;

},{"../engine":6,"./general":7,"esprima":59}],14:[function(require,module,exports){
"use strict";

// Strategies
var { Strategies } = require("../strategy");

// Players
var { Player } = require("../player");

module.exports = {
	// Create a player for each available strategy
	generatePopulation() {
		var players = [];

		Strategies().forEach(function(strategy) {
			players.push(Player({ assign: strategy }));
		});

		return players;
	}
};

},{"../player":43,"../strategy":52}],15:[function(require,module,exports){
"use strict";

var {SynchronousPromise} = require('synchronous-promise');

var turn = {
	
	//Recurse through the options in input, and write val to output. 
	recurse : function recurse(input, output, val, valGenerator=function(){}, path=[]){
		return SynchronousPromise.resolve(path).then(function(path){
			
			//Since we slice the array each time, if there are no more entries left then we're done with this branch.
			if (input.length == 0) return SynchronousPromise.resolve(path)
			
			
			//Among all values from the array
			return SynchronousPromise.all(input[0].map(function(item){
				var value;
				var splitPath = path.slice(0).concat(item);
				
				//If there are more items to iterate over, include them in the output then recurse.
				//If not, put in the new value.
				if (input.length == 1) {
					
					//If val is a function, wrap it in a function that will get supplied an argument with where we are				
					if (typeof val == "function") {
						value = function(){	
							var args = [splitPath].concat(Array.prototype.slice.call(arguments));
							return val.apply(null, args);
						};
					}
					else value = val || valGenerator(splitPath);
					
					output[item] = value;
				}
				else output[item] = {};
				
				
				return recurse(input.slice(1),output[item], val, valGenerator, splitPath);
			}));		
		});
	}
};


module.exports = turn;
},{"synchronous-promise":71}],16:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],17:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"../logger":27,"./general.js":16,"./index.js":17,"./logic.js":18,"./playable.js":19,"./player.js":20,"./state.js":21,"./stock-games.js":22,"./tournament.js":23,"./turn.js":24,"dup":8}],18:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],19:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"../state":50,"dup":10,"synchronous-promise":71}],20:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"../player":43,"../plugin-manager/":45,"../population":49,"../state":50,"./general":16,"dup":11}],21:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"../logger":27,"../state":50,"dup":12}],22:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"../engine":6,"./general":16,"dup":13,"esprima":59}],23:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../player":43,"../strategy":52,"dup":14}],24:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"synchronous-promise":71}],25:[function(require,module,exports){
"use strict";

//External dependency
var jsonata = require("jsonata");


var { isObject, isFunction } = require("./helperfunctions")("general");

//Extension of array to handle history lists.
function History(...args) {
	if (Array.isArray(args[0])) args = args[0];

	Object.setPrototypeOf(args, History.prototype);

	args.log = args.slice();
	args.log.tree = args;
	Object.setPrototypeOf(args.log, History.prototype);

	args.scores = [];
	args.scores.tree = args;
	Object.setPrototypeOf(args.scores, History.prototype);

	return args;
}

History.prototype = Object.create(Array.prototype);
History.prototype.constructor = History;

//To add entry
History.prototype.add = function(entry) {
	//Add to history and to log
	this.push(entry);
	if (this.log) this.log.push(entry);

	//Cycle up the parent tree, add to each log
	var check = this;
	if (check.tree instanceof History && check.tree.parent instanceof History) {
		check.tree.parent.log.add(entry);
	}
	if (check.parent instanceof History) {
		check.parent.log.add(entry);
	}

	//If we're being called fr

	return this;
};

//To add entry without logging (for playables that would like the tree history
//to be structured differently than the log history.
History.prototype.addNoLog = function(entry) {
	this.push(entry);
	return this;
};


History.prototype.addScores = function(entry) {
	//Add to history
	this.scores.push(entry);

	//Cycle up the parent tree, add to each log
	var check = this;
	if (check.parent instanceof History) {
		check.parent.addScores(entry);
	}



	return this;
};


//A temporary History that can be merged back in later. The child and parent are linked until .orphan() is called.
History.prototype.child = function(parent = this) {
	var h = new History();
	h.parent = parent;
	return h;
};

//Same as .child except includes prior parent history when .print() is called.
History.prototype.childWithContent = function(parent = this) {
	var storedLog = parent.slice();
	var storedScores = parent.slice();

	var h = new History();


	h.log.print = function() {
		History.prototype.print.call(storedLog.concat(h.log))
	}
	h.scores.print = function() {
		History.prototype.print.call(storedScores.concat(h.scores))
	}

	h.parent = parent;
	return h;
};

//This severs the link between the temporary history and its parent. Use this when merging composite entries.
History.prototype.orphan = function() {
	delete this.parent;
	delete this.log;
	delete this.scores;
	return this;
};

//Clear history
History.prototype.clearHistory = function() {
	this.splice(0, this.length);
	if (this.log) this.log.splice(0, this.log.length);
	if (this.scores) this.scores.splice(0, this.scores.length);
	delete this.parent;
};

//End the game.
History.prototype.end = function() {
	this.stop = true;
	if (this.parent) this.parent.end();
};

//Get a particular sort of entry, eg. Turn.
History.prototype.getType = function(type) {
	return new History(
		this.filter(function(entry) {
			//If it's not an object, don't even bother.
			if (!isObject(entry)) return false;

			for (var key in entry) {
				if (key == type) return true;
			}

			return false;
		})
	);
};

History.prototype.mostRecent = function() {
	return this[this.length - 1]
}

//Help read the history in Chrome with less clutter.
History.prototype.print = function() {
	var history = JSON.parse(JSON.stringify(this));
	history.query = History.prototype.query
	return history;
};

History.prototype.query = function(queryString, ...args) {
	return jsonata(queryString).evaluate(this, ...args);
}

//Supply an entry, it will check for a property that is a History
History.prototype.recurse = function(type) {
	var list = this;

	return new History(
		list.map(function(entry) {
			for (var key in entry) {
				console.log(key, entry);
				if (entry[key] instanceof History) return entry[key].recurse(type);
				else if (key == type) return entry;
			}
			return null;
		})
	);
};

//Accept a History and return one suitable for the user
function UserHistory(history) {
	var userHistory = history.map(function(entry) {
		return JSON.parse(JSON.stringify(entry));
	});

	Object.setPrototypeOf(userHistory, UserHistory.prototype);

	//Attach methods from History, wrapped in a function. If those methods return a history,
	//then the function will convert that to a userHistory.
	for (var method in History.prototype) {
		if (isFunction(history[method])) {
			if (method != "constructor")
				userHistory[method] = (function(method) {
					return function() {
						var result = history[method].apply(history, arguments);
						if (result instanceof History) return new UserHistory(result);
						else if (isObject(result))
							return JSON.parse(JSON.stringify(result));
						else return result;
					};
				})(method);
		}
	}

	return userHistory;
}

UserHistory.prototype = Object.create(History.prototype);
UserHistory.prototype.constructor = UserHistory;

var gameHistory = new History(); //TODO: add choice-only history

module.exports = { History, UserHistory, gameHistory };

},{"./helperfunctions":17,"jsonata":64}],26:[function(require,module,exports){
"use strict";

//When a strategy's .choose() function is called, it is given an information set. That data is a limited map of the internal objects of the game engine, including information on the game history and the players. This is threaded through playables, much like History, so that a parent playable can specify an information set for the playables it calls, or else the default construction will be used. Additionally, the user can provide a filter function, to selectively delete (or add) information elements before they are passed to .choose().

//History functions
var { gameHistory, History } = require('./history');

//Population functions
var { gamePopulation, PlayerList } = require('./population');


function Information(history = gameHistory, population = gamePopulation, { parentHistory = [] } = {}) {
	this.history = history;
	this.population = population;

	// Record any history entries that need to be added to the records
	this.parentHistory = parentHistory.slice(0);

	this.additional = [];

	this.update();
};

//Check the source then cache a hard-copy.
Information.prototype.update = function(player, local) {
	this.infoPopulation = this.population().info();

	this.infoHistory = { log: this.parentHistory.concat(this.history.log).slice(0), scores: this.history.scores
			.slice(0) };

	this.additional = [];

	//Return value. Mimics .deliver()
	var information = {
		history: { log: this.infoHistory.log, scores: this.infoHistory.scores },
		population: this
			.infoPopulation
	}
	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);

	return information;
};

//Clone the cached copies and provide them. Will deliver the same thing every time until update is called.
Information.prototype.deliver = function(player, local) {
	var information = {
		history: { log: this.infoHistory.log, scores: this.infoHistory.scores },
		population: this
			.infoPopulation
	}


	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);
	if (this.additional) this.additional.forEach(function(entry) { Object.assign(information, entry) });

	return JSON.parse(JSON.stringify(information));
};

//This probably doesn't need to be a separate function, but adding it in case it expands later.
Information.prototype.addAdditional = function(entry = null) {
	if (entry) this.additional.push(entry);
};

//Make copy of this information function, which allows for updating and freezing.
Information.prototype.child = function() {
	var information = new Information(this.history, this.population, { parentHistory: this.parentHistory });

	return information;
};



//Game state, analogous to gameHistory
var PerfectInformation = new Information(gameHistory, gamePopulation);

//Overwrite .deliver(). PerfectInformation is always up-to-date! Thus no need to do a 2nd JSON.stringify.
PerfectInformation.deliver = function(player, local) {

	var information = this.update(player, local);

	if (player) information.me = information.population.get(player.id);
	if (local) Object.assign(information, local);

	return information;
};


module.exports = { Information, PerfectInformation };

},{"./history":25,"./population":49}],27:[function(require,module,exports){
"use strict";



var logger = function() {
	var args = [...arguments];
	var level = (args[0] == "silly" || !args[0]) ? "trace" : args[0];
	var level = level == "warning" ? "warn" : level;
	args.shift();

	logger.logger[level].apply(logger.logger, args);
};

//logger.logger = console;					//TODO clean this all up a lot.

var getLogger = require("loglevel-colored-level-prefix");
var options = { prefix: 'nashJS', level: 'trace' }
logger.logger = getLogger(options)

logger.setLevel = function(level) {
	logger.logger.level = level;
	logger.logger.setLevel(level)
};

/*
logger.useWinston = function(){

	var winston = require('winston');
	var util = require('util');

	winston.level = "warn";

	winston.clear()
	winston.add(winston.transports.Console, {
		level: 'trace',
		prettyPrint:  function ( object ){
			return util.inspect(object);
		},
		colorize: true,
		silent: false,
		timestamp: false
	});

	this.logger = winston;
};
*/

module.exports = logger;

},{"loglevel-colored-level-prefix":65}],28:[function(require,module,exports){
"use strict";

var log = require("./logger");

//Helper functions
var { isFunction } = require("./helperFunctions")("general");

// Extend function, the sneaky way.
var variablePrototype = Object.create(Function.prototype);

variablePrototype.constructor = function(value, { enforceNumber = true } = {}) {
	var variable = this;
	variable.value = enforceNumber ? value * 1 : value;
	variable.enforceNumber = enforceNumber

	this.id = function() {
		return _playable.id;
	}; //TODO: work on ids and registration
};

variablePrototype.call = function() {
	return this.value;
};

variablePrototype.toJSON = function() {
	return this.call();
};
variablePrototype.toString = function() {
	return this.call();
};
variablePrototype.valueOf = function() {
	return this.call();
};

variablePrototype.set = function(newValue) {
	this.value = this.enforceNumber ? newValue * 1 : newValue
	return this.value;
};

//Repurpose the very-similar code for Variable, but re-write certain keys
var expressionPrototype = Object.create(Function.prototype);

expressionPrototype.constructor = function(expression) {
	if (!isFunction(expression)) log("error", "Expression must be a function.");

	var value = expression();
	if (isNaN(value)) log("error", "Expression must return a number"); //TODO: should Expressions/Variables allow strings?

	this.value = expression;

	return value;
};

expressionPrototype.call = function() {
	return this.value() * 1;
};

expressionPrototype.toJSON = function() {
	return this.call();
};
expressionPrototype.toString = function() {
	return this.call();
};
expressionPrototype.valueOf = function() {
	return this.call();
};

expressionPrototype.set = function(newExpression) {
	if (!isFunction(newExpression))
		log("error", "Expression must be a function.");

	var value = newExpression();
	this.value = newExpression;

	return value;
};

//Produces the function that will produce the end result. This part is reusable if you need to do this again.
var classFactory = function(proto) {
	return function() {
		var f = function() {
			return f.call.apply(f, arguments);
		};

		Object.defineProperty(f, "constructor", {
			configurable: true,
			writable: true
		});
		Object.defineProperty(f, "call", {
			writable: true
		});
		Object.defineProperty(f, "toString", {
			writable: true
		});
		Object.defineProperty(f, "valueOf", {
			writable: true
		});

		Object.keys(proto).forEach(function(key) {
			f[key] = proto[key];
		});

		f.constructor.apply(f, arguments);

		return f;
	};
};

var Variable = classFactory(variablePrototype);
var Expression = classFactory(expressionPrototype);
// called as: var instance = Variable();

// A pre-built Expression generator, for generating random numbers
var RandomVariable = function({ lowerbound = 0, upperbound = 10, generator = "uniform" }) {

	if (isFunction(generator)) {
		var expression = Expression(generator);
		expression.generator = generator;
		return expression;

	} else if (generator.toLowerCase() == "uniform") {
		generator = function() {
			return Math.floor(Math.random() * (upperbound - lowerbound + 1) + lowerbound);
		};
		//	TODO: add more distributions here.
	}

	return Expression(generator);
};



// A way to have Variables which are more complicated things, like arrays or obects
var ComplexVariable = function(value) {
	var variable = Variable(value, { enforceNumber: false })

	var excludeList = ["set", "call", "toJSON", "toString", "valueOf"]

	var handler = {
		get(target, key) {
			var prop;
			if (excludeList.indexOf(key) > -1) prop = target[key].bind(target);
			else {
				prop = target.value[key]
				if (isFunction(prop)) prop = prop.bind(target.value)
			}

			return prop
		},
		set(target, key, prop) {
			target.value[key] = prop;
			return true;
		}
	}
	return new Proxy(variable, handler)
}




module.exports = {
	variablePrototype,
	Variable,
	expressionPrototype,
	Expression,
	RandomVariable,
	ComplexVariable
};

},{"./helperFunctions":8,"./logger":27}],29:[function(require,module,exports){
"use strict";

var log = require("../logger");
log("debug", "Loading Class: Choice");

// External dependency
var { SynchronousPromise } = require("synchronous-promise");

//Game state controllers
var { registry } = require("../state");
var { gameHistory } = require("../history");
var { PerfectInformation } = require("../information");

//Helper functions
var { idHandler } = require("../helperFunctions")("state");
var { isFunction } = require("../helperFunctions")("general");
var { chainerGenerator } = require("../helperFunctions")("playable");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Choice
function _Choice(id, player, options, parameters = {}) {
	_Playable.call(this, id);

	this.next = {};

	this.player = registry.players[player];
	this.options = options;
	this.defaultOption = parameters.defaultOption || options[0]; //TODO: make defaultOption functional
	this.informationFilter = parameters.informationFilter || null;
	this.usePayoffs = parameters.usePayoffs || false;

	registry.choices[id] = this;

	var choice = this;
	this.options.forEach(function(item) {
		choice.next[item] = [];
	});
}

_Choice.prototype = Object.create(_Playable.prototype);
_Choice.prototype.constructor = _Choice;

_Choice.registryName = "choices";
_Choice.counterName = "choice";

_Choice.prototype.play = function({
	usePayoffs = this.usePayoffs,
	history = gameHistory,
	information: rawInformation = PerfectInformation,
	releasePlayer = true,
	informationFilter = this.informationFilter,
	_compileInformation = null
} = {}) {
	var choice = this;

	if (!choice.player.alive)
		return Promise.reject({
			result: choice.id + ": Player " + choice.player.id + " is dead."
		});

	//While this choice is happening, don't allow other choices to use this player.
	choice.player.available = false;

	//Information mechanics. If we're dealing with PerfectInformation, this won't get delivered, so we'll include it in the call to .deliver(). If we're using an information supplied from some other playable, then they can do what they like with it.
	var choiceInfo = {
		choice: {
			id: choice.id,
			player: choice.player.id,
			options: choice.options
		}
	};
	rawInformation.addAdditional(choiceInfo);
	//Perform some data processing if other playables need it.
	if (_compileInformation) _compileInformation(rawInformation);

	return Promise.resolve()
		.then(function() {
			//Prep information
			var information = rawInformation.deliver(choice.player, choiceInfo);
			if (informationFilter) information = informationFilter(information);

			return choice.player.choose(choice.options.slice(0), information);
		})
		.then(function(result) {
			var player = choice.player;
			var id = choice.id;

			//Add to player's individual history;
			player.history.push({
				choice: id,
				options: choice.options,
				result
			});

			result = result || choice.defaultOption;

			var resultObject = {
				result,
				historyEntry: {
					choice: id,
					player: player.id,
					result
				}
			};

			//This will probably only happen if it's a single-player game, otherwise we'll use playoffs defined in a Turn
			if (usePayoffs) {
				var payout = choice.payoffs[result];

				player.score += payout;

				//track the payoff
				var scoreEntry = {
					choice: id,
					payouts: {
						[player.id]: Number(payout)
					}
				};

				history.addScores(scoreEntry);
				resultObject.historyEntry.payouts = {
					[player.id]: payout
				};
			}

			log(
				"silly",
				"_Choice.play: removing from occupiedPlayers: ",
				choice.player.id
			);
			if (releasePlayer) choice.releasePlayer();

			return Promise.resolve(resultObject); //TODO: add information mechanisms
		});
};

//Release player from excluded players list, so that other objects can use it.
_Choice.prototype.releasePlayer = function() {
	this.player.available = true;
};

_Choice.prototype.findNext = function({ result } = {}) {
	return this.next[result.result];
};

_Choice.prototype.generateChainingFunctions = function(choice) {
	var _choice = this;

	_choice.options.forEach(function(option) {
		_choice.payoffs[option] = 0; //Start payoffs at zero

		choice[option] = function(payoff) {
			//Create functions for user to assign payoffs
			if (!isNaN(payoff)) _choice.payoffs[option] = payoff;
			return SynchronousPromise.resolve({
				playable: choice,
				path: [option]
			});
		};
	});
};

_Choice.prototype.summaryThis = function(summary) {
	summary.player = this.player.id;
	summary.options = this.options.slice();

	return summary;
};

//TODO: un-fuck this.
_Choice.prototype.summaryNext = function(
	summary,
	entries = {},
	shortCircuit = false,
	maxEntries = 10
) {
	// Copy over the choice options
	summary.next = Object.assign({}, this.next);

	// Loop through them and summarize at each step.
	var count = 0;
	for (var key in summary.next) {
		summary.next[key] = summary.next[key].map(function(playable) {
			count++;
			return playable.summarize({}, entries);
		});
	}

	// If there weren't any next steps, delete the next key, to reduce clutter.
	if (count == 0) delete summary.next;

	return summary;
};

//Set all payoffs to zero.
_Choice.prototype.zeroPayoffs = function() {
	var choice = this;

	choice.payoffs = {};

	choice.options.forEach(function(option) {
		choice.payoffs[option] = 0;
	});
};

function Choice(player, options, parameters = {}) {
	var id = idHandler(parameters.id, "choice");

	//If informationFilter was supplied, it must be a function
	if (parameters.informationFilter && !isFunction(parameters.informationFilter))
		throw new Error("informationFilter must be a function");

	//Create backend choice object
	var _choice = new _Choice(id, player.id(), options, parameters);

	//Return this reference object to the user. Run the function to select a source
	var choice = Playable(_choice);

	//Interface to specify single-player payoffs in single-player/single-choice games
	_choice.zeroPayoffs();

	_choice.generateChainingFunctions(choice);

	/*
	options.forEach(function(option){
		_choice.payoffs[option] = 0;			//Start payoffs at zero

		choice[option] = function(payoff){					//Create functions for user to assign payoffs
			if (!isNaN(payoff))_choice.payoffs[option] = payoff;
			return Promise.resolve({
				playable:choice,
				path:[option]
			})
		};
	});
	*/

	//Function to set all payoffs at once
	choice.setAllPayoffs = function(payoffs) {
		if (!Array.isArray(payoffs)) throw new Error("Payoffs must be array")
		if (payoffs.length != registry.choices[id].options.length) throw new Error(
			"Payoffs must be same dimensions as choice options")

		payoffs.forEach(function(payoff, index) {
			registry.choices[id].payoffs[options[index]] = payoff;
		})
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};

	//Way for user to interact with payoffs
	choice.payoffs = function() {
		return registry.choices[id].payoffs;
	};

	return choice;
}

module.exports = { _Choice, Choice };

},{"../helperFunctions":8,"../history":25,"../information":26,"../logger":27,"../state":50,"./playable":35,"synchronous-promise":71}],30:[function(require,module,exports){
"use strict";

var log = require("../logger");
log("debug", "Loading Class: Consecutive");

//Game state controllers
var { registry } = require("../state");
var { gameHistory } = require("../history");

//Helper functions
var { idHandler } = require("../helperFunctions")("state");

//Information
var { Information, PerfectInformation } = require("../information");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Consecutive
function _Consecutive(id, playablesArray, parameters = {}) {
	_Playable.call(this, id, parameters);

	playablesArray = playablesArray.map(function(playable) {
		return registry.playables[playable.id()]
	})
	this.playablesArray = playablesArray

	registry.consecutives[id] = this;
}
_Consecutive.prototype = Object.create(_Playable.prototype);
_Consecutive.prototype.constructor = _Consecutive;

_Consecutive.registryName = "consecutives";
_Consecutive.counterName = "consecutive";

_Consecutive.prototype.play = function({
	history = gameHistory,
	information = this.information ||
	PerfectInformation
} = {}) {

	var consecutive = this;

	//Log the history appropriately
	var startEntry = {
		consecutive: consecutive.id,
		action: "start"
	};
	history.log.add(startEntry);

	//History object to give to consecutived playables.
	var consecutiveHistory = history.child();

	//compartmentalize if set. "compartmentalize" means pass on information as if this playable is the entire game.
	if (consecutive.compartmentalize) {
		information = new Information(consecutive.compartmentalize.history || consecutiveHistory,
			consecutive.compartmentalize.population || information.population);
	}

	var action = function action(playablesArray) {
		//Stop if the game is over.
		if (history.stop) return { playable: consecutive };

		if (playablesArray.length > 0) {
			return playablesArray.shift().play({ shortCircuit: true, history: consecutiveHistory, information })
				.then(function(result) {
					return action(playablesArray) || result
				})
		} else return false
	}

	return action(consecutive.playablesArray.slice())
		.then(function(result) {
			result.historyEntry = {
				consecutive: consecutive.id,
				action: consecutiveHistory.orphan()
			};

			//TODO: add information mechanisms

			return Promise.resolve(result);
		});
};

//Overwrite history handler so that tree doesn't have "start" and "finish" entries.
_Consecutive.prototype.handleHistory = function({ history = gameHistory } = {},
	result
) {
	var consecutive = this;

	return Promise.resolve(result).then(function(result) {
		history.log.add({
			consecutive: consecutive.id,
			action: "finish",
			duration: result.historyEntry.duration
		});

		history.addNoLog(result.historyEntry);
		return Promise.resolve(result);
	});
};

//TODO: finish this!
_Consecutive.prototype.summaryThis = function(summary, entries, shortCircuit) {
	summary.action = {};

	this.playableStart.summarize(
		summary.action,
		entries,
		(shortCircuit = this.playableFinish)
	);
};

function Consecutive(playablesArray, parameters = {}) {
	var id = idHandler(parameters.id, "consecutive");

	//Create backend loop object
	var _consecutive = new _Consecutive(id, playablesArray, parameters);

	//Return this reference object to the user. Run the function to select a source
	var consecutive = Playable(_consecutive);

	consecutive.ids = function() {
		return playablesArray.map(function(playable) {
			return playable.id();
		})
	}

	return consecutive;
}

module.exports = { _Consecutive, Consecutive };

},{"../helperFunctions":8,"../history":25,"../information":26,"../logger":27,"../state":50,"./playable":35}],31:[function(require,module,exports){
"use strict";

var log = require('../logger');
log("debug", "Loading Class: HaltIf")

//Game state controllers
var {registry} = require('../state');
var {gameHistory} = require('../history');

//Helper functions
var {isFunction}	= require('../helperFunctions')("general");
var {idHandler} 	= require('../helperFunctions')("state");

//Parent class
var {_Playable, Playable} = require('./playable');



//Backend function class for Game
function _Halt(id,testCondition, {logContinue = false}){
	_Playable.call(this,id);
	
	this.testCondition = testCondition;
	this.logContinue = logContinue;
	
	registry.halts[id] = this;
}

_Halt.prototype = Object.create(_Playable.prototype);
_Halt.prototype.constructor = _Halt;

_Halt.registryName = "halts";
_Halt.counterName = "haltIf";

_Halt.prototype.play = function({initializePlayers=false, shortCircuit=false, history=gameHistory}={}){
	
	var halt = this;
	
	var resultObject = {
		'playable':halt,
		'historyEntry':{
			'halt':halt.id
		}
	};
	
	
	var test = halt.testCondition();
	
	
	if (test) {
		log("info", "Halting at " + halt.id)
		
		resultObject.historyEntry.action = "halt";
		resultObject.result = "Halt";
	
		return Promise.reject(resultObject);
	}
	
	//Halt probably gets used for loops, and we might not want to see lots of continue messages, so "logContinue" will omit them.
	if (halt.logContinue) {
		resultObject.historyEntry.action = "continue";
	}
	else delete resultObject.historyEntry
	
	
	return Promise.resolve(resultObject)
};


_Halt.prototype.summaryThis = function(summary){
	summary.condition = this.testCondition.toString();
}



function HaltIf(testCondition=function(){}, {id=null, logContinue=false}={}){
	var id = idHandler(id,"haltIf")
	
	if (!isFunction(testCondition)) log("warn",id + ": testCondition should be a function, or else game will not halt.")

	//Create backend loop object
	var _halt = new _Halt(id, testCondition, {logContinue});
	
	
	//Return this reference object to the user. Run the function to select a source
	var halt = Playable(_halt);	
	return halt;	
}


module.exports = {_Halt, HaltIf};
},{"../helperFunctions":8,"../history":25,"../logger":27,"../state":50,"./playable":35}],32:[function(require,module,exports){
"use strict";

//Loads the playables that will be used by Nash. This is basically the controller list: if it's not in these lists,
// then it won't be available for us.

//External dependency
var present = require("present");

var log = require("../logger");

var { applyBind } = require("../helperFunctions")("general");

log("debug", "Loading Playable Classes: ");

//Playables
var { _Playable } = require("./playable");
var { _Choice, Choice } = require("./choice");
var { _Turn, Turn } = require("./turn");
var { _Sequence, Sequence } = require("./sequence");
var { _Consecutive, Consecutive } = require("./consecutive");
var { _Loop, Loop } = require("./loop");
var { _SLoop, StochasticLoop } = require("./stochasticLoop");
var { _Halt, HaltIf } = require("./halt-if");
var { _SHalt, StochasticHalt } = require("./stochastic-halt");
var { _Lambda, Lambda } = require("./lambda");
var { _RPChoice, RandomPlayerChoice } = require("./random-player-choice");
var { _PopulationDynamics, PopulationDynamics } = require("./population-dynamics");
var { _Simultaneous, Simultaneous } = require("./simultaneous");

//Runs when loading Playable classes.
function initializePlayableClass(playableClass) {
	//Replace the .play() method with a wrapper which calls it and a few other functions
	if (playableClass.prototype.hasOwnProperty("play")) {
		playableClass.prototype.play = (function(play) {
			return function({ history = gameHistory } = {}) {
				var playable = this;
				var args = [].slice.call(arguments);

				// Set our history
				args[0].history ? null : args[0].history = this.history || gameHistory

				// how to halt the game without errors. TODO this is probably fucked
				if (history.stop) return { playable };


				return _Playable.prototype._startTimer
					.apply(playable, args)
					.then(applyBind(playable.checkInit, playable, args))
					.then(applyBind(playable.prePlay, playable, args))
					.then(applyBind(play, playable, args))
					.then(applyBind(playable.postPlay, playable, args))
					.then(applyBind(_Playable.prototype._stopTimer, playable, args))
					.then(applyBind(playable.handleHistory, playable, args))
					.then(applyBind(_Playable.prototype.proceed, playable, args));
			};
		})(playableClass.prototype.play);
	}
}

exports.playableClasses = {
	_Playable,
	_Choice,
	_Turn,
	_Sequence,
	_Consecutive,
	_Loop,
	_SLoop,
	_Halt,
	_SHalt,
	_Lambda,
	_RPChoice,
	_PopulationDynamics,
	_Simultaneous
};
exports.playableInterfaces = {
	Choice,
	Turn,
	Sequence,
	Consecutive,
	Loop,
	StochasticLoop,
	HaltIf,
	StochasticHalt,
	Lambda,
	RandomPlayerChoice,
	PopulationDynamics,
	Simultaneous
};

for (var playableClass in exports.playableClasses) {
	if (playableClass != "_Playable")
		initializePlayableClass(exports.playableClasses[playableClass]);
}

},{"../helperFunctions":8,"../logger":27,"./choice":29,"./consecutive":30,"./halt-if":31,"./lambda":33,"./loop":34,"./playable":35,"./population-dynamics":36,"./random-player-choice":37,"./sequence":38,"./simultaneous":39,"./stochastic-halt":40,"./stochasticLoop":41,"./turn":42,"present":67}],33:[function(require,module,exports){
"use strict";

var log = require('../logger');
log("debug", "Loading Class: Lambda")

//Game state controllers
var { registry, gameHistory } = require('../state');

// Information mechanics
var { PerfectInformation } = require("../information");

//Helper functions
var { isFunction } = require('../helperFunctions')("general");
var { idHandler } = require('../helperFunctions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');



//Backend function class for Game
function _Lambda(id, action, parameters = {}) {
	_Playable.call(this, id);

	this.action = action;

	registry.lambdas[id] = this;
}
_Lambda.prototype = Object.create(_Playable.prototype);
_Lambda.prototype.constructor = _Lambda

_Lambda.registryName = "lambdas";
_Lambda.counterName = "lambda";


_Lambda.prototype.play = function({ initializePlayers = false, shortCircuit = false, history = gameHistory,
	information = PerfectInformation } = {}) {

	var lambda = this;

	var result = lambda.action({ history, information })

	var resultObject = {
		result,
		'playable': lambda,
		historyEntry: {
			lambda: lambda.id,
			result
		}
	};

	return Promise.resolve(resultObject)
};

// Simple helper to just run synchronously whatever the Lambda is. Useful for debugging.
_Lambda.prototype.run = function() {
	return this.action();
}

_Lambda.prototype.summaryThis = function(summary) {
	summary.action = this.action.toString();
}


function Lambda(action = function() {}, parameters = {}) {
	var id = idHandler(parameters.id, "lambda")

	if (!isFunction(action)) log("warn", id + ": action should be a function.")

	//Create backend lambda object
	var _lambda = new _Lambda(id, action, parameters);


	//Return this reference object to the user. Run the function to select a source
	var lambda = Playable(_lambda);


	lambda.run = function() {
		return _lambda.run();
	}

	return lambda;
}


module.exports = { _Lambda, Lambda };

},{"../helperFunctions":8,"../information":26,"../logger":27,"../state":50,"./playable":35}],34:[function(require,module,exports){
"use strict";

var log = require("../logger");
log("debug", "Loading Class: Loop");

//Game state controllers
var { registry } = require("../state");
var { gameHistory, History } = require("../history");

//Helper functions
var { idHandler } = require("../helperFunctions")("state");
var { chainerGenerator } = require("../helperFunctions")("playable");

// Information mechanics
var { Information, PerfectInformation } = require("../information");
var { gamePopulation } = require("../population");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Loop

function _Loop(id, playable, count, parameters) {
	_Playable.call(this, id, parameters);

	var { logContinue = true, playableParameters = {} } = parameters;

	this.playable = registry.playables[playable.id()];
	this.logContinue = logContinue;
	this.playableParameters = playableParameters;

	this.count = count;

	registry.loops[id] = this;
}
_Loop.prototype = Object.create(_Playable.prototype);
_Loop.prototype.constructor = _Loop;

_Loop.registryName = "loops";
_Loop.counterName = "loop";

_Loop.prototype.play = function({
	history = this.history || gameHistory,
	information = this.information || PerfectInformation,
	playableParameters = this.playableParameters
} = {}) {

	var loop = this;
	loop.counter = 0;

	// Split the history entry
	var loopHistory = history.child();

	// information mechanics.
	//compartmentalize If set
	if (loop.compartmentalize) {
		information = new Information(loop.compartmentalize.history || loopHistory,
			loop.compartmentalize.population || information.population);
	}
	// Pass along
	playableParameters.information = information


	var promise = Promise.resolve();

	var action = function(result) {
		//If the game has been ended early, don't continue.
		if (history.stop) return { playable: loop };

		loop.counter++;
		if (!result) result = {};

		//Deal with history
		history.log.add({
			loop: loop.id,
			loopTo: loop.playable.id,
			count: loop.counter
		});

		playableParameters.shortCircuit = true;
		playableParameters.history = loopHistory;

		return loop.playable.play(playableParameters).then(function(result) {
			//Re-format result, replace playable with Loop playable
			result.playable = loop;

			//TODO: add information mechanisms

			return Promise.resolve(result);
		});
	};

	//Repeat the playable loop.count times, by chaining promises.
	for (var i = 0; i < loop.count; i++) {
		promise = promise.then(action);
	}

	return promise.then(function(result) {
		result.historyEntry = {
			loop: loop.id,
			count: loop.counter,
			action: loopHistory.orphan()
		};
		return Promise.resolve(result);
	});
};

//Overwrite history handler to prevent "loop finished" entry from hitting the tree.
_Loop.prototype.handleHistory = function({
		history = this.history || gameHistory,
		information = this.information || PerfectInformation,
		logContinue = this.logContinue
	} = {},
	result
) {
	var loop = this;

	return Promise.resolve(result).then(function(result) {
		//Write final entry if logContinue is set to true
		if (logContinue) {
			history.log.add({
				loop: loop.id,
				loopTo: "Loop finished.",
				count: loop.counter
			});
		}

		history.addNoLog(result.historyEntry);

		return result;
	});
};

// Add detail/nesting to summary.
_Loop.prototype.summaryThis = function(summary, entries) {
	summary.count = this.count;

	summary.action = {};
	this.playable.summarize(summary.action, entries, true);
};

function Loop(playable, count = 1, parameters = {}) {
	var id = idHandler(parameters.id, "loop");

	//Create backend loop object
	var _loop = new _Loop(id, playable, count, parameters);

	//Return this reference object to the user. Run the function to select a source
	var loop = Playable(_loop);
	return loop;
}

module.exports = { _Loop, Loop };

},{"../helperFunctions":8,"../history":25,"../information":26,"../logger":27,"../population":49,"../state":50,"./playable":35}],35:[function(require,module,exports){
"use strict";

var log = require("../logger");
log("debug", "Loading Class: Playable");

var { SynchronousPromise } = require("synchronous-promise");
var present = require("present");

//Game state controllers
var { registry, idCounters } = require("../state");
var { gameHistory, History } = require("../history");

//Helper functions
var { isFunction } = require("../helperFunctions")("general");
var { outcomeTreeAddAll, outcomeTreeGetValue } = require("../helperFunctions")("playable");
var { reinitializePlayers } = require("../helperFunctions")("player");

//To return to user
var { Population, PlayerList } = require("../population");

//_playable class, superclass for objects which can execute game steps (choice, turn, game)
function _Playable(id, parameters = {}) {
	this.id = id;
	this.next = [];
	registry.playables[id] = this;
	idCounters.playable++;

	parameters.compartmentalize ? this.compartmentalize = parameters.compartmentalize : null;
	parameters.history ? (this.history = parameters.history) : null;
	parameters.information ? (this.information = parameters.information) : null;
	parameters.initializePlayers ? (this.initializePlayers = parameters.initializePlayers) : null;
}

_Playable.registryName = "playables";
_Playable.counterName = "playable";

//Add reference to next playable branch, to chain playables together.
_Playable.prototype.addNext = function(nextPlayable) {
	outcomeTreeAddAll(this.next, nextPlayable);
};

//Called before .play() to start timing.
_Playable.prototype._startTimer = function() {
	this._timer = present();
	return Promise.resolve();
};

//Called before prePlay, initialize players if true.
_Playable.prototype.checkInit = function({ initializePlayers = this.initializePlayers } = {}, result) {
	// if we get something
	if (initializePlayers) {
		// if it's just true, then reinitialize everybody
		if (initializePlayers === true) return reinitializePlayers("all", result)

		// if it's a playerList, use that
		else if (initializePlayers instanceof PlayerList) return reinitializePlayers(initializePlayers)

		// if we get a function, then run the function and check that it's returning a playerList
		else if (isFunction(initializePlayers)) {
			var list = initializePlayers()
			if (list instanceof PlayerList) return reinitializePlayers(list, result);
		}

		// otherwise, convert it to a playerList and let PlayerList deal with it.
		else return reinitializePlayers(new PlayerList(initializePlayers), result);
	}

	// if we didn't get anything or got false, we're done here.
	else return Promise.resolve(result);
};


//Called before .play() but after _startTimer
_Playable.prototype.prePlay = function({} = {}, result) {
	return Promise.resolve(result);
};

//Called after .play(), overwritable.
_Playable.prototype.postPlay = function({} = {}, result) {
	return Promise.resolve(result);
};

//Called after .postPlay() to stop timer and log.
_Playable.prototype._stopTimer = function({} = {}, result) {
	if (result.historyEntry)
		result.historyEntry.duration = present() - this._timer;
	delete this._timer;

	return Promise.resolve(result);
};

//Called after timer stops, to write log. Overwiteable if playable has specific logging behavior.
_Playable.prototype.handleHistory = function({ history = gameHistory } = {},
	result
) {
	return Promise.resolve(result).then(function(result) {
		if (result.historyEntry) history.add(result.historyEntry);
		return Promise.resolve(result);
	});
};

//Determine whether to play next, and if so, do.
_Playable.prototype.proceed = function({ shortCircuit } = {}, result) {
	var playable = this;

	return Promise.resolve(result).then(function(result) {
		//Replace reported playable with latest running playable (this is necessary for short-circuit logic)
		result.playable = playable;

		//Short-circuit logic allows higher-order playable to figure out what to do next.
		if (shortCircuit) return Promise.resolve(result);

		return playable.playNext(result);
	});
};

//Play next.
_Playable.prototype.playNext = function(result, parameters = {}) {
	var playable = this;

	return Promise.resolve(result).then(function(result) {
		//Find out where to go next
		var next = playable.findNext({ result });

		//If there's somewhere to go, then go.
		if (next[0] instanceof _Playable)
			return Promise.all(
				next.map(function(playable) {
					return playable.play(parameters);
				})
			);

		//Otherwise, we're done here
		return Promise.resolve(result);
	});
};

// Return the next playable in the sequence. Overwriteable for playables with more complicated branching.
_Playable.prototype.findNext = function() {
	return this.next;
};

_Playable.prototype._summarize = function() {};

// Summarize the game structure. Calls summaryThis and summaryNext, which are overwritable.
_Playable.prototype.summarize = function(
	summary = {},
	entries = {},
	shortCircuit = false,
	maxEntries = 10
) {
	// Start summary for this playable
	summary[this.constructor.counterName] = this.id;

	// Track how many times we've been here before, to avoid circular recursion
	entries[this.id] ? ++entries[this.id] : (entries[this.id] = 1);
	if (entries[this.id] > maxEntries) shortCircuit = true;

	// Add summary
	this.summaryThis(summary, entries);

	// Proceed to next steps
	if (!shortCircuit || shortCircuit !== this)
		this.summaryNext(summary, entries);

	return summary;
};

// Adds the summary information on this playable. Overwrite this in order to add specific information.
_Playable.prototype.summaryThis = function(summary = {}, entries = {}) {
	return summary;
};

// Adds summary information down the next-path. Overwite this for playables with more complex branching.
_Playable.prototype.summaryNext = function(summary = {}, entries = {}) {
	// If there's a next-entry
	if (this.next.length > 0) {
		// Loop over each next-item, and summarize it.
		summary.next = this.next.map(function(playable) {
			return playable.summarize({}, entries);
		});

		// If there's only one item, no need for an array.
		if (summary.next.length == 1) summary.next = summary.next[0];
	}
};


//Convoluted code here to produce the object that user interacts with (ie c1 in 'c1 = Choice()')
//This mimics creating a class that inherits from Function. First define the "prototype", which includes
//a "constructor", a "call" method that will get called, and any other properties and methods.
//Then 'classFactory' produces the class/constructing object (see below), which you can use to
//produce the actual objects.

var playablePrototype = Object.create(Function.prototype);

playablePrototype.constructor = function(_playable) {
	var playable = this;

	//Tag-back. Store the front-end object in the back-end object, for retrieval
	_playable.interface = playable;

	this.call = function(source) {
		var previousPlayable, path;

		//TODO: verify that source is the right type

		return SynchronousPromise.all([
			(function() {
				if (source instanceof Promise || source instanceof SynchronousPromise) {
					source.then(function(result) {
						previousPlayable = registry.playables[result.playable.id()];
						path = result.path;
						console.log(path);
						return SynchronousPromise.resolve();
					});
				}
				return SynchronousPromise.resolve();
			})(),
			(function() {
				if (!(source instanceof Promise || source instanceof SynchronousPromise)) {
					previousPlayable = registry.playables[source.id()];
					path = source.path;
				}

				return SynchronousPromise.resolve();
			})()
		]).then(function(result) {
			console.log(path);
			log(
				"debug",
				"Adding next playable to " +
				previousPlayable.id +
				", node " +
				_playable.id
			);

			if (path == "all") previousPlayable.addNext(_playable);
			else {
				outcomeTreeGetValue(previousPlayable.next, path).push(_playable);
			}

			log("silly", previousPlayable.next);
			//previousPlayable.next[selected].push(_choice);

			return SynchronousPromise.resolve({
				playable: playable,
				path: "all"
			});
		});
	};

	this.id = function() {
		return _playable.id;
	};

	this.play = function({
		initializePlayers = false,
		usePayoffs = true,
		shortCircuit = false,
		writeHistory =
		true,
		clearHistory = true,
		releasePlayers = true
	} = {}) {

		if (clearHistory) gameHistory.clearHistory();

		var history = writeHistory ?
			_playable.history || gameHistory :
			new History();

		return Promise.resolve()
			.then(function(result) {
				return _playable.play({ initializePlayers, usePayoffs, shortCircuit, history, releasePlayers });
			})
			.catch(function(reason) {
				console.log(reason);

				//If the game was stopped by a Halt playable or everybody's dead, we'll end up here, and things are fine. Just log it.
				if (reason.result == "Halt") {
					gameHistory.add(reason.historyEntry);
					return Promise.resolve(reason.result);
				} else if (reason.result == "Population Collapse")
					return Promise.resolve(reason.result);
				else {
					history.log.add({ error: reason });
					return Promise.reject(reason);
				}
			})
			.then(function(result) {
				//Replace result, so that user can't get access to _playables

				return Promise.resolve({
					Population: Population(),
					gameHistory
				});
			});
	};

	this.summarize = function() {
		return _playable.summarize({});
	};
};

playablePrototype.call = function() {
	//This will get overwritten when the "constructor" is called, but leaving it here so you can figure out how the hell this works.
};

playablePrototype.path = "all";

//Produces the function that will produce the end result. This part is reusable if you need to do this again.
var classFactory = function(proto) {
	return function() {
		var f = function() {
			return f.call.apply(f, arguments);
		};

		Object.defineProperty(f, "constructor", {
			configurable: true,
			writable: true
		});
		Object.defineProperty(f, "call", { writable: true });

		Object.keys(proto).forEach(function(key) {
			f[key] = proto[key];
		});

		f.constructor.apply(f, arguments);

		delete f.constructor; //Added this bit here, to prevent the user from trying to create new objects.

		return f;
	};
};

var Playable = classFactory(playablePrototype);
// called as: var instance = Playable(/* some internal object like _choice */);

module.exports = { _Playable, Playable };

},{"../helperFunctions":8,"../history":25,"../logger":27,"../population":49,"../state":50,"present":67,"synchronous-promise":71}],36:[function(require,module,exports){
"use strict";

var log = require('../logger');

//External dependency
var poisson = require('randgen').rpoisson;

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {isFunction}	= require('../helperFunctions')("general");
var {idHandler} 	= require('../helperFunctions')("state");

//Parent class
var {_Playable, Playable} = require('./playable');

//Player controllers
var {_Player, Player} = require('../player');
var {PlayerList, UserPlayerList, gamePopulation, Population} = require('../population');

//Update this each time .play is called, but leave it available to the whole scope so that 
//growth and decay can access it
var population;

//Default growth function
var growthDefault = function growth(player, population, birthRate, selectiveMultiplier) {
	var score = player.score;
	var mean = population.scoresMean();
	var std = population.scoresStd();
	
	var Z = !(isNaN(std) || std==0) ? (score-mean)/std : 0
	
	console.log(score, mean, std,Z);
	
	var rate = birthRate + selectiveMultiplier*Z;

	var generated = poisson(rate);
	log("silly","growthDefault: generated random number " + generated.toString()+ " using rate "+ rate.toString());
	
	return generated;
}

//Default decay function
var decayDefault = function decay(player, population, deathRate, selectiveMultiplier) {
	var score = player.score;
	var mean = population.scoresMean();
	var std = population.scoresStd();
	
	console.log(score, mean, std);
	
	var Z =  !(isNaN(std)||std==0) ? (score-mean)/std : 0;
	
	console.log(Z)
	var rate = deathRate - selectiveMultiplier*Z;
	
	var generated = poisson(rate);
	log("silly","decayDefault: generated random number " + generated.toString()+ " using rate "+ rate.toString());
	return generated;
}



//Backend function class for PopulationDynamics
function _PopulationDynamics(id, birthRate,deathRate, {growthFunction=growthDefault, decayFunction=decayDefault, selectiveMultiplier= .5, playerParameters={}}={}){
	_Playable.call(this,id);
	
	var pd = this;
	
	this.birthRate = birthRate;
	this.deathRate = deathRate;
	this.selectiveMultiplier = selectiveMultiplier;
	
	//Wrap the growth and decay functions, so that the user doesn't have to worry about calling this.birthRate or this.deathRate
	this.growth = function(player){
		log("silly","_pd.growth: Checking grow condition");
		return growthFunction(player, population, pd.birthRate, pd.selectiveMultiplier)
	};
	this.decay = function(player){
		log("silly","_pd.decay: Checking decay condition");
		return decayFunction(player, population, pd.deathRate, pd.selectiveMultiplier);
	};
	
	this.playerParameters = playerParameters;
	
	registry.controllers[id] = this;
}
_PopulationDynamics.prototype = Object.create(_Playable.prototype);
_PopulationDynamics.prototype.constructor = _PopulationDynamics;

_PopulationDynamics.registryName = "controllers";
_PopulationDynamics.counterName = "populationDynamics";


_PopulationDynamics.prototype.play = function({initializePlayers=false, shortCircuit=false, history=gameHistory}={}){
	
	var pd = this;
	
	var births = 0;
	var deaths = 0;
	
	//Update population using whoever's alive currently
	population = gamePopulation().onlyAlive();
		
	
	//Kill cycle
	var killed = new PlayerList([]);
	population.forEach(function(player){
		// If the decay function is returns truthy, kill.
		
		if (pd.decay(player)) {
			log("silly","must kill...")
			player.kill();
			deaths++;
			killed.push(player);
			log("silly","dead");
		}
		
		
	});
	
	//Update update again to prevent the recently deceased from reproducing
	population = gamePopulation().onlyAlive();
	
	if (population.length == 0) {
		//Everybody's dead. Let's wrap it up.
		var reason = {result:"Population Collapse", playable:pd};
		history.end();
		return Promise.resolve(reason);
	}
	
	//Birth cycle
	var born = new UserPlayerList([]);
	population.forEach(function(player){
		//Birth whatever number is returned
		var numBirth = pd.growth(player)
		console.log(numBirth);
		for (var i=1; i<=numBirth; i++){
			log("silly", "Player " + player.id +" giving birth!");
			
			var playerParameters = Object.assign({},{
					assign:player.strategy ? player.strategy._id : "",
					parent:player.id}
				,pd.playerParameters);
			
			born.push(Player(playerParameters));
		}	
	});
	
	
	var result = {births, deaths};
	
	var resultObject = {
		result,
		'playable':pd,
		historyEntry:{
			populationDynamics:pd.id,
			result
		}
	};
	
	return Promise.resolve(resultObject);
};



function PopulationDynamics(birthRate=.05, deathRate = .05, parameters={}){
	var id = idHandler(parameters.id,"populationDynamics")
	
	if (parameters.growth && !isFunction(growth)) log("error",id + ": growth should be a function.");
	if (parameters.decay && !isFunction(decay))   log("error",id + ": decay should be a function.");
		
	//Create backend lambda object
	var _pd = new _PopulationDynamics(id, birthRate, deathRate, parameters);
	
	
	//Return this reference object to the user. Run the function to select a source
	var pd = Playable(_pd);	
	return pd;	
}


module.exports = {_PopulationDynamics, PopulationDynamics};
},{"../helperFunctions":8,"../logger":27,"../player":43,"../population":49,"../state":50,"./playable":35,"randgen":68}],37:[function(require,module,exports){
"use strict";

var log = require('../logger');
log("debug", "Loading Class: RandomPlayerChoice")

//Game state controllers
var {registry, gameHistory, occupiedPlayers} = require('../state');

//Helper functions
var {idHandler} = require('../helperFunctions')("state");
var {chainerGenerator} = require('../helperFunctions')("playable");

//Parent class
var {_Playable, Playable} = require('./playable');
var {_Choice, Choice} = require('./choice');

//Population helpers
var {PlayerList} = require('../population');


//Backend function class for RPChoice
function _RPChoice(id, options, {includePlayers, excludePlayers=new PlayerList()}){
	
	//If they specify players to draw from, use only that list. Otherwise, use whoever's around.
	this.includePlayers = includePlayers || "all";
	
	this.excludePlayers = new PlayerList(excludePlayers);
	
	this.generator = Math.random;
	
	var player = null;
	
	
	_Choice.call(this,id, player, options, {});
}

_RPChoice.prototype = Object.create(_Choice.prototype);
_RPChoice.prototype.constructor = _RPChoice;

_RPChoice.registryName = "choices";
_RPChoice.counterName = "randomPlayerChoice";



//Select the player to make the choice
_RPChoice.prototype.choosePlayer = function choosePlayer(){
	
	var rpChoice = this;
	
	return Promise.resolve().then(function(){
		
		//Find players to choose from
		var pool = new PlayerList(rpChoice.includePlayers).onlyAlive().onlyAvailable().exclude(rpChoice.excludePlayers)
		if (pool.length == 0) return Promise.reject("No available players.");
	
		log("silly", "rpChoice.choosePlayer: choosing froom pool: " + pool.ids());
	
		var randomNumber = Math.floor(rpChoice.generator()*pool.length);
		var candidate = pool[randomNumber];
	
	
		log("silly", "rpChoice.choosePlayer: selecting player ", candidate.id)
	
		rpChoice.player = candidate;
		candidate.available = false;
	
		return Promise.resolve(candidate.id);
	});
};

_RPChoice.prototype.prePlay = function(){
	return this.choosePlayer();
};


_RPChoice.prototype.summaryThis = function(summary){
	summary.options = this.options;
};



function RandomPlayerChoice(options, {id=null, excludePlayers=[], playerList=null}={}){
	var id = idHandler(id,"randomPlayerChoice")
	
	//Create backend choice object
	var _rpChoice = new _RPChoice(id, options, {playerList, excludePlayers});
	
	//Return this reference object to the user. Run the function to select a source
	var rpChoice = Playable(_rpChoice)
	
	rpChoice.playerList = function(playerList){
		if (Array.isArray(playerList)) _rpChoice.playerList = playerList;
		return 	_rpChoice.playerList 
	};
	
	rpChoice.excludePlayers = function(excludePlayers){
		if (Array.isArray(excludePlayers)) {
			_rpChoice.excludePlayers = [];
			
			excludePlayers.forEach(function(player){
				_rpChoice.excludePlayers.push(player.id());
			});
			
		}
		return 	_rpChoice.excludePlayers 
	};
	
	//Interface to specify single-player payoffs in single-player/single-choice games
	_rpChoice.zeroPayoffs();       
	
	_rpChoice.generateChainingFunctions(rpChoice);
	
	//Function to set all payoffs at once
	rpChoice.setAllPayoffs = function(payoffs){
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};
	
	
	//Way for user to interact with payoffs
	rpChoice.payoffs = function(){return registry.choices[id].payoffs;};
	
	return rpChoice;	
}



module.exports = {_RPChoice, RandomPlayerChoice};
},{"../helperFunctions":8,"../logger":27,"../population":49,"../state":50,"./choice":29,"./playable":35}],38:[function(require,module,exports){
"use strict";

var log = require("../logger");
log("debug", "Loading Class: Sequence");

//Game state controllers
var { registry } = require("../state");
var { gameHistory } = require("../history");

//Helper functions
var { idHandler } = require("../helperFunctions")("state");

//Information
var { Information, PerfectInformation } = require("../information");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Sequence
function _Sequence(id, playableStart, playableFinish, parameters = {}) {
	_Playable.call(this, id, parameters);

	this.playableStart = registry.playables[playableStart.id()];
	this.playableFinish = registry.playables[playableFinish.id()];

	registry.sequences[id] = this;
}
_Sequence.prototype = Object.create(_Playable.prototype);
_Sequence.prototype.constructor = _Sequence;

_Sequence.registryName = "sequences";
_Sequence.counterName = "sequence";

_Sequence.prototype.play = function({
	history = gameHistory,
	information = this.information ||
	PerfectInformation
} = {}) {

	var sequence = this;

	//Log the history appropriately
	var startEntry = {
		sequence: sequence.id,
		action: "start"
	};
	history.log.add(startEntry);

	//History object to give to sequenced playables.
	var sequenceHistory = history.child();

	//compartmentalize if set. "compartmentalize" means pass on information as if this playable is the entire game.
	if (sequence.compartmentalize) {
		information = new Information(sequence.compartmentalize.history || sequenceHistory,
			sequence.compartmentalize.population || information.population);
	}

	// Recursion down the chain of playables
	var action = function action(result) {
		//Stop if the game is over.
		if (history.stop) return { playable: sequence };

		//Otherwise, recurse to figure out what to do next.
		if (Array.isArray(result)) {
			log("silly", "sequence.play: Next-item is an array, splitting into pieces.");

			return Promise.all(
				result.map(function(item) {
					log("silly", "sequence.play: recursing on", item);
					return action(item);
				})
			);
		}

		if (result.playable !== sequence.playableFinish) {
			log("silly", result);

			if (result.playable.findNext({ result }).length > 0) {
				log("silly", "Playable has next-item, continuing down chain.");

				return result.playable.playNext(result, { shortCircuit: true, history: sequenceHistory, information })
					.then(action); //Repeat for next playable in chain
			}
			return Promise.resolve(result);
		}
		return Promise.resolve(result);
	};

	return sequence.playableStart
		.play({ shortCircuit: true, history: sequenceHistory, information })
		.then(action)
		.then(function(result) {
			result.historyEntry = {
				sequence: sequence.id,
				action: sequenceHistory.orphan()
			};

			//TODO: add information mechanisms

			return Promise.resolve(result);
		});
};

//Overwrite history handler so that tree doesn't have "start" and "finish" entries.
_Sequence.prototype.handleHistory = function({ history = gameHistory } = {},
	result
) {
	var sequence = this;

	return Promise.resolve(result).then(function(result) {
		history.log.add({
			sequence: sequence.id,
			action: "finish",
			duration: result.historyEntry.duration
		});

		history.addNoLog(result.historyEntry);
		return Promise.resolve(result);
	});
};

//TODO: finish this!
_Sequence.prototype.summaryThis = function(summary, entries, shortCircuit) {
	summary.action = {};

	this.playableStart.summarize(
		summary.action,
		entries,
		(shortCircuit = this.playableFinish)
	);
};

function Sequence(playableStart, playableFinish, parameters = {}) {
	var id = idHandler(parameters.id, "sequence");

	//Create backend loop object
	var _sequence = new _Sequence(id, playableStart, playableFinish, parameters);

	//Return this reference object to the user. Run the function to select a source
	var sequence = Playable(_sequence);
	return sequence;
}

module.exports = { _Sequence, Sequence };

},{"../helperFunctions":8,"../history":25,"../information":26,"../logger":27,"../state":50,"./playable":35}],39:[function(require,module,exports){
"use strict";

var log = require('../logger');

//Helper functions
var { isObject } = require('../helperFunctions')("general");
var { idHandler } = require('../helperFunctions')("state");

//Parent class
var { _Playable, Playable } = require('./playable');

// Information mechanics
var { Information, PerfectInformation } = require('../information');


//Backend class
function _Simultaneous(id, playableArray, { playableParameters = {} } = {}) {
	_Playable.call(this, id);

	this.playableArray = playableArray;
	this.playableParameters = playableParameters;

	registry.controllers[id] = this;
}

_Simultaneous.prototype = Object.create(_Playable.prototype);
_Simultaneous.prototype.constructor = _Simultaneous;

_Simultaneous.registryName = "controllers";
_Simultaneous.counterName = "simultaneous";


//Simultaneous Promise.all's the playables, which causes them to run meshed.
_Simultaneous.prototype.play = function({ history = gameHistory, information = PerfectInformation } = {}) {

	var simultaneous = this;

	// Deal with history. Log start, then split history for children playables to fill in.
	history.log.add({
		simultaneous: simultaneous.id,
		action: "Simultaneous start."
	});
	var simultaneousHistory = []



	//TODO: is information mechanics correct?

	return Promise.all(simultaneous.playableArray.map(function(playable) {

		var branchHistory = history.child();
		simultaneousHistory.push(branchHistory)

		// Information mechanics
		var infoPopulation, parentHistory, infoHistory = branchHistory;
		//compartmentalize if set. "compartmentalize" means pass on information as if this playable is the entire game.
		if (simultaneous.compartmentalize) {
			infoPopulation = simultaneous.compartmentalize.population || information.population;
			parentHistory = simultaneous.compartmentalize.history || information.history;
		} else {
			infoPopulation = information.population;
			parentHistory = information.history
		}
		var simultaneousInformation = new Information(infoHistory, infoPopulation, { parentHistory });



		return playable.play({ history: branchHistory, information: simultaneousInformation });
	})).then(function(resultArray) {

		var resultObject = {
			resultArray,
			playable: simultaneous,
			historyEntry: {
				simultaneous: simultaneous.id,
				action: simultaneousHistory.map(function(history) {
					return history.orphan();
				})
			}
		};
		return resultObject;
	});
};


_Simultaneous.prototype.handleHistory = function({ history = gameHistory } = {}, result) {

	history.log.add({
		simultaneous: this.id,
		action: "Simultaneous complete."
	});

	history.addNoLog(result.historyEntry);

	return Promise.resolve(result);
};

_Simultaneous.prototype.summaryThis = function(summary, entries) {
	summary.action = [];

	this.playableArray.forEach(function(playable, index) {
		summary.action[index] = {}
		playable.summarize(summary.action[index], entries);
	});
}


//Frontend class
function Simultaneous(playableArray, parameters = {}) {
	var id = idHandler(parameters.id, "simultaneous")

	playableArray = playableArray.map(function(playable) {
		return registry.playables[playable.id()];
	});


	//Create backend instance.
	var _simultaneous = new _Simultaneous(id, playableArray, parameters);

	//Return this reference object to the user. Run the function to select a source
	var simultaneous = Playable(_simultaneous);
	return simultaneous;
}


module.exports = { _Simultaneous, Simultaneous };

},{"../helperFunctions":8,"../information":26,"../logger":27,"./playable":35}],40:[function(require,module,exports){
"use strict";

var log = require('../logger');
log("debug", "Loading Class: Stochastic-Halt")

//Game state controllers
var {registry, gameHistory} = require('../state');

//Helper functions
var {isFunction}	= require('../helperFunctions')("general");
var {idHandler} 	= require('../helperFunctions')("state");

//Parent class
var {_Playable, Playable} 	= require('./playable');
var {_Halt, Halt}			= require('./halt-if');


//Backend function class for SHalt
function _SHalt(id, probability, parameters){
	_Halt.call(this,id,null,parameters);
	
	var sHalt = this;
	
	this.probability = probability;
	this.generator = Math.random;				//TODO: allow user to specify random number generator
	
	this.testCondition = function(){
		if (sHalt.generator() < sHalt.probability) return true;
	};
	
	
	registry.sHalts[id] = this;
}
_SHalt.prototype = Object.create(_Halt.prototype);
_SHalt.prototype.constructor = _SHalt;

_SHalt.registryName = "sHalts";
_SHalt.counterName = "stochasticHalt";

/*
_SHalt.prototype.play = function({initializePlayers=false, shortCircuit=false}={}){
	
	var sHalt = this;
	var test = sHalt.testCondition();
	
	if (test) {
		log("info", "Halting at " + sHalt.id)
		
		return Promise.reject({
			result:"Halt",
			playable:sHalt
		});
	}
	
	var resultObject = {
		'result':"Continued",
		'playable':sHalt
	};
	
	return Promise.resolve(resultObject)
	.then(function(result){	
		
		//TODO: add information mechanisms
		
		return Promise.resolve(result)		
	}).then(function(result){
		
		return sHalt.proceed(result, shortCircuit);
	});
};
*/

_SHalt.prototype.summaryThis = function(summary, entries){
	summary.probability = this.probability;
}


function StochasticHalt(probability, {id=null, logContinue=false}={}){
	var id = idHandler(id,"stochasticHalt")
	
	if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');

	//Create backend sHalt objects
	var _sHalt = new _SHalt(id, probability, {logContinue});
	
	
	//Return this reference object to the user. Run the function to select a source
	var sHalt = Playable(_sHalt);	
	return sHalt;	
}


module.exports = {_SHalt, StochasticHalt};
},{"../helperFunctions":8,"../logger":27,"../state":50,"./halt-if":31,"./playable":35}],41:[function(require,module,exports){
"use strict";

var log = require('../logger');
log("debug", "Loading Class: StochasticLoop")

//Game state controllers
var { registry, gameHistory } = require('../state');

//Helper functions
var { idHandler } = require('../helperFunctions')("state");
var { chainerGenerator } = require('../helperFunctions')("playable");

//Parent classes
var { _Playable, Playable } = require('./playable');
var { _Loop, Loop } = require('./loop');


//Backend function class for StochasticLoop
function _SLoop(id, playable, probability, parameters) {
	_Loop.call(this, id, playable, null, parameters);

	this.playable = registry.playables[playable.id()];

	//This inherits from Loop which uses a count. Delete that and replace with probability.
	delete this.count;
	this.probability = probability;

	this.generator = Math.random; //TODO: allow user to specify random number generator

	registry.sLoops[id] = this;
}
_SLoop.prototype = Object.create(_Loop.prototype);
_SLoop.prototype.constructor = _SLoop;

_SLoop.registryName = "sLoops";
_SLoop.counterName = "stochasticLoop";


_SLoop.prototype.play = function({
	initializePlayers = false,
	shortCircuit = false,
	history = gameHistory,
	information: PerfectInformation
} = {}) {

	var sLoop = this;
	sLoop.counter = 0;
	var loopHistory = history.child();

	if (sLoop.compartmentalize) {
		information = new Information(sLoop.compartmentalize.history || loopHistory,
			sLoop.compartmentalize.population || information.population);
	}


	var promise = Promise.resolve({});

	//Section that will be looped
	var action = function(result) {

		sLoop.counter++;
		if (!result) result = {};


		//Deal with history
		history.log.add({
			loop: sLoop.id,
			loopTo: sLoop.playable.id,
			count: sLoop.counter
		});

		return sLoop.playable.play({ shortCircuit: true, history: loopHistory, information })
			.then(function(result) {

				result.playable = sLoop;
				//TODO: add information mechanisms

				return Promise.resolve(result)
			});
	};


	//Generate random numbers, repeat while number is above halting probability
	while (sLoop.generator() > sLoop.probability) {
		promise = promise.then(action);
	}


	return promise.then(function(result) {

		result.historyEntry = {
			loop: sLoop.id,
			count: sLoop.counter,
			action: loopHistory.orphan()
		};

		return Promise.resolve(result);
	});
};

_SLoop.prototype.summaryThis = function(summary, entries) {
	summary.probability = this.probability;

	summary.action = {}
	this.playable.summarize(summary.action, entries, true)
}


//User interface
function StochasticLoop(playable, probability = .5, parameters = {}) {
	var id = idHandler(parameters.id, "stochasticLoop")

	if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');

	//Create backend sLoop object
	var _sLoop = new _SLoop(id, playable, probability, parameters);


	//Return this reference object to the user. Run the function to select a source
	var sLoop = Playable(_sLoop);
	return sLoop;
}



module.exports = { _SLoop, StochasticLoop };

},{"../helperFunctions":8,"../logger":27,"../state":50,"./loop":34,"./playable":35}],42:[function(require,module,exports){
"use strict";

var log = require("../logger");
log("debug", "Loading Class: Turn");

//External dependency
var { SynchronousPromise } = require("synchronous-promise");

//Helper functions
var { isObject, once } = require("../helperFunctions")("general");
var { chainerGenerator, outcomeTreeGetValue, outcomeTreeSetValue } = require("../helperFunctions")("playable");
var { recurse } = require("../helperFunctions")("turn");
var { idHandler } = require("../helperFunctions")("state");

//Game state controllers
var { registry } = require("../state");
var { gameHistory } = require("../history");
var { Information, PerfectInformation } = require("../information");

//Parent class
var { _Playable, Playable } = require("./playable");

//Backend function class for Turn
function _Turn(id, choices, parameters = {}) {
	_Playable.call(this, id);

	this.payoffsImplicit = {};
	this.payoffsExplicit = {};

	this.next = {};

	this.choices = choices.map(function(choice) {
		return registry.choices[choice.id()];
	});

	registry.turns[id] = this;

	var turn = this;

	this.choiceMap = this.choices.map(function(item) {
		return item.options;
	});

	recurse(turn.choiceMap, turn.payoffsImplicit, null, function() {
			return Array(turn.choiceMap.length).fill(0);
		})
		.then(function(result) {
			log("silly", "Added implicit payoffs map to turn.");
			return recurse(turn.choiceMap, turn.payoffsExplicit, {});
		})
		.then(function(result) {
			log("silly", "Added explicit payoffs map to turn.");
			return recurse(turn.choiceMap, turn.next, null, function() {
				return [];
			});
		})
		.then(function(result) {
			log("silly", "Added blank next map to turn.");
			return Promise.resolve(result);
		})
		.catch(function(reason) {
			log("error", reason);
		}); //TODO: error handling here
}
_Turn.prototype = Object.create(_Playable.prototype);
_Turn.prototype.constructor = _Turn;

_Turn.registryName = "turns";
_Turn.counterName = "turn";


_Turn.prototype.play = function({
	usePayoffs = true,
	history = gameHistory,
	information = PerfectInformation,
	releasePlayers = true
} = {}) {

	var turn = this;
	var choiceHistory = history.child();
	var choiceInformation = information.child();

	if (turn.compartmentalize) {
		choiceInformation = new Information(turn.compartmentalize.history || choiceHistory,
			turn.compartmentalize.population || information.population);
	}

	history.log.add({
		turn: turn.id,
		choices: turn.choices.map(function(choice) {
			return choice.id;
		})
	});

	var compileInformation = function(ri) {
		//If there's no turn entry, create one.
		if (!choiceInformation.additional[0].turn) {
			var turnInfo = {
				turn: {
					id: turn.id,
					choices: [],
					exclude(player) {
						return this.choices.filter(function(choice) {
							return choice.player == player;
						});
					}
				}
			};
			choiceInformation.additional.unshift(turnInfo);
		}
		choiceInformation.additional[0].turn.choices.push(
			choiceInformation.additional.pop()
		);

		information.additional.forEach( // TODO: what does this do???
			choiceInformation.addAdditional.bind(choiceInformation)
		);
	};

	return Promise.all(
			turn.choices.map(function(choice) {
				return choice.play({
					shortCircuit: true,
					history: choiceHistory,
					information: choiceInformation,
					_compileInformation: compileInformation,
					releasePlayers: false
				});
			})
		)
		.then(function(result) {
			//Re-format output from array of Choice results to single Turn result
			//And release players
			var resultPath = result.map(function(choice, index) {
				if (releasePlayers) turn.choices[index].releasePlayer();
				return choice.result;
			});

			//Pass along results and record history
			var resultObject = {
				result: resultPath,
				playable: turn,
				historyEntry: {
					turn: turn.id,
					results: choiceHistory.orphan(),
					payouts: {}
				}
			};

			return Promise.resolve(resultObject);
		})
		.then(function(result) {
			//Implement payoffs
			if (usePayoffs) {
				var implicitPayoffs = outcomeTreeGetValue(
					turn.payoffsImplicit,
					result.result
				);
				var explicitPayoffs = outcomeTreeGetValue(
					turn.payoffsExplicit,
					result.result
				);

				// For the log
				var payouts = {};

				implicitPayoffs.forEach(function(payoff, index) {
					// Do nothing if payoff is zero.
					if (payoff == 0) return;

					// fetch player and increment score
					var player = turn.choices[index].player;
					player.score += payoff;

					//And include it in the log entry
					payouts[player.id] = Number(payoff);
				});

				for (var player in explicitPayoffs) {
					registry.players[player].score += explicitPayoffs[player];

					//And include it in the log entry
					payouts[player] = Number(explicitPayoffs[player]);
				}

				//Log for the scores log
				var scoreEntry = {
					turn: turn.id,
					result: result.result,
					payouts: payouts
				};
				history.addScores(scoreEntry);


				// Log for the game history
				result.historyEntry.payouts = payouts;
			}

			return Promise.resolve(result); //TODO: add information mechanisms
		});
};

//Overwrite default history handler, because we don't want a second entry in the tree
_Turn.prototype.handleHistory = function({ history = gameHistory } = {},
	result
) {
	history.addNoLog(result.historyEntry);

	return Promise.resolve(result);
};

_Turn.prototype.findNext = function({ result } = {}) {
	return outcomeTreeGetValue(this.next, result.result);
};

_Turn.prototype.generateChainingFunctions = function() {
	var _turn = this;
	var turn = _turn.interface;

	//Create payoff setter/branch router functions.
	//recurse adds a wrapper around this function which supplies the path.
	recurse(_turn.choiceMap, turn, function(path, payoffs) {
		//If user supplied payoffs in array form, then translate to object based on which players are involved in the choices
		if (Array.isArray(payoffs)) {
			if (payoffs.length !== _turn.choices.length) {
				//If array isn't right length, then this is unintelligible.
				log(
					"error",
					"Payoff array does not match Turn dimensions, cannot assign payoffs."
				);
				return Promise.reject(new Error("Payoff array is not correct length"));
			}

			var originalPayoffs = payoffs.slice();
			payoffs = {};

			outcomeTreeSetValue(_turn.payoffsImplicit, path, originalPayoffs);
		} else if (isObject(payoffs)) {
			payoffs = JSON.parse(JSON.stringify(payoffs));
			outcomeTreeSetValue(_turn.payoffsExplicit, path, payoffs);
		}

		return SynchronousPromise.resolve({
			playable: turn,
			path: path
		});
	});
};

_Turn.prototype.setAllPayoffs = function(payoffArray) {
	var turn = this;

	//Recurse through the options in input, to come up with a path to every combination of options in the array of arrays.
	function recurse(input, numPlayers, payoffs, path = [], coordinates = []) {
		return SynchronousPromise.resolve(path).then(function(path) {
			//Since we slice the array each time, if there are no more entries left then we're done with this branch.
			if (input.length == 0) return SynchronousPromise.resolve(path);

			//Among all values from the array
			return SynchronousPromise.all(
				input[0].map(function(item, index) {
					var splitPath = path.slice(0).concat(item);
					var splitCoordinates = coordinates.slice(0).concat(index);
					var splitPayoffs = payoffs[index];

					//If we're at the last position in the array of options, then we have a complete path.
					if (input.length == 1) {
						/* you might need these later
					console.log("path ", splitPath);
					console.log("coordinates ", splitCoordinates)
					console.log("payoff ",splitPayoffs)
					*/

						splitPayoffs = JSON.parse(JSON.stringify(splitPayoffs));

						//Allow the first few array elements to be implicit payoffs. Check that they are actually there and are numbers
						var implicit = splitPayoffs.slice(0, numPlayers);
						if (
							implicit.length == numPlayers &&
							implicit.every(function(payoff) {
								return !isNaN(payoff);
							})
						) {
							outcomeTreeSetValue(turn.payoffsImplicit, splitPath, implicit);
						}

						//Any remaining should be assigned as explicit payoffs, if they're objects.
						splitPayoffs.slice(numPlayers).forEach(function(explicit) {
							if (isObject(explicit))
								outcomeTreeSetValue(turn.payoffsExplicit, splitPath, explicit);
						});
					}

					//If there are more items to iterate over, include them in the output then recurse.
					return recurse(
						input.slice(1),
						numPlayers,
						splitPayoffs,
						splitPath,
						splitCoordinates
					);
				})
			);
		});
	}

	return recurse(turn.choiceMap, turn.choices.length, payoffArray).catch(
		function(reason) {
			log("error", reason);
		}
	);
};

// Adding more complicated summary entry
_Turn.prototype.summaryThis = function(summary, entries, shortCircuit = false) {
	// Fetch summaries for each choice.
	summary.choices = [];
	this.choices.forEach(function(choice, index) {
		summary.choices[index] = choice.summarize(
			summary.choices[index],
			entries,
			true
		);
	});

	// Include payoffs
	summary.payoffs = JSON.parse(
		JSON.stringify({
			implicit: this.payoffsImplicit,
			explicit: this.payoffsExplicit
		})
	);

	return summary;
};

//
_Turn.prototype.summaryNext = function(summary, entries) {
	var turn = this;

	// Create map
	summary.next = {};
	var count = 0;
	recurse(this.choiceMap, summary.next, null, function(path) {
		return outcomeTreeGetValue(turn.next, path).map(function(playable) {
			++count;
			return playable.summarize();
		});
	});

	// If there is no next, delete the key.
	if (count == 0) delete summary.next;
};

function Turn(choices, parameters = {}) {
	var id = idHandler(parameters.id, "turn");

	//Create backend choice object
	var _turn = new _Turn(id, choices, parameters);

	//Return this reference object to the user. Run the function to select a source
	var turn = Playable(_turn);

	_turn.generateChainingFunctions();

	//Function to set all payoffs at once
	turn.setAllPayoffs = function(payoffs) {
		//TODO: Include error handling if array given isn't expected dimensions.
		_turn.setAllPayoffs(payoffs);
	};

	//Way for user to interact with payoffs
	turn.payoffs = function() {
		return JSON.parse(
			JSON.stringify({
				implicit: _turn.payoffsImplicit,
				explicit: _turn.payoffsExplicit
			})
		);
	};

	// Returns the payoffs in nested array form, to make cloning easier, ie. t2.setAllPayoffs(t1.payoffsMatrix())
	turn.payoffsMatrix = function() {

		// recursion to construct payoff matrix
		var mapper = function(obj, path = []) {
			//If it's an array, then we've reached the payoffs
			if (Array.isArray(obj)) {
				var payoff = obj.slice(0)
				// Add explicit payoffs too
				var explicit = outcomeTreeGetValue(_turn.payoffsExplicit, path);

				// Only add an entry if the explicit payoffs object is not empty
				return Object.keys(explicit).length > 0 ? payoff.concat([outcomeTreeGetValue(_turn.payoffsExplicit,
					path)]) : payoff
			}

			// Otherwise, dig in deeper
			else return Object.keys(obj).map(function(key) { return mapper(obj[key], path.slice(0).concat([key])) })
		}
		return mapper(_turn.payoffsImplicit)
	}

	return turn;
}

module.exports = { _Turn, Turn };

},{"../helperFunctions":8,"../history":25,"../information":26,"../logger":27,"../state":50,"./playable":35,"synchronous-promise":71}],43:[function(require,module,exports){
"use strict";

var log = require('./logger');

//Game state controllers
var { registry } = require('./state');

//Helper functions
var { idHandler } = require('./helperFunctions')("state");
var { chainerGenerator } = require('./helperFunctions')("playable");

var { UserHistory } = require('./history');

// Plugins
var PluginManager = require("./plugin-manager")

//Backend for Player
function _Player(id, { name = "", assign = null } = {}) {
	log('silly', 'Creating interal player object.');

	this.id = id
	this.score = 0
	this.name = name;

	this.history = [];

	if (assign) this.assign(assign);

	this.alive = true;
	this.available = true;

	registry.players[id] = this;
}


//Make a copy of the player, in order to take a snapshot. ////TODO try this again sometime.
/*
_Player.prototype.clone = function(){
	//Make new copy. Don't keep more than one.
	delete this.copy

	var clone = new _Player(this.id);

	//Loop through properties and assign them.
	for (var key in this){
		clone[key] = this[key];
	}
	//Do not add to registry. This will keep duplicates out of population.

	//Do add reference so we can find it again.
	this.copy = clone;

	return clone;
};
*/


//Assign strategy to player
_Player.prototype.assign = function(strategy, ...args) {

	//TODO: verify strategy type
	if (registry.strategies[strategy]) {
		this.strategy = new registry.strategies[strategy](...args);
		this.strategy._id = strategy
	} else throw new Error("Strategy '" + strategy + "' is not defined");
};


//Call strategy to make a choice
_Player.prototype.choose = function(options, information = {}) { //TODO: check that there's a strategy assigned before trying to play
	var player = this;
	if (player.strategy) {
		let result = player.strategy.choose(options, information)
		if (result) return Promise.resolve(result.toString());
		// If no response, give warning
		else log("warning", "No response from player " + player.id + ". Using default option.")
	}
	// If no strategy, give warning
	else
		log("warning", "No strategy assigned to player " + player.id + ". Using default option.");
	return Promise.resolve(null);
};


//Takes a JSON.parse(JSON.stringify()) copy of _player. Returns a cleaned up version
_Player.prototype.infoClean = function(infoObject) {
	delete infoObject.interface;
	infoObject.strategy = infoObject.strategy ? infoObject.strategy._id : null;

	return infoObject;
};


//Kill player. TODO: add player to some sort of "dead" list to avoid being picked to do things.
_Player.prototype.kill = function() {
	this.alive = false;
};



//Class that is the reference for the user to hold onto
function player() {}


//Frontend for Player
function Player(parameters = {}) {
	var id = idHandler(parameters.id, "player");

	//Create backend player object
	var _player = new _Player(id, parameters);


	//Return this reference object to the user
	var playerInterface = new player(); //Probably add functionality here

	//Tag-back. Store the front-end object in the back-end object, for retrieval
	_player.interface = playerInterface;

	playerInterface.alive = function() {
		return registry.players[id].alive;
	}

	playerInterface.assign = function(strategy, ...args) {
		registry.players[id].assign(strategy, ...args);
	};

	playerInterface.available = function() {
		return registry.players[id].available
	};

	playerInterface.busy = function() {
		registry.players[id].available = false;
	};

	playerInterface.history = function() {
		return new UserHistory(registry.players[id].history);
	};

	playerInterface.id = function() { return id; };

	playerInterface.kill = function() {
		registry.players[id].kill();
	}

	playerInterface.release = function() {
		registry.players[id].available = true;
	};

	playerInterface.resetScore = function() {
		registry.players[id].score = 0;
	}

	playerInterface.score = function() {
		return registry.players[id].score;
	};

	playerInterface.strategy = function() {
		return registry.players[id].strategy._id;
	};

	// PLUGIN: run after player creation
	PluginManager.run("player-create", _player)

	return playerInterface
}




module.exports = { _Player, Player };

},{"./helperFunctions":8,"./history":25,"./logger":27,"./plugin-manager":45,"./state":50}],44:[function(require,module,exports){
/**
 *
 * @type {{}}
 */

function AsyncCtx(callback) {
	this.callback = callback;
	this.sync = true;
}

AsyncCtx.prototype.async = function() {
	this.sync = false;
	return this.callback;
};

/**
 * This is an API meant to be used only from synchronous
 * callbacks into an asynchronous like hook.
 *
 * it represent continuity from the "sync()" or "waterfall()"
 * plugin management
 */
AsyncCtx.prototype.stop = function() {
	var callback = this.async();
	callback(true);
};

module.exports = AsyncCtx;
},{}],45:[function(require,module,exports){
// Stolen liberally and brazenly from "polite-plugin-manager".
"use strict";

const pluginDirectoryPath = "../../plugins/"
// Hack to compile Glob files for browserify. Don´t call this function!
function $_DONOTCALL() {
	require('../../plugins/balance-sheet-complex.js');require('../../plugins/balance-sheet.js')
}

/**
 * Polite Plugin Manager
 * register and run hooks granting extendability
 *
 */


// Global Dependencies
var fs = require('fs'),
	path = require('path'),
	extend = require('extend'),
	async = require('async'),

	// Local Modules
	AsyncCtx = require('./async-ctx'),
	WaterfallCtx = require('./waterfall-ctx'),
	PluginNameError = require('./plugin-name-error'),
	PluginCallbackError = require('./plugin-callback-error');


// ------------------------------------------------------------------------------------ //
// ---[[   C O N S T R U C T O R   A N D   L I F E C Y C L E   U T I L I T I E S   ]]-- //
// ------------------------------------------------------------------------------------ //

var PluginManager = {},
	packages = [],
	packageNames = [],
	hooks = {},
	skipProps = ['module', 'name', 'priority', 'active', 'init', 'require', 'stop', 'public', 'settings'];



PluginManager.reset = function() {
	packages = [];
	packageNames = [];
	hooks = {};
	return this;
};

/**
 * Apply package sorting,
 * register packages into hooks,
 * run packages init() method
 */
PluginManager.start = function(callback) {

	var self = this,
		inits = [];

	// sort by priorities
	packages.sort(function(a, b) {
		return a.priority > b.priority;
	});

	// register init & hooks
	// hooks are all functions who are not special properties
	// identified by "skipProps" list
	packages.forEach(function(pkg) {
		if (pkg.init) {
			inits.push(pkg.init);
		}
		for (var prop in pkg) {
			if (skipProps.indexOf(prop) === -1 && typeof pkg[prop] == 'function') {
				PluginManager.registerHook(prop, pkg[prop]);
			}
		}
	});

	// run all package.init() method in series!
	if (inits.length) {
		async.eachSeries(inits, function(fn, done) {

			var context = new AsyncCtx(done),
				result = fn.apply(context);

			// sync false stop initialization cycle!
			if (context.sync) {
				if (result === false) {
					callback.call(self);
				} else {
					done(result);
				}
			}

		}, callback.bind(this));
	} else {
		callback.call(self);
	}

	return this;
};




// --------------------------------- //
// ---[[   H O O K S   A P I   ]]--- //
// --------------------------------- //

PluginManager.registerHook = function(hookName, hookFn, hookPriority = 100) {
	hookFn.priority = hookPriority;

	if (!hooks[hookName]) {
		hooks[hookName] = [];
	}

	hooks[hookName].push(hookFn);
	return this;
};


PluginManager.isEmpty = function(hookName) {
	if (hooks[hookName] && hooks[hookName].length) {
		return false;
	} else {
		return true;
	}
};



/**
 * Run registered hook callbacks in series
 * (it supports asynchronous callbacks)
 */
PluginManager.run = function(hookName, ...args) {

	// Use the runWithCallback but with blank callback.
	PluginManager.runWithCallback(hookName, ...args, function() {})
};

// Same as above, but use last argument as callback
PluginManager.runWithCallback = function(hookName, ...args) {

	// collect hookName property
	if (!hookName) throw new PluginNameError('missing plugin name!');

	// obtain async callback
	if (!args.length || typeof args[args.length - 1] !== 'function') {
		throw new PluginCallbackError('[' + hookName + '] missing callback for async plugin!');
	} else {
		var callback = args.pop();
	}


	// check for some callbacks existance
	// [???] may give out an exception when no callbacks were found!
	if (!hooks[hookName] || !hooks[hookName].length) {
		callback(false);
		return false;
	}

	// Sort hooks by priority
	hooks[hookName].sort(function(a, b) {
		return a.priority > b.priority
	})

	// run async queque
	// NOTE: a step function should stop the queque by done(true)
	async.eachSeries(hooks[hookName], function(fn, done) {
		var context = new AsyncCtx(done),
			result = fn.apply(context, args);

		if (context.sync) {
			if (result === false) {
				callback();
			} else {
				done(result);
			}
		}
	}, callback);

	return true;
}

/**
 * Run registered hook callbacks in parallel
 * (it supports asynchronous callbacks)
 * @param hookName
 */

PluginManager.parallel = function() {

	var hookName = '',
		callback = null,
		args = Array.prototype.slice.call(arguments);

	// collect hookName property
	if (!args.length) {
		throw new PluginNameError('missing plugin name!');
	} else {
		hookName = args.shift();
	}

	// obtain async callback
	if (!args.length || typeof args[args.length - 1] !== 'function') {
		throw new PluginCallbackError('[' + hookName + '] missing callback for async plugin!');
	} else {
		callback = args[args.length - 1];
	}

	// check for some callbacks existance
	// [???] may give out an exception when no callbacks were found!
	if (!hooks[hookName] || !hooks[hookName].length) {
		callback(false);
		return false;
	}

	// run async in parallel
	// NOTE: a step function should stop the queque by done(true)
	async.each(hooks[hookName], function(fn, done) {
		var context = new AsyncCtx(done),
			result = fn.apply(context, args);

		// handle sync callbacks
		if (context.sync) {
			done(result);
		}
	}, callback);

	return true;
};


/**
 * WATERFALL
 * Run a hook as a normal function in a fully syncronous mode
 * Each hookFn should return a value who's forward as first argument for the next one
 * last hookFn return value is the final output
 */
PluginManager.waterfall = function(hookName) {

	if (!hookName) {
		throw new PluginNameError('missing plugin name!');
	}

	var args = Array.prototype.slice.call(arguments);
	args.shift();

	if (hooks[hookName]) {
		// use known exception to exit forEach cycle implementing a stoppable watefall
		// (http://stackoverflow.com/questions/2641347/how-to-short-circuit-array-foreach-like-calling-break?answertab=votes#tab-top)
		var WaterfallBreakException = {};
		try {
			hooks[hookName].forEach(function(fn) {
				var context = new WaterfallCtx(),
					result = fn.apply(context, args);

				if (args.length) {
					args[0] = result;
				}

				if (context.stopped) {
					throw WaterfallBreakException;
				}

			});
		} catch (e) {
			if (e !== WaterfallBreakException) throw e;
		}
	}

	if (args.length) {
		return args[0];
	} else {
		return;
	}
};




// --------------------------------------- //
// ---[[   P A C K A G E S   A P I   ]]--- //
// --------------------------------------- //

function getPackageByName(name) {
	var list = packages.filter(function(pkg) { return (pkg.name === name) })
	if (list.length == 1) return list[0]
	else return list;
}

// Package class
function Package(module, name = null, context = null) {
	// Basic assignment and default values
	Object.assign(this, {
		module,
		name,
		priority: 100,
		active: false,
		init: function() {},
		require: function() {},
		stop: function() {},
		settings: function() {},
		public: {}
	})
	// Package-defined values and hooks
	Object.assign(this, module(context || {}))

	// add to registry
	// Check to see if it's the same module being loaded twice, or different modules with the same name
	if (packageNames.includes(this.name)) {
		if (this.module === getPackageByName(this.name).module) {
			// Same module. Do nothing
		} else {
			// Different modules with same name, handle name conflict.
			//TODO: figure out how to handle name conflict.
		}
	}
	// No name conflict, add to registry
	else {
		packages.push(this);
		packageNames.push(this.name)
	}
}

Package.prototype.registerHooks = function() {
	var pkg = this;
	for (var prop in pkg) {
		if (skipProps.indexOf(prop) === -1 && typeof pkg[prop] == 'function') {
			PluginManager.registerHook(prop, pkg[prop]);
		}
	}
}

// Create interface for user to interact with package.
function PackageInterface(pkg) {

	// Merge any public items specified by the package with this interface format
	return Object.assign({}, pkg.public, {
		name: function() { return pkg.name },
		priority: function() { return pkg.priority },
		active: function() { return pkg.active },

		init: function(...args) {
			pkg.init(...args);
			pkg.registerHooks();
			pkg.active = true;
			return Object.assign(this, pkg.publicIfActive);
		},
		require: function(...args) {
			if (pkg.active) pkg.require(...args);
			else {
				pkg.init(...args);
				pkg.registerHooks();
				Object.assign(this, pkg.publicIfActive);
			}
			pkg.active = true;

			return this;
		},
		stop: function(...args) {
			if (pkg.active) pkg.stop(...args);
			pkg.active = false;
		},
		settings: function(...args) {
			return pkg.settings(...args);
		}

	}, pkg.active ? pkg.publicIfActive : null);
}




/**
 * Load a plugin package by folder path
 * @param sourceFolder
 */
PluginManager.package = function(source, context) {
	if (packageNames.includes(source)) {
		// Already loaded module, just return it
		return PackageInterface(getPackageByName(source))
	} else {
		var name = path.basename(source),
			module = require(pluginDirectoryPath + source + '.js')

		// obtain package informations and apply some default values
		var pkg = new Package(module, name, context)
		return PackageInterface(pkg)
	}
}

/*
			load: function(callback = function() {}, ...initArgs) {
				var self = pm,
					inits = [],


					// register init & hooks
					// hooks are all functions who are not special properties
					// identified by "skipProps" list

					if (pkg.init) {
						inits.push(pkg.init);
					}


				// run all package.init() method in series! //EDIT: will only be the one
				if (inits.length) {
					async.eachSeries(inits, function(fn, done) {

						var context = new AsyncCtx(done),
							result = fn.apply(context, initArgs);

						// sync false stop initialization cycle!
						if (context.sync) {
							if (result === false) {
								callback.call(self);
							} else {
								done(result);
							}
						}

					}, callback.bind(self));
				} else {
					callback.call(self);
				}

				return self;
			}

		};
	};
*/

/** TODO: this doesn't work right now
 * Load all packages from a given folder path
 * (syncronous)
 */
PluginManager.registerMany = function(sourceFolder, context) {
	var self = this;

	if (fs.existsSync(sourceFolder)) {
		fs.readdirSync(sourceFolder).forEach(function(item) {
			var itemPath = sourceFolder + '/' + item,
				itemStat = fs.lstatSync(itemPath);

			if (itemStat.isDirectory()) {
				self.loadPackage(itemPath, context);
			}
		});
	}

	return this;
};

module.exports = PluginManager

},{"../../plugins/balance-sheet-complex.js":72,"../../plugins/balance-sheet.js":73,"./async-ctx":44,"./plugin-callback-error":46,"./plugin-name-error":47,"./waterfall-ctx":48,"async":55,"extend":62,"fs":1,"path":2}],46:[function(require,module,exports){

function PluginCallbackError(message) {
	this.name = "PluginCallbackError";
	this.message = (message || "");
}


PluginCallbackError.prototype = new Error();
PluginCallbackError.prototype.constructor = PluginCallbackError;

module.exports = PluginCallbackError;
},{}],47:[function(require,module,exports){

function PluginNameError(message) {
	this.name = "PluginNameError";
	this.message = (message || "");
}


PluginNameError.prototype = new Error();
PluginNameError.prototype.constructor = PluginNameError;

module.exports = PluginNameError;
},{}],48:[function(require,module,exports){
/**
 *
 * @type {{}}
 */

function WaterfallCtx() {
	this.stopped = false;
}

WaterfallCtx.prototype.stop = function() {
	this.stopped = true;
};

module.exports = WaterfallCtx;
},{}],49:[function(require,module,exports){
"use strict";

var log = require("./logger");

//Helper functions
var { isFunction, isObject } = require("./helperFunctions")("general");

//Game state controllers
var { registry } = require("./state");

var { _Player } = require("./player");

//Class PlayerList is a list of players which includes some extra functionality. UserPlayerList takes a playerList and
//sanitizes it for the user (ie returns .interface for each player).

function PlayerList(...args) {
	if (Array.isArray(args[0])) args = args[0].slice(0);
	if (args == "all") return gamePopulation();

	// We'll need to retain the original arguments in order to create the generator
	var originalArgs = []

	// Loop over the arguments, save the originals, parse them to _players
	for (var i = 0, len = args.length; i < len; i++) {
		originalArgs.push(args[i]);
		if (isFunction(args[i].id)) args[i] = registry.players[args[i].id()];
		else if (typeof args[i] === 'string') args[i] = registry.players[args[i]]
	}

	Object.setPrototypeOf(args, PlayerList.prototype);

	// returns the same playerlist, but updated, using the original args.
	args.generator = function() {
		return new PlayerList(originalArgs);
	};

	return args;
}

PlayerList.prototype = Object.create(Array.prototype);
PlayerList.prototype.constructor = PlayerList;

// Assign a strategy en masse
PlayerList.prototype.assign = function(strategyName) {
	this.forEach(function(player) {
		player.assign(strategyName)
	})
	return this;
}

//Return a playerList with only the players who are available
PlayerList.prototype.onlyAlive = function() {
	return new PlayerList(
		this.filter(function(player) {
			return player.alive;
		})
	);
};

//Return a playerList with only the players who are available
PlayerList.prototype.onlyAvailable = function() {
	return new PlayerList(
		this.filter(function(player) {
			return player.available;
		})
	);
};

//Kill all players in the playerList
PlayerList.prototype.kill = function() {
	this.forEach(function(player) {
		player.kill();
	});
	return this;
};

PlayerList.prototype.release = function() {
	this.forEach(function(player) {
		player.available = true;
	});
	return this;
};

//Return array of ids of each player in the list
PlayerList.prototype.ids = function() {
	return this.map(function(player) {
		return player.id;
	});
};

//Return a PlayerList minus the specified players.
//Argument can be _player, interface, or a player's id.
PlayerList.prototype.exclude = function(playerArg) {
	if (Array.isArray(playerArg))
		return playerArg.reduce(function(running, item) {
			return running.exclude(item);
		}, this);

	return new PlayerList(
		this.filter(function(player) {
			if (
				playerArg === player ||
				playerArg == player.interface ||
				playerArg == player.id ||
				(isObject(playerArg) && playerArg.id == player.id)
			)
				return false;
			else return true;
		})
	);
};

//Create an InfoPlayerList out of this PlayerList. Useful for getting summary view.
PlayerList.prototype.info = function() {
	return new InfoPlayerList(this);
};

// Placeholder for generator method.
PlayerList.prototype.generator = function() {
	// This will get shadowed when the constructor is called, but it needs to be here so that the
	// UserPlayerList and InfoPlayerList constructors can see it.
}

//Return an array of the strategy of each player in the list
PlayerList.prototype.strategies = function() {
	return this.map(function(player) {
		return player.strategy ? player.strategy._id : "";
	});
};

//Return a PlayerList with only players using a given strategy
PlayerList.prototype.usingStrategy = function(strategy) {
	return new PlayerList(
		this.filter(function(player) {
			if (
				player.strategy == strategy ||
				player.strategy._id == strategy ||
				(isFunction(strategy) && player.strategy instanceof strategy)
			)
				return true;
			else return false;
		})
	);
};

/*

TODO figure out how to make this work

//Returns an object where the keys are strategy names and the values are arrays of players.
//This needs to be overridden on the UserPlayerList prototype, because the normal wrapper logic
//for UserPlayerList cannot sanitize this.
PlayerList.prototype.byStrategy = function(){
	var list = this;
	var data = {};

	Object.keys(registry.strategies).forEach(function(strategy){
		data[strategy] = list.usingStrategy(strategy);
	});

	return data;
};
*/

//Returns an object where the keys are each strategy and the values
//are the number of players in the list who are using it.
PlayerList.prototype.strategyDistribution = function() {
	var counts = {};

	this.forEach(function(player) {
		var s = player.strategy._id;
		counts[s] = (counts[s] || 0) + 1;
	});

	return counts;
};

//Returns an array of scores of each player in the list
PlayerList.prototype.scores = function() {
	var scores = [];

	this.forEach(function(player) {
		scores.push(player.score); //Use the interface function to avoid users re-assigning the reference
	});
	return scores;
};

// Returns an object where each key is a strategy and each value is an array of the scores of players with that strategy.
// TODO: finish .total() method, which will sum the arrays (duplicating .scoresByStrategyTotals)
PlayerList.prototype.scoresByStrategy = function() {
	var scores = {};
	var list = this;

	list.strategies().map(function(strategy) {
		scores[strategy] = list.usingStrategy(strategy).scores();
	});

	scores.total = function() {
		var score = {};
		var scores = this;
		Object.keys(scores).forEach(function(strategy) {
			if (Array.isArray(scores[strategy])) score[strategy] = scores[strategy].reduce(function(a, b) {
				return a + b;
			}, 0);
		});
		return score;
	};

	return scores;
};

// Returns an object where each key is a strategy and each value is the sum of scores of all players with that value
PlayerList.prototype.scoresByStrategyTotals = function() {
	var scores = {};
	var list = this;

	list.strategies().map(function(strategy) {
		scores[strategy] = list
			.usingStrategy(strategy)
			.scores()
			.reduce(function(a, b) {
				return a + b;
			}, 0);
	});

	return scores;
};

//Returns an object where the keys are the player ids and the values
//are the players' score
PlayerList.prototype.scoresObject = function() {
	var scores = {};

	this.forEach(function(player) {
		scores[player.id] = player.score;
	});

	return scores;
};

//Mean of the scores
PlayerList.prototype.scoresMean = function() {
	var scores = this.scores();

	var mean =
		scores.reduce(function(sum, value) {
			return sum + value;
		}, 0) / scores.length;

	return mean;
};

//Array with 2 entries, the lowest and highest score
PlayerList.prototype.scoresRange = function() {
	var scores = this.scores();

	scores.sort(function(a, b) {
		return a - b;
	});

	return [scores[0], scores[scores.length - 1]];
};

//The standard deviation of the scores
PlayerList.prototype.scoresStd = function() {
	var scores = this.scores();
	var mean = this.scoresMean();

	var variance =
		scores.reduce(function(sum, value) {
			return sum + Math.pow(value - mean, 2);
		}, 0) / scores.length;

	var std = Math.sqrt(variance);

	return std;
};

//Returns the single player with the highest score
PlayerList.prototype.leader = function() {
	var players = this.slice();

	players.sort(function(a, b) {
		return b.score - a.score;
	});

	return players[0];
};

PlayerList.prototype.resetScores = function() {
	this.forEach(function(player) {
		player.score = 0;
	});
	return this;
};

//Accept a PlayerList and return one suitable for the user, or create a playerlist and return one suitable for the user
function UserPlayerList(...playerList) {
	if (Array.isArray(playerList[0])) playerList = playerList[0];

	// If we've got a playerList, return the interface of each player
	if (playerList instanceof PlayerList) {
		var userPlayerList = playerList.map(function(player) {
			return player.interface;
		});
	}
	// If not, first create a playerList, then call this function again to wrap it.
	else return new UserPlayerList(new PlayerList(playerList));

	Object.setPrototypeOf(userPlayerList, UserPlayerList.prototype);

	//Attach methods from PlayerList, wrapped in a function. If those methods return a playerList,
	//then the function will convert that to a UserPlayerList.
	for (var method in PlayerList.prototype) {
		if (isFunction(playerList[method])) {
			if (method != "constructor")
				userPlayerList[method] = (function(method) {
					return function() {
						var result = playerList[method].apply(playerList, arguments);
						if (result instanceof PlayerList) return new UserPlayerList(result);
						else if (result instanceof _Player) return result.interface;
						else return result;
					};
				})(method);
		}
	}

	return userPlayerList;
}

UserPlayerList.prototype = Object.create(PlayerList.prototype);
UserPlayerList.prototype.constructor = UserPlayerList;

//Accept a PlayerList and return one suitable for a strategy information set.
function InfoPlayerList(playerList) {
	var infoPlayerList = playerList.map(function(player) {
		return player.infoClean(JSON.parse(JSON.stringify(player)));
	});

	Object.setPrototypeOf(infoPlayerList, InfoPlayerList.prototype);

	//Attach selected methods from PlayerList, wrapped in a function. If those methods return a playerList,
	//then the function will convert that to an InfoPlayerList.
	var methodsToInclude = [
		"onlyAlive",
		"onlyAvailable",
		"ids",
		"exclude",
		"generator",
		"strategies",
		"usingStrategy",
		"strategyDistribution",
		"scores",
		"scoresObject",
		"scoresMean",
		"scoresRange",
		"scoresStd",
		"leader"
	];

	for (var method in PlayerList.prototype) {
		if (isFunction(playerList[method])) {
			if (methodsToInclude.indexOf(method) > -1)
				infoPlayerList[method] = (function(method) {
					return function() {
						var result = playerList[method].apply(playerList, arguments);
						if (result instanceof PlayerList) return new InfoPlayerList(result);
						else if (result instanceof _Player)
							return result.infoClean(JSON.parse(JSON.stringify(result)));
						else return result;
					};
				})(method);
		}
	}

	return infoPlayerList;
}

InfoPlayerList.prototype = Object.create(Array.prototype);
InfoPlayerList.prototype.constructor = InfoPlayerList;

//Extra method to return a single player from an infoPlayerList
InfoPlayerList.prototype.get = function(playerID) {
	return this.find(function(player) {
		return player.id == playerID;
	});
};

//Generates a PlayerList containing all players.
var gamePopulation = function() {
	var population = [];

	for (var player in registry.players) {
		population.push(registry.players[player]);
	}

	return new PlayerList(population);
};

//Does the same, but a UserPlayerList
var Population = function() {
	return new UserPlayerList(gamePopulation());
};

//Does the same, but an InfoPlayerList
var InfoPopulation = function() {
	return new InfoPlayerList(gamePopulation());
};

//A short-hand to return total population size without creating a PlayerList
Population.size = function() {
	return Object.keys(registry.players).length;
};

module.exports = {
	PlayerList,
	UserPlayerList,
	InfoPlayerList,
	gamePopulation,
	Population,
	InfoPopulation
};

},{"./helperFunctions":8,"./logger":27,"./player":43,"./state":50}],50:[function(require,module,exports){
"use strict";

var log = require('./logger');

log("debug", "state: Creating game state variables.")


var registry = {}
registry._addType_ = function(type){	
	registry[type] = {};
	log("silly", "state: adding registry entry: ", type)
};


var idCounters = {}
idCounters._addType_ = function(type){
	idCounters[type] = 0
	log("silly", "state: adding counter entry: ", type)
};





module.exports = {registry, idCounters};
},{"./logger":27}],51:[function(require,module,exports){
"use strict";

const nashName = "./core"; //Change this when published, probably to 'nash-js'

var fs = require("fs");
var compiler = require('expression-sandbox');

var { registerStrategy } = require('./strategy');

//Check to see if parsed expression is call to require or eval
function isBannedCall(node) {
	return (node.type === 'CallExpression') &&
		(node.callee.type === 'MemberExpression') &&
		(node.callee.object.type === 'Identifier') &&
		((node.callee.object.name === 'require') || (node.callee.object.name === 'eval'));
}


function removeCalls(source) {
	const entries = [];
	esprima.parseScript(source, {}, function(node, meta) {
		if (isBannedCall(node)) {
			entries.push({
				start: meta.start.offset,
				end: meta.end.offset
			});
		}
	});
	entries.sort((a, b) => { return b.end - a.end }).forEach(n => {
		source = source.slice(0, n.start) + " null; " + source.slice(n.end);
	});
	return source;
}



var loadStrategy = function(filepath, trusted = false) {
	var source = fs.readFileSync(filepath);

	if (!trusted) {
		var originalSource = source;
		var parsedSource = removeCalls(source);

		if (originalSource != parsedSource) throw new Error("Strategy " + filepath + " uses require or eval.");
	}

	source = "\"use strict\"; \n " + source;
	compiler(source)(registerStrategy);
}; //TODO: change this so that strategies can't require any modules.



function loadStrategyFolder(path = "./strategies") {
	var files = fs.readdirSync(path);
	var strategies = {}
	files.forEach(function(file) {
		var filePath = path + '/' + file;
		requireFunction(filepath);
	});
};


module.exports = { loadStrategy, loadStrategyFolder };

},{"./strategy":52,"expression-sandbox":60,"fs":1}],52:[function(require,module,exports){
"use strict";

var log = require('./logger');

//Javascript code parser
var esprima = require('esprima');

//Game state controllers
var { registry } = require('./state');

//Helper functions
var { idHandler } = require('./helperFunctions')("state");



//User interface to declare strategy type.
function registerStrategy(strategy, name, playername = "") {
	var id = idHandler(name, "strategy");

	if (id !== name) {
		//There was already a strategy registered with this name.
		//Check to see if it's the same strategy or not.
		if (!registry.strategies[id] === strategy) {
			//They're different, so we have a name conflict.
			throw new Error("Strategy name conflict with " + name);

		} else {
			// They're the same, do nothing.
			return true;
		}
	}

	// No name conflict and strategy not loaded yet. Add to registry.
	log("debug", "Loading strategy '" + id + "'")
	registry.strategies[id] = strategy;
}

function registerStrategyObject(strategyObject) {
	// If multiple strategies, split into individuals
	if (Array.isArray(strategyObject)) return strategyObject.map(registerStrategyObject)

	return registerStrategy(strategyObject.strategy, strategyObject.name, strategyObject.playerName)
}

//Strip out requires and such
function sanitizeStrategy(strategy) {
	// console.log(x) or console['error'](y)
	function isRequireCall(node) {
		return (node.type === 'CallExpression') &&
			(node.callee.type === 'MemberExpression') &&
			(node.callee.object.type === 'Identifier') &&
			(node.callee.object.name === 'require');
	}

	function removeCalls(source) {
		const entries = [];
		esprima.parseScript(source, {}, function(node, meta) {
			if (isRequireCall(node)) {
				entries.push({
					start: meta.start.offset,
					end: meta.end.offset
				});
			}
		});
		entries.sort((a, b) => { return b.end - a.end }).forEach(n => {
			source = source.slice(0, n.start) + source.slice(n.end);
		});
		return source;
	}

	removeCalls(strategy.toString());

}

//Returns to the user an array of all registered strategies. TODO: have this mirror PlayerList, to provide functionality like onlyAlive and scoresObject.
function Strategies() {
	var strategies = [];
	for (var strategy in registry.strategies) strategies.push(strategy);
	return strategies;
};

Strategies.debugger = function() {
	registerStrategy(function() {
		this.choose = function(options, information) {
			debugger;
		}
	}, "debugger")
	return "debugger"
}

module.exports = { registerStrategy, registerStrategyObject, Strategies };

},{"./helperFunctions":8,"./logger":27,"./state":50,"esprima":59}],53:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-PRZcf-nqry=><]/g;
};

},{}],54:[function(require,module,exports){
'use strict';

function assembleStyles () {
	var styles = {
		modifiers: {
			reset: [0, 0],
			bold: [1, 22], // 21 isn't widely supported and 22 does the same thing
			dim: [2, 22],
			italic: [3, 23],
			underline: [4, 24],
			inverse: [7, 27],
			hidden: [8, 28],
			strikethrough: [9, 29]
		},
		colors: {
			black: [30, 39],
			red: [31, 39],
			green: [32, 39],
			yellow: [33, 39],
			blue: [34, 39],
			magenta: [35, 39],
			cyan: [36, 39],
			white: [37, 39],
			gray: [90, 39]
		},
		bgColors: {
			bgBlack: [40, 49],
			bgRed: [41, 49],
			bgGreen: [42, 49],
			bgYellow: [43, 49],
			bgBlue: [44, 49],
			bgMagenta: [45, 49],
			bgCyan: [46, 49],
			bgWhite: [47, 49]
		}
	};

	// fix humans
	styles.colors.grey = styles.colors.gray;

	Object.keys(styles).forEach(function (groupName) {
		var group = styles[groupName];

		Object.keys(group).forEach(function (styleName) {
			var style = group[styleName];

			styles[styleName] = group[styleName] = {
				open: '\u001b[' + style[0] + 'm',
				close: '\u001b[' + style[1] + 'm'
			};
		});

		Object.defineProperty(styles, groupName, {
			value: group,
			enumerable: false
		});
	});

	return styles;
}

Object.defineProperty(module, 'exports', {
	enumerable: true,
	get: assembleStyles
});

},{}],55:[function(require,module,exports){
(function (process){
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))

},{"_process":3}],56:[function(require,module,exports){
(function (process){
'use strict';
var escapeStringRegexp = require('escape-string-regexp');
var ansiStyles = require('ansi-styles');
var stripAnsi = require('strip-ansi');
var hasAnsi = require('has-ansi');
var supportsColor = require('supports-color');
var defineProps = Object.defineProperties;
var isSimpleWindowsTerm = process.platform === 'win32' && !/^xterm/i.test(process.env.TERM);

function Chalk(options) {
	// detect mode if not set manually
	this.enabled = !options || options.enabled === undefined ? supportsColor : options.enabled;
}

// use bright blue on Windows as the normal blue color is illegible
if (isSimpleWindowsTerm) {
	ansiStyles.blue.open = '\u001b[94m';
}

var styles = (function () {
	var ret = {};

	Object.keys(ansiStyles).forEach(function (key) {
		ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');

		ret[key] = {
			get: function () {
				return build.call(this, this._styles.concat(key));
			}
		};
	});

	return ret;
})();

var proto = defineProps(function chalk() {}, styles);

function build(_styles) {
	var builder = function () {
		return applyStyle.apply(builder, arguments);
	};

	builder._styles = _styles;
	builder.enabled = this.enabled;
	// __proto__ is used because we must return a function, but there is
	// no way to create a function with a different prototype.
	/* eslint-disable no-proto */
	builder.__proto__ = proto;

	return builder;
}

function applyStyle() {
	// support varags, but simply cast to string in case there's only one arg
	var args = arguments;
	var argsLen = args.length;
	var str = argsLen !== 0 && String(arguments[0]);

	if (argsLen > 1) {
		// don't slice `arguments`, it prevents v8 optimizations
		for (var a = 1; a < argsLen; a++) {
			str += ' ' + args[a];
		}
	}

	if (!this.enabled || !str) {
		return str;
	}

	var nestedStyles = this._styles;
	var i = nestedStyles.length;

	// Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
	// see https://github.com/chalk/chalk/issues/58
	// If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.
	var originalDim = ansiStyles.dim.open;
	if (isSimpleWindowsTerm && (nestedStyles.indexOf('gray') !== -1 || nestedStyles.indexOf('grey') !== -1)) {
		ansiStyles.dim.open = '';
	}

	while (i--) {
		var code = ansiStyles[nestedStyles[i]];

		// Replace any instances already present with a re-opening code
		// otherwise only the part of the string until said closing code
		// will be colored, and the rest will simply be 'plain'.
		str = code.open + str.replace(code.closeRe, code.open) + code.close;
	}

	// Reset the original 'dim' if we changed it to work around the Windows dimmed gray issue.
	ansiStyles.dim.open = originalDim;

	return str;
}

function init() {
	var ret = {};

	Object.keys(styles).forEach(function (name) {
		ret[name] = {
			get: function () {
				return build.call(this, [name]);
			}
		};
	});

	return ret;
}

defineProps(Chalk.prototype, init());

module.exports = new Chalk();
module.exports.styles = ansiStyles;
module.exports.hasColor = hasAnsi;
module.exports.stripColor = stripAnsi;
module.exports.supportsColor = supportsColor;

}).call(this,require('_process'))

},{"_process":3,"ansi-styles":54,"escape-string-regexp":58,"has-ansi":63,"strip-ansi":70,"supports-color":57}],57:[function(require,module,exports){
(function (process){
'use strict';
var argv = process.argv;

var terminator = argv.indexOf('--');
var hasFlag = function (flag) {
	flag = '--' + flag;
	var pos = argv.indexOf(flag);
	return pos !== -1 && (terminator !== -1 ? pos < terminator : true);
};

module.exports = (function () {
	if ('FORCE_COLOR' in process.env) {
		return true;
	}

	if (hasFlag('no-color') ||
		hasFlag('no-colors') ||
		hasFlag('color=false')) {
		return false;
	}

	if (hasFlag('color') ||
		hasFlag('colors') ||
		hasFlag('color=true') ||
		hasFlag('color=always')) {
		return true;
	}

	if (process.stdout && !process.stdout.isTTY) {
		return false;
	}

	if (process.platform === 'win32') {
		return true;
	}

	if ('COLORTERM' in process.env) {
		return true;
	}

	if (process.env.TERM === 'dumb') {
		return false;
	}

	if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
		return true;
	}

	return false;
})();

}).call(this,require('_process'))

},{"_process":3}],58:[function(require,module,exports){
'use strict';

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};

},{}],59:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
/* istanbul ignore next */
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
/* istanbul ignore next */
	else if(typeof exports === 'object')
		exports["esprima"] = factory();
	else
		root["esprima"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/* istanbul ignore if */
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	/*
	  Copyright JS Foundation and other contributors, https://js.foundation/

	  Redistribution and use in source and binary forms, with or without
	  modification, are permitted provided that the following conditions are met:

	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.

	  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
	*/
	Object.defineProperty(exports, "__esModule", { value: true });
	var comment_handler_1 = __webpack_require__(1);
	var jsx_parser_1 = __webpack_require__(3);
	var parser_1 = __webpack_require__(8);
	var tokenizer_1 = __webpack_require__(15);
	function parse(code, options, delegate) {
	    var commentHandler = null;
	    var proxyDelegate = function (node, metadata) {
	        if (delegate) {
	            delegate(node, metadata);
	        }
	        if (commentHandler) {
	            commentHandler.visit(node, metadata);
	        }
	    };
	    var parserDelegate = (typeof delegate === 'function') ? proxyDelegate : null;
	    var collectComment = false;
	    if (options) {
	        collectComment = (typeof options.comment === 'boolean' && options.comment);
	        var attachComment = (typeof options.attachComment === 'boolean' && options.attachComment);
	        if (collectComment || attachComment) {
	            commentHandler = new comment_handler_1.CommentHandler();
	            commentHandler.attach = attachComment;
	            options.comment = true;
	            parserDelegate = proxyDelegate;
	        }
	    }
	    var isModule = false;
	    if (options && typeof options.sourceType === 'string') {
	        isModule = (options.sourceType === 'module');
	    }
	    var parser;
	    if (options && typeof options.jsx === 'boolean' && options.jsx) {
	        parser = new jsx_parser_1.JSXParser(code, options, parserDelegate);
	    }
	    else {
	        parser = new parser_1.Parser(code, options, parserDelegate);
	    }
	    var program = isModule ? parser.parseModule() : parser.parseScript();
	    var ast = program;
	    if (collectComment && commentHandler) {
	        ast.comments = commentHandler.comments;
	    }
	    if (parser.config.tokens) {
	        ast.tokens = parser.tokens;
	    }
	    if (parser.config.tolerant) {
	        ast.errors = parser.errorHandler.errors;
	    }
	    return ast;
	}
	exports.parse = parse;
	function parseModule(code, options, delegate) {
	    var parsingOptions = options || {};
	    parsingOptions.sourceType = 'module';
	    return parse(code, parsingOptions, delegate);
	}
	exports.parseModule = parseModule;
	function parseScript(code, options, delegate) {
	    var parsingOptions = options || {};
	    parsingOptions.sourceType = 'script';
	    return parse(code, parsingOptions, delegate);
	}
	exports.parseScript = parseScript;
	function tokenize(code, options, delegate) {
	    var tokenizer = new tokenizer_1.Tokenizer(code, options);
	    var tokens;
	    tokens = [];
	    try {
	        while (true) {
	            var token = tokenizer.getNextToken();
	            if (!token) {
	                break;
	            }
	            if (delegate) {
	                token = delegate(token);
	            }
	            tokens.push(token);
	        }
	    }
	    catch (e) {
	        tokenizer.errorHandler.tolerate(e);
	    }
	    if (tokenizer.errorHandler.tolerant) {
	        tokens.errors = tokenizer.errors();
	    }
	    return tokens;
	}
	exports.tokenize = tokenize;
	var syntax_1 = __webpack_require__(2);
	exports.Syntax = syntax_1.Syntax;
	// Sync with *.json manifests.
	exports.version = '4.0.0';


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var syntax_1 = __webpack_require__(2);
	var CommentHandler = (function () {
	    function CommentHandler() {
	        this.attach = false;
	        this.comments = [];
	        this.stack = [];
	        this.leading = [];
	        this.trailing = [];
	    }
	    CommentHandler.prototype.insertInnerComments = function (node, metadata) {
	        //  innnerComments for properties empty block
	        //  `function a() {/** comments **\/}`
	        if (node.type === syntax_1.Syntax.BlockStatement && node.body.length === 0) {
	            var innerComments = [];
	            for (var i = this.leading.length - 1; i >= 0; --i) {
	                var entry = this.leading[i];
	                if (metadata.end.offset >= entry.start) {
	                    innerComments.unshift(entry.comment);
	                    this.leading.splice(i, 1);
	                    this.trailing.splice(i, 1);
	                }
	            }
	            if (innerComments.length) {
	                node.innerComments = innerComments;
	            }
	        }
	    };
	    CommentHandler.prototype.findTrailingComments = function (metadata) {
	        var trailingComments = [];
	        if (this.trailing.length > 0) {
	            for (var i = this.trailing.length - 1; i >= 0; --i) {
	                var entry_1 = this.trailing[i];
	                if (entry_1.start >= metadata.end.offset) {
	                    trailingComments.unshift(entry_1.comment);
	                }
	            }
	            this.trailing.length = 0;
	            return trailingComments;
	        }
	        var entry = this.stack[this.stack.length - 1];
	        if (entry && entry.node.trailingComments) {
	            var firstComment = entry.node.trailingComments[0];
	            if (firstComment && firstComment.range[0] >= metadata.end.offset) {
	                trailingComments = entry.node.trailingComments;
	                delete entry.node.trailingComments;
	            }
	        }
	        return trailingComments;
	    };
	    CommentHandler.prototype.findLeadingComments = function (metadata) {
	        var leadingComments = [];
	        var target;
	        while (this.stack.length > 0) {
	            var entry = this.stack[this.stack.length - 1];
	            if (entry && entry.start >= metadata.start.offset) {
	                target = entry.node;
	                this.stack.pop();
	            }
	            else {
	                break;
	            }
	        }
	        if (target) {
	            var count = target.leadingComments ? target.leadingComments.length : 0;
	            for (var i = count - 1; i >= 0; --i) {
	                var comment = target.leadingComments[i];
	                if (comment.range[1] <= metadata.start.offset) {
	                    leadingComments.unshift(comment);
	                    target.leadingComments.splice(i, 1);
	                }
	            }
	            if (target.leadingComments && target.leadingComments.length === 0) {
	                delete target.leadingComments;
	            }
	            return leadingComments;
	        }
	        for (var i = this.leading.length - 1; i >= 0; --i) {
	            var entry = this.leading[i];
	            if (entry.start <= metadata.start.offset) {
	                leadingComments.unshift(entry.comment);
	                this.leading.splice(i, 1);
	            }
	        }
	        return leadingComments;
	    };
	    CommentHandler.prototype.visitNode = function (node, metadata) {
	        if (node.type === syntax_1.Syntax.Program && node.body.length > 0) {
	            return;
	        }
	        this.insertInnerComments(node, metadata);
	        var trailingComments = this.findTrailingComments(metadata);
	        var leadingComments = this.findLeadingComments(metadata);
	        if (leadingComments.length > 0) {
	            node.leadingComments = leadingComments;
	        }
	        if (trailingComments.length > 0) {
	            node.trailingComments = trailingComments;
	        }
	        this.stack.push({
	            node: node,
	            start: metadata.start.offset
	        });
	    };
	    CommentHandler.prototype.visitComment = function (node, metadata) {
	        var type = (node.type[0] === 'L') ? 'Line' : 'Block';
	        var comment = {
	            type: type,
	            value: node.value
	        };
	        if (node.range) {
	            comment.range = node.range;
	        }
	        if (node.loc) {
	            comment.loc = node.loc;
	        }
	        this.comments.push(comment);
	        if (this.attach) {
	            var entry = {
	                comment: {
	                    type: type,
	                    value: node.value,
	                    range: [metadata.start.offset, metadata.end.offset]
	                },
	                start: metadata.start.offset
	            };
	            if (node.loc) {
	                entry.comment.loc = node.loc;
	            }
	            node.type = type;
	            this.leading.push(entry);
	            this.trailing.push(entry);
	        }
	    };
	    CommentHandler.prototype.visit = function (node, metadata) {
	        if (node.type === 'LineComment') {
	            this.visitComment(node, metadata);
	        }
	        else if (node.type === 'BlockComment') {
	            this.visitComment(node, metadata);
	        }
	        else if (this.attach) {
	            this.visitNode(node, metadata);
	        }
	    };
	    return CommentHandler;
	}());
	exports.CommentHandler = CommentHandler;


/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Syntax = {
	    AssignmentExpression: 'AssignmentExpression',
	    AssignmentPattern: 'AssignmentPattern',
	    ArrayExpression: 'ArrayExpression',
	    ArrayPattern: 'ArrayPattern',
	    ArrowFunctionExpression: 'ArrowFunctionExpression',
	    AwaitExpression: 'AwaitExpression',
	    BlockStatement: 'BlockStatement',
	    BinaryExpression: 'BinaryExpression',
	    BreakStatement: 'BreakStatement',
	    CallExpression: 'CallExpression',
	    CatchClause: 'CatchClause',
	    ClassBody: 'ClassBody',
	    ClassDeclaration: 'ClassDeclaration',
	    ClassExpression: 'ClassExpression',
	    ConditionalExpression: 'ConditionalExpression',
	    ContinueStatement: 'ContinueStatement',
	    DoWhileStatement: 'DoWhileStatement',
	    DebuggerStatement: 'DebuggerStatement',
	    EmptyStatement: 'EmptyStatement',
	    ExportAllDeclaration: 'ExportAllDeclaration',
	    ExportDefaultDeclaration: 'ExportDefaultDeclaration',
	    ExportNamedDeclaration: 'ExportNamedDeclaration',
	    ExportSpecifier: 'ExportSpecifier',
	    ExpressionStatement: 'ExpressionStatement',
	    ForStatement: 'ForStatement',
	    ForOfStatement: 'ForOfStatement',
	    ForInStatement: 'ForInStatement',
	    FunctionDeclaration: 'FunctionDeclaration',
	    FunctionExpression: 'FunctionExpression',
	    Identifier: 'Identifier',
	    IfStatement: 'IfStatement',
	    ImportDeclaration: 'ImportDeclaration',
	    ImportDefaultSpecifier: 'ImportDefaultSpecifier',
	    ImportNamespaceSpecifier: 'ImportNamespaceSpecifier',
	    ImportSpecifier: 'ImportSpecifier',
	    Literal: 'Literal',
	    LabeledStatement: 'LabeledStatement',
	    LogicalExpression: 'LogicalExpression',
	    MemberExpression: 'MemberExpression',
	    MetaProperty: 'MetaProperty',
	    MethodDefinition: 'MethodDefinition',
	    NewExpression: 'NewExpression',
	    ObjectExpression: 'ObjectExpression',
	    ObjectPattern: 'ObjectPattern',
	    Program: 'Program',
	    Property: 'Property',
	    RestElement: 'RestElement',
	    ReturnStatement: 'ReturnStatement',
	    SequenceExpression: 'SequenceExpression',
	    SpreadElement: 'SpreadElement',
	    Super: 'Super',
	    SwitchCase: 'SwitchCase',
	    SwitchStatement: 'SwitchStatement',
	    TaggedTemplateExpression: 'TaggedTemplateExpression',
	    TemplateElement: 'TemplateElement',
	    TemplateLiteral: 'TemplateLiteral',
	    ThisExpression: 'ThisExpression',
	    ThrowStatement: 'ThrowStatement',
	    TryStatement: 'TryStatement',
	    UnaryExpression: 'UnaryExpression',
	    UpdateExpression: 'UpdateExpression',
	    VariableDeclaration: 'VariableDeclaration',
	    VariableDeclarator: 'VariableDeclarator',
	    WhileStatement: 'WhileStatement',
	    WithStatement: 'WithStatement',
	    YieldExpression: 'YieldExpression'
	};


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
/* istanbul ignore next */
	var __extends = (this && this.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	var character_1 = __webpack_require__(4);
	var JSXNode = __webpack_require__(5);
	var jsx_syntax_1 = __webpack_require__(6);
	var Node = __webpack_require__(7);
	var parser_1 = __webpack_require__(8);
	var token_1 = __webpack_require__(13);
	var xhtml_entities_1 = __webpack_require__(14);
	token_1.TokenName[100 /* Identifier */] = 'JSXIdentifier';
	token_1.TokenName[101 /* Text */] = 'JSXText';
	// Fully qualified element name, e.g. <svg:path> returns "svg:path"
	function getQualifiedElementName(elementName) {
	    var qualifiedName;
	    switch (elementName.type) {
	        case jsx_syntax_1.JSXSyntax.JSXIdentifier:
	            var id = elementName;
	            qualifiedName = id.name;
	            break;
	        case jsx_syntax_1.JSXSyntax.JSXNamespacedName:
	            var ns = elementName;
	            qualifiedName = getQualifiedElementName(ns.namespace) + ':' +
	                getQualifiedElementName(ns.name);
	            break;
	        case jsx_syntax_1.JSXSyntax.JSXMemberExpression:
	            var expr = elementName;
	            qualifiedName = getQualifiedElementName(expr.object) + '.' +
	                getQualifiedElementName(expr.property);
	            break;
	        /* istanbul ignore next */
	        default:
	            break;
	    }
	    return qualifiedName;
	}
	var JSXParser = (function (_super) {
	    __extends(JSXParser, _super);
	    function JSXParser(code, options, delegate) {
	        return _super.call(this, code, options, delegate) || this;
	    }
	    JSXParser.prototype.parsePrimaryExpression = function () {
	        return this.match('<') ? this.parseJSXRoot() : _super.prototype.parsePrimaryExpression.call(this);
	    };
	    JSXParser.prototype.startJSX = function () {
	        // Unwind the scanner before the lookahead token.
	        this.scanner.index = this.startMarker.index;
	        this.scanner.lineNumber = this.startMarker.line;
	        this.scanner.lineStart = this.startMarker.index - this.startMarker.column;
	    };
	    JSXParser.prototype.finishJSX = function () {
	        // Prime the next lookahead.
	        this.nextToken();
	    };
	    JSXParser.prototype.reenterJSX = function () {
	        this.startJSX();
	        this.expectJSX('}');
	        // Pop the closing '}' added from the lookahead.
	        if (this.config.tokens) {
	            this.tokens.pop();
	        }
	    };
	    JSXParser.prototype.createJSXNode = function () {
	        this.collectComments();
	        return {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    };
	    JSXParser.prototype.createJSXChildNode = function () {
	        return {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    };
	    JSXParser.prototype.scanXHTMLEntity = function (quote) {
	        var result = '&';
	        var valid = true;
	        var terminated = false;
	        var numeric = false;
	        var hex = false;
	        while (!this.scanner.eof() && valid && !terminated) {
	            var ch = this.scanner.source[this.scanner.index];
	            if (ch === quote) {
	                break;
	            }
	            terminated = (ch === ';');
	            result += ch;
	            ++this.scanner.index;
	            if (!terminated) {
	                switch (result.length) {
	                    case 2:
	                        // e.g. '&#123;'
	                        numeric = (ch === '#');
	                        break;
	                    case 3:
	                        if (numeric) {
	                            // e.g. '&#x41;'
	                            hex = (ch === 'x');
	                            valid = hex || character_1.Character.isDecimalDigit(ch.charCodeAt(0));
	                            numeric = numeric && !hex;
	                        }
	                        break;
	                    default:
	                        valid = valid && !(numeric && !character_1.Character.isDecimalDigit(ch.charCodeAt(0)));
	                        valid = valid && !(hex && !character_1.Character.isHexDigit(ch.charCodeAt(0)));
	                        break;
	                }
	            }
	        }
	        if (valid && terminated && result.length > 2) {
	            // e.g. '&#x41;' becomes just '#x41'
	            var str = result.substr(1, result.length - 2);
	            if (numeric && str.length > 1) {
	                result = String.fromCharCode(parseInt(str.substr(1), 10));
	            }
	            else if (hex && str.length > 2) {
	                result = String.fromCharCode(parseInt('0' + str.substr(1), 16));
	            }
	            else if (!numeric && !hex && xhtml_entities_1.XHTMLEntities[str]) {
	                result = xhtml_entities_1.XHTMLEntities[str];
	            }
	        }
	        return result;
	    };
	    // Scan the next JSX token. This replaces Scanner#lex when in JSX mode.
	    JSXParser.prototype.lexJSX = function () {
	        var cp = this.scanner.source.charCodeAt(this.scanner.index);
	        // < > / : = { }
	        if (cp === 60 || cp === 62 || cp === 47 || cp === 58 || cp === 61 || cp === 123 || cp === 125) {
	            var value = this.scanner.source[this.scanner.index++];
	            return {
	                type: 7 /* Punctuator */,
	                value: value,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: this.scanner.index - 1,
	                end: this.scanner.index
	            };
	        }
	        // " '
	        if (cp === 34 || cp === 39) {
	            var start = this.scanner.index;
	            var quote = this.scanner.source[this.scanner.index++];
	            var str = '';
	            while (!this.scanner.eof()) {
	                var ch = this.scanner.source[this.scanner.index++];
	                if (ch === quote) {
	                    break;
	                }
	                else if (ch === '&') {
	                    str += this.scanXHTMLEntity(quote);
	                }
	                else {
	                    str += ch;
	                }
	            }
	            return {
	                type: 8 /* StringLiteral */,
	                value: str,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        // ... or .
	        if (cp === 46) {
	            var n1 = this.scanner.source.charCodeAt(this.scanner.index + 1);
	            var n2 = this.scanner.source.charCodeAt(this.scanner.index + 2);
	            var value = (n1 === 46 && n2 === 46) ? '...' : '.';
	            var start = this.scanner.index;
	            this.scanner.index += value.length;
	            return {
	                type: 7 /* Punctuator */,
	                value: value,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        // `
	        if (cp === 96) {
	            // Only placeholder, since it will be rescanned as a real assignment expression.
	            return {
	                type: 10 /* Template */,
	                value: '',
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: this.scanner.index,
	                end: this.scanner.index
	            };
	        }
	        // Identifer can not contain backslash (char code 92).
	        if (character_1.Character.isIdentifierStart(cp) && (cp !== 92)) {
	            var start = this.scanner.index;
	            ++this.scanner.index;
	            while (!this.scanner.eof()) {
	                var ch = this.scanner.source.charCodeAt(this.scanner.index);
	                if (character_1.Character.isIdentifierPart(ch) && (ch !== 92)) {
	                    ++this.scanner.index;
	                }
	                else if (ch === 45) {
	                    // Hyphen (char code 45) can be part of an identifier.
	                    ++this.scanner.index;
	                }
	                else {
	                    break;
	                }
	            }
	            var id = this.scanner.source.slice(start, this.scanner.index);
	            return {
	                type: 100 /* Identifier */,
	                value: id,
	                lineNumber: this.scanner.lineNumber,
	                lineStart: this.scanner.lineStart,
	                start: start,
	                end: this.scanner.index
	            };
	        }
	        return this.scanner.lex();
	    };
	    JSXParser.prototype.nextJSXToken = function () {
	        this.collectComments();
	        this.startMarker.index = this.scanner.index;
	        this.startMarker.line = this.scanner.lineNumber;
	        this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        var token = this.lexJSX();
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        if (this.config.tokens) {
	            this.tokens.push(this.convertToken(token));
	        }
	        return token;
	    };
	    JSXParser.prototype.nextJSXText = function () {
	        this.startMarker.index = this.scanner.index;
	        this.startMarker.line = this.scanner.lineNumber;
	        this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        var start = this.scanner.index;
	        var text = '';
	        while (!this.scanner.eof()) {
	            var ch = this.scanner.source[this.scanner.index];
	            if (ch === '{' || ch === '<') {
	                break;
	            }
	            ++this.scanner.index;
	            text += ch;
	            if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                ++this.scanner.lineNumber;
	                if (ch === '\r' && this.scanner.source[this.scanner.index] === '\n') {
	                    ++this.scanner.index;
	                }
	                this.scanner.lineStart = this.scanner.index;
	            }
	        }
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        var token = {
	            type: 101 /* Text */,
	            value: text,
	            lineNumber: this.scanner.lineNumber,
	            lineStart: this.scanner.lineStart,
	            start: start,
	            end: this.scanner.index
	        };
	        if ((text.length > 0) && this.config.tokens) {
	            this.tokens.push(this.convertToken(token));
	        }
	        return token;
	    };
	    JSXParser.prototype.peekJSXToken = function () {
	        var state = this.scanner.saveState();
	        this.scanner.scanComments();
	        var next = this.lexJSX();
	        this.scanner.restoreState(state);
	        return next;
	    };
	    // Expect the next JSX token to match the specified punctuator.
	    // If not, an exception will be thrown.
	    JSXParser.prototype.expectJSX = function (value) {
	        var token = this.nextJSXToken();
	        if (token.type !== 7 /* Punctuator */ || token.value !== value) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Return true if the next JSX token matches the specified punctuator.
	    JSXParser.prototype.matchJSX = function (value) {
	        var next = this.peekJSXToken();
	        return next.type === 7 /* Punctuator */ && next.value === value;
	    };
	    JSXParser.prototype.parseJSXIdentifier = function () {
	        var node = this.createJSXNode();
	        var token = this.nextJSXToken();
	        if (token.type !== 100 /* Identifier */) {
	            this.throwUnexpectedToken(token);
	        }
	        return this.finalize(node, new JSXNode.JSXIdentifier(token.value));
	    };
	    JSXParser.prototype.parseJSXElementName = function () {
	        var node = this.createJSXNode();
	        var elementName = this.parseJSXIdentifier();
	        if (this.matchJSX(':')) {
	            var namespace = elementName;
	            this.expectJSX(':');
	            var name_1 = this.parseJSXIdentifier();
	            elementName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name_1));
	        }
	        else if (this.matchJSX('.')) {
	            while (this.matchJSX('.')) {
	                var object = elementName;
	                this.expectJSX('.');
	                var property = this.parseJSXIdentifier();
	                elementName = this.finalize(node, new JSXNode.JSXMemberExpression(object, property));
	            }
	        }
	        return elementName;
	    };
	    JSXParser.prototype.parseJSXAttributeName = function () {
	        var node = this.createJSXNode();
	        var attributeName;
	        var identifier = this.parseJSXIdentifier();
	        if (this.matchJSX(':')) {
	            var namespace = identifier;
	            this.expectJSX(':');
	            var name_2 = this.parseJSXIdentifier();
	            attributeName = this.finalize(node, new JSXNode.JSXNamespacedName(namespace, name_2));
	        }
	        else {
	            attributeName = identifier;
	        }
	        return attributeName;
	    };
	    JSXParser.prototype.parseJSXStringLiteralAttribute = function () {
	        var node = this.createJSXNode();
	        var token = this.nextJSXToken();
	        if (token.type !== 8 /* StringLiteral */) {
	            this.throwUnexpectedToken(token);
	        }
	        var raw = this.getTokenRaw(token);
	        return this.finalize(node, new Node.Literal(token.value, raw));
	    };
	    JSXParser.prototype.parseJSXExpressionAttribute = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        this.finishJSX();
	        if (this.match('}')) {
	            this.tolerateError('JSX attributes must only be assigned a non-empty expression');
	        }
	        var expression = this.parseAssignmentExpression();
	        this.reenterJSX();
	        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
	    };
	    JSXParser.prototype.parseJSXAttributeValue = function () {
	        return this.matchJSX('{') ? this.parseJSXExpressionAttribute() :
	            this.matchJSX('<') ? this.parseJSXElement() : this.parseJSXStringLiteralAttribute();
	    };
	    JSXParser.prototype.parseJSXNameValueAttribute = function () {
	        var node = this.createJSXNode();
	        var name = this.parseJSXAttributeName();
	        var value = null;
	        if (this.matchJSX('=')) {
	            this.expectJSX('=');
	            value = this.parseJSXAttributeValue();
	        }
	        return this.finalize(node, new JSXNode.JSXAttribute(name, value));
	    };
	    JSXParser.prototype.parseJSXSpreadAttribute = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        this.expectJSX('...');
	        this.finishJSX();
	        var argument = this.parseAssignmentExpression();
	        this.reenterJSX();
	        return this.finalize(node, new JSXNode.JSXSpreadAttribute(argument));
	    };
	    JSXParser.prototype.parseJSXAttributes = function () {
	        var attributes = [];
	        while (!this.matchJSX('/') && !this.matchJSX('>')) {
	            var attribute = this.matchJSX('{') ? this.parseJSXSpreadAttribute() :
	                this.parseJSXNameValueAttribute();
	            attributes.push(attribute);
	        }
	        return attributes;
	    };
	    JSXParser.prototype.parseJSXOpeningElement = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('<');
	        var name = this.parseJSXElementName();
	        var attributes = this.parseJSXAttributes();
	        var selfClosing = this.matchJSX('/');
	        if (selfClosing) {
	            this.expectJSX('/');
	        }
	        this.expectJSX('>');
	        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
	    };
	    JSXParser.prototype.parseJSXBoundaryElement = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('<');
	        if (this.matchJSX('/')) {
	            this.expectJSX('/');
	            var name_3 = this.parseJSXElementName();
	            this.expectJSX('>');
	            return this.finalize(node, new JSXNode.JSXClosingElement(name_3));
	        }
	        var name = this.parseJSXElementName();
	        var attributes = this.parseJSXAttributes();
	        var selfClosing = this.matchJSX('/');
	        if (selfClosing) {
	            this.expectJSX('/');
	        }
	        this.expectJSX('>');
	        return this.finalize(node, new JSXNode.JSXOpeningElement(name, selfClosing, attributes));
	    };
	    JSXParser.prototype.parseJSXEmptyExpression = function () {
	        var node = this.createJSXChildNode();
	        this.collectComments();
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        return this.finalize(node, new JSXNode.JSXEmptyExpression());
	    };
	    JSXParser.prototype.parseJSXExpressionContainer = function () {
	        var node = this.createJSXNode();
	        this.expectJSX('{');
	        var expression;
	        if (this.matchJSX('}')) {
	            expression = this.parseJSXEmptyExpression();
	            this.expectJSX('}');
	        }
	        else {
	            this.finishJSX();
	            expression = this.parseAssignmentExpression();
	            this.reenterJSX();
	        }
	        return this.finalize(node, new JSXNode.JSXExpressionContainer(expression));
	    };
	    JSXParser.prototype.parseJSXChildren = function () {
	        var children = [];
	        while (!this.scanner.eof()) {
	            var node = this.createJSXChildNode();
	            var token = this.nextJSXText();
	            if (token.start < token.end) {
	                var raw = this.getTokenRaw(token);
	                var child = this.finalize(node, new JSXNode.JSXText(token.value, raw));
	                children.push(child);
	            }
	            if (this.scanner.source[this.scanner.index] === '{') {
	                var container = this.parseJSXExpressionContainer();
	                children.push(container);
	            }
	            else {
	                break;
	            }
	        }
	        return children;
	    };
	    JSXParser.prototype.parseComplexJSXElement = function (el) {
	        var stack = [];
	        while (!this.scanner.eof()) {
	            el.children = el.children.concat(this.parseJSXChildren());
	            var node = this.createJSXChildNode();
	            var element = this.parseJSXBoundaryElement();
	            if (element.type === jsx_syntax_1.JSXSyntax.JSXOpeningElement) {
	                var opening = element;
	                if (opening.selfClosing) {
	                    var child = this.finalize(node, new JSXNode.JSXElement(opening, [], null));
	                    el.children.push(child);
	                }
	                else {
	                    stack.push(el);
	                    el = { node: node, opening: opening, closing: null, children: [] };
	                }
	            }
	            if (element.type === jsx_syntax_1.JSXSyntax.JSXClosingElement) {
	                el.closing = element;
	                var open_1 = getQualifiedElementName(el.opening.name);
	                var close_1 = getQualifiedElementName(el.closing.name);
	                if (open_1 !== close_1) {
	                    this.tolerateError('Expected corresponding JSX closing tag for %0', open_1);
	                }
	                if (stack.length > 0) {
	                    var child = this.finalize(el.node, new JSXNode.JSXElement(el.opening, el.children, el.closing));
	                    el = stack[stack.length - 1];
	                    el.children.push(child);
	                    stack.pop();
	                }
	                else {
	                    break;
	                }
	            }
	        }
	        return el;
	    };
	    JSXParser.prototype.parseJSXElement = function () {
	        var node = this.createJSXNode();
	        var opening = this.parseJSXOpeningElement();
	        var children = [];
	        var closing = null;
	        if (!opening.selfClosing) {
	            var el = this.parseComplexJSXElement({ node: node, opening: opening, closing: closing, children: children });
	            children = el.children;
	            closing = el.closing;
	        }
	        return this.finalize(node, new JSXNode.JSXElement(opening, children, closing));
	    };
	    JSXParser.prototype.parseJSXRoot = function () {
	        // Pop the opening '<' added from the lookahead.
	        if (this.config.tokens) {
	            this.tokens.pop();
	        }
	        this.startJSX();
	        var element = this.parseJSXElement();
	        this.finishJSX();
	        return element;
	    };
	    JSXParser.prototype.isStartOfExpression = function () {
	        return _super.prototype.isStartOfExpression.call(this) || this.match('<');
	    };
	    return JSXParser;
	}(parser_1.Parser));
	exports.JSXParser = JSXParser;


/***/ },
/* 4 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	// See also tools/generate-unicode-regex.js.
	var Regex = {
	    // Unicode v8.0.0 NonAsciiIdentifierStart:
	    NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]/,
	    // Unicode v8.0.0 NonAsciiIdentifierPart:
	    NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
	};
	exports.Character = {
	    /* tslint:disable:no-bitwise */
	    fromCodePoint: function (cp) {
	        return (cp < 0x10000) ? String.fromCharCode(cp) :
	            String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10)) +
	                String.fromCharCode(0xDC00 + ((cp - 0x10000) & 1023));
	    },
	    // https://tc39.github.io/ecma262/#sec-white-space
	    isWhiteSpace: function (cp) {
	        return (cp === 0x20) || (cp === 0x09) || (cp === 0x0B) || (cp === 0x0C) || (cp === 0xA0) ||
	            (cp >= 0x1680 && [0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(cp) >= 0);
	    },
	    // https://tc39.github.io/ecma262/#sec-line-terminators
	    isLineTerminator: function (cp) {
	        return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
	    },
	    // https://tc39.github.io/ecma262/#sec-names-and-keywords
	    isIdentifierStart: function (cp) {
	        return (cp === 0x24) || (cp === 0x5F) ||
	            (cp >= 0x41 && cp <= 0x5A) ||
	            (cp >= 0x61 && cp <= 0x7A) ||
	            (cp === 0x5C) ||
	            ((cp >= 0x80) && Regex.NonAsciiIdentifierStart.test(exports.Character.fromCodePoint(cp)));
	    },
	    isIdentifierPart: function (cp) {
	        return (cp === 0x24) || (cp === 0x5F) ||
	            (cp >= 0x41 && cp <= 0x5A) ||
	            (cp >= 0x61 && cp <= 0x7A) ||
	            (cp >= 0x30 && cp <= 0x39) ||
	            (cp === 0x5C) ||
	            ((cp >= 0x80) && Regex.NonAsciiIdentifierPart.test(exports.Character.fromCodePoint(cp)));
	    },
	    // https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	    isDecimalDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x39); // 0..9
	    },
	    isHexDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x39) ||
	            (cp >= 0x41 && cp <= 0x46) ||
	            (cp >= 0x61 && cp <= 0x66); // a..f
	    },
	    isOctalDigit: function (cp) {
	        return (cp >= 0x30 && cp <= 0x37); // 0..7
	    }
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var jsx_syntax_1 = __webpack_require__(6);
	/* tslint:disable:max-classes-per-file */
	var JSXClosingElement = (function () {
	    function JSXClosingElement(name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXClosingElement;
	        this.name = name;
	    }
	    return JSXClosingElement;
	}());
	exports.JSXClosingElement = JSXClosingElement;
	var JSXElement = (function () {
	    function JSXElement(openingElement, children, closingElement) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXElement;
	        this.openingElement = openingElement;
	        this.children = children;
	        this.closingElement = closingElement;
	    }
	    return JSXElement;
	}());
	exports.JSXElement = JSXElement;
	var JSXEmptyExpression = (function () {
	    function JSXEmptyExpression() {
	        this.type = jsx_syntax_1.JSXSyntax.JSXEmptyExpression;
	    }
	    return JSXEmptyExpression;
	}());
	exports.JSXEmptyExpression = JSXEmptyExpression;
	var JSXExpressionContainer = (function () {
	    function JSXExpressionContainer(expression) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXExpressionContainer;
	        this.expression = expression;
	    }
	    return JSXExpressionContainer;
	}());
	exports.JSXExpressionContainer = JSXExpressionContainer;
	var JSXIdentifier = (function () {
	    function JSXIdentifier(name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXIdentifier;
	        this.name = name;
	    }
	    return JSXIdentifier;
	}());
	exports.JSXIdentifier = JSXIdentifier;
	var JSXMemberExpression = (function () {
	    function JSXMemberExpression(object, property) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXMemberExpression;
	        this.object = object;
	        this.property = property;
	    }
	    return JSXMemberExpression;
	}());
	exports.JSXMemberExpression = JSXMemberExpression;
	var JSXAttribute = (function () {
	    function JSXAttribute(name, value) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXAttribute;
	        this.name = name;
	        this.value = value;
	    }
	    return JSXAttribute;
	}());
	exports.JSXAttribute = JSXAttribute;
	var JSXNamespacedName = (function () {
	    function JSXNamespacedName(namespace, name) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXNamespacedName;
	        this.namespace = namespace;
	        this.name = name;
	    }
	    return JSXNamespacedName;
	}());
	exports.JSXNamespacedName = JSXNamespacedName;
	var JSXOpeningElement = (function () {
	    function JSXOpeningElement(name, selfClosing, attributes) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXOpeningElement;
	        this.name = name;
	        this.selfClosing = selfClosing;
	        this.attributes = attributes;
	    }
	    return JSXOpeningElement;
	}());
	exports.JSXOpeningElement = JSXOpeningElement;
	var JSXSpreadAttribute = (function () {
	    function JSXSpreadAttribute(argument) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXSpreadAttribute;
	        this.argument = argument;
	    }
	    return JSXSpreadAttribute;
	}());
	exports.JSXSpreadAttribute = JSXSpreadAttribute;
	var JSXText = (function () {
	    function JSXText(value, raw) {
	        this.type = jsx_syntax_1.JSXSyntax.JSXText;
	        this.value = value;
	        this.raw = raw;
	    }
	    return JSXText;
	}());
	exports.JSXText = JSXText;


/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.JSXSyntax = {
	    JSXAttribute: 'JSXAttribute',
	    JSXClosingElement: 'JSXClosingElement',
	    JSXElement: 'JSXElement',
	    JSXEmptyExpression: 'JSXEmptyExpression',
	    JSXExpressionContainer: 'JSXExpressionContainer',
	    JSXIdentifier: 'JSXIdentifier',
	    JSXMemberExpression: 'JSXMemberExpression',
	    JSXNamespacedName: 'JSXNamespacedName',
	    JSXOpeningElement: 'JSXOpeningElement',
	    JSXSpreadAttribute: 'JSXSpreadAttribute',
	    JSXText: 'JSXText'
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var syntax_1 = __webpack_require__(2);
	/* tslint:disable:max-classes-per-file */
	var ArrayExpression = (function () {
	    function ArrayExpression(elements) {
	        this.type = syntax_1.Syntax.ArrayExpression;
	        this.elements = elements;
	    }
	    return ArrayExpression;
	}());
	exports.ArrayExpression = ArrayExpression;
	var ArrayPattern = (function () {
	    function ArrayPattern(elements) {
	        this.type = syntax_1.Syntax.ArrayPattern;
	        this.elements = elements;
	    }
	    return ArrayPattern;
	}());
	exports.ArrayPattern = ArrayPattern;
	var ArrowFunctionExpression = (function () {
	    function ArrowFunctionExpression(params, body, expression) {
	        this.type = syntax_1.Syntax.ArrowFunctionExpression;
	        this.id = null;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = expression;
	        this.async = false;
	    }
	    return ArrowFunctionExpression;
	}());
	exports.ArrowFunctionExpression = ArrowFunctionExpression;
	var AssignmentExpression = (function () {
	    function AssignmentExpression(operator, left, right) {
	        this.type = syntax_1.Syntax.AssignmentExpression;
	        this.operator = operator;
	        this.left = left;
	        this.right = right;
	    }
	    return AssignmentExpression;
	}());
	exports.AssignmentExpression = AssignmentExpression;
	var AssignmentPattern = (function () {
	    function AssignmentPattern(left, right) {
	        this.type = syntax_1.Syntax.AssignmentPattern;
	        this.left = left;
	        this.right = right;
	    }
	    return AssignmentPattern;
	}());
	exports.AssignmentPattern = AssignmentPattern;
	var AsyncArrowFunctionExpression = (function () {
	    function AsyncArrowFunctionExpression(params, body, expression) {
	        this.type = syntax_1.Syntax.ArrowFunctionExpression;
	        this.id = null;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = expression;
	        this.async = true;
	    }
	    return AsyncArrowFunctionExpression;
	}());
	exports.AsyncArrowFunctionExpression = AsyncArrowFunctionExpression;
	var AsyncFunctionDeclaration = (function () {
	    function AsyncFunctionDeclaration(id, params, body) {
	        this.type = syntax_1.Syntax.FunctionDeclaration;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = false;
	        this.async = true;
	    }
	    return AsyncFunctionDeclaration;
	}());
	exports.AsyncFunctionDeclaration = AsyncFunctionDeclaration;
	var AsyncFunctionExpression = (function () {
	    function AsyncFunctionExpression(id, params, body) {
	        this.type = syntax_1.Syntax.FunctionExpression;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = false;
	        this.expression = false;
	        this.async = true;
	    }
	    return AsyncFunctionExpression;
	}());
	exports.AsyncFunctionExpression = AsyncFunctionExpression;
	var AwaitExpression = (function () {
	    function AwaitExpression(argument) {
	        this.type = syntax_1.Syntax.AwaitExpression;
	        this.argument = argument;
	    }
	    return AwaitExpression;
	}());
	exports.AwaitExpression = AwaitExpression;
	var BinaryExpression = (function () {
	    function BinaryExpression(operator, left, right) {
	        var logical = (operator === '||' || operator === '&&');
	        this.type = logical ? syntax_1.Syntax.LogicalExpression : syntax_1.Syntax.BinaryExpression;
	        this.operator = operator;
	        this.left = left;
	        this.right = right;
	    }
	    return BinaryExpression;
	}());
	exports.BinaryExpression = BinaryExpression;
	var BlockStatement = (function () {
	    function BlockStatement(body) {
	        this.type = syntax_1.Syntax.BlockStatement;
	        this.body = body;
	    }
	    return BlockStatement;
	}());
	exports.BlockStatement = BlockStatement;
	var BreakStatement = (function () {
	    function BreakStatement(label) {
	        this.type = syntax_1.Syntax.BreakStatement;
	        this.label = label;
	    }
	    return BreakStatement;
	}());
	exports.BreakStatement = BreakStatement;
	var CallExpression = (function () {
	    function CallExpression(callee, args) {
	        this.type = syntax_1.Syntax.CallExpression;
	        this.callee = callee;
	        this.arguments = args;
	    }
	    return CallExpression;
	}());
	exports.CallExpression = CallExpression;
	var CatchClause = (function () {
	    function CatchClause(param, body) {
	        this.type = syntax_1.Syntax.CatchClause;
	        this.param = param;
	        this.body = body;
	    }
	    return CatchClause;
	}());
	exports.CatchClause = CatchClause;
	var ClassBody = (function () {
	    function ClassBody(body) {
	        this.type = syntax_1.Syntax.ClassBody;
	        this.body = body;
	    }
	    return ClassBody;
	}());
	exports.ClassBody = ClassBody;
	var ClassDeclaration = (function () {
	    function ClassDeclaration(id, superClass, body) {
	        this.type = syntax_1.Syntax.ClassDeclaration;
	        this.id = id;
	        this.superClass = superClass;
	        this.body = body;
	    }
	    return ClassDeclaration;
	}());
	exports.ClassDeclaration = ClassDeclaration;
	var ClassExpression = (function () {
	    function ClassExpression(id, superClass, body) {
	        this.type = syntax_1.Syntax.ClassExpression;
	        this.id = id;
	        this.superClass = superClass;
	        this.body = body;
	    }
	    return ClassExpression;
	}());
	exports.ClassExpression = ClassExpression;
	var ComputedMemberExpression = (function () {
	    function ComputedMemberExpression(object, property) {
	        this.type = syntax_1.Syntax.MemberExpression;
	        this.computed = true;
	        this.object = object;
	        this.property = property;
	    }
	    return ComputedMemberExpression;
	}());
	exports.ComputedMemberExpression = ComputedMemberExpression;
	var ConditionalExpression = (function () {
	    function ConditionalExpression(test, consequent, alternate) {
	        this.type = syntax_1.Syntax.ConditionalExpression;
	        this.test = test;
	        this.consequent = consequent;
	        this.alternate = alternate;
	    }
	    return ConditionalExpression;
	}());
	exports.ConditionalExpression = ConditionalExpression;
	var ContinueStatement = (function () {
	    function ContinueStatement(label) {
	        this.type = syntax_1.Syntax.ContinueStatement;
	        this.label = label;
	    }
	    return ContinueStatement;
	}());
	exports.ContinueStatement = ContinueStatement;
	var DebuggerStatement = (function () {
	    function DebuggerStatement() {
	        this.type = syntax_1.Syntax.DebuggerStatement;
	    }
	    return DebuggerStatement;
	}());
	exports.DebuggerStatement = DebuggerStatement;
	var Directive = (function () {
	    function Directive(expression, directive) {
	        this.type = syntax_1.Syntax.ExpressionStatement;
	        this.expression = expression;
	        this.directive = directive;
	    }
	    return Directive;
	}());
	exports.Directive = Directive;
	var DoWhileStatement = (function () {
	    function DoWhileStatement(body, test) {
	        this.type = syntax_1.Syntax.DoWhileStatement;
	        this.body = body;
	        this.test = test;
	    }
	    return DoWhileStatement;
	}());
	exports.DoWhileStatement = DoWhileStatement;
	var EmptyStatement = (function () {
	    function EmptyStatement() {
	        this.type = syntax_1.Syntax.EmptyStatement;
	    }
	    return EmptyStatement;
	}());
	exports.EmptyStatement = EmptyStatement;
	var ExportAllDeclaration = (function () {
	    function ExportAllDeclaration(source) {
	        this.type = syntax_1.Syntax.ExportAllDeclaration;
	        this.source = source;
	    }
	    return ExportAllDeclaration;
	}());
	exports.ExportAllDeclaration = ExportAllDeclaration;
	var ExportDefaultDeclaration = (function () {
	    function ExportDefaultDeclaration(declaration) {
	        this.type = syntax_1.Syntax.ExportDefaultDeclaration;
	        this.declaration = declaration;
	    }
	    return ExportDefaultDeclaration;
	}());
	exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
	var ExportNamedDeclaration = (function () {
	    function ExportNamedDeclaration(declaration, specifiers, source) {
	        this.type = syntax_1.Syntax.ExportNamedDeclaration;
	        this.declaration = declaration;
	        this.specifiers = specifiers;
	        this.source = source;
	    }
	    return ExportNamedDeclaration;
	}());
	exports.ExportNamedDeclaration = ExportNamedDeclaration;
	var ExportSpecifier = (function () {
	    function ExportSpecifier(local, exported) {
	        this.type = syntax_1.Syntax.ExportSpecifier;
	        this.exported = exported;
	        this.local = local;
	    }
	    return ExportSpecifier;
	}());
	exports.ExportSpecifier = ExportSpecifier;
	var ExpressionStatement = (function () {
	    function ExpressionStatement(expression) {
	        this.type = syntax_1.Syntax.ExpressionStatement;
	        this.expression = expression;
	    }
	    return ExpressionStatement;
	}());
	exports.ExpressionStatement = ExpressionStatement;
	var ForInStatement = (function () {
	    function ForInStatement(left, right, body) {
	        this.type = syntax_1.Syntax.ForInStatement;
	        this.left = left;
	        this.right = right;
	        this.body = body;
	        this.each = false;
	    }
	    return ForInStatement;
	}());
	exports.ForInStatement = ForInStatement;
	var ForOfStatement = (function () {
	    function ForOfStatement(left, right, body) {
	        this.type = syntax_1.Syntax.ForOfStatement;
	        this.left = left;
	        this.right = right;
	        this.body = body;
	    }
	    return ForOfStatement;
	}());
	exports.ForOfStatement = ForOfStatement;
	var ForStatement = (function () {
	    function ForStatement(init, test, update, body) {
	        this.type = syntax_1.Syntax.ForStatement;
	        this.init = init;
	        this.test = test;
	        this.update = update;
	        this.body = body;
	    }
	    return ForStatement;
	}());
	exports.ForStatement = ForStatement;
	var FunctionDeclaration = (function () {
	    function FunctionDeclaration(id, params, body, generator) {
	        this.type = syntax_1.Syntax.FunctionDeclaration;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = generator;
	        this.expression = false;
	        this.async = false;
	    }
	    return FunctionDeclaration;
	}());
	exports.FunctionDeclaration = FunctionDeclaration;
	var FunctionExpression = (function () {
	    function FunctionExpression(id, params, body, generator) {
	        this.type = syntax_1.Syntax.FunctionExpression;
	        this.id = id;
	        this.params = params;
	        this.body = body;
	        this.generator = generator;
	        this.expression = false;
	        this.async = false;
	    }
	    return FunctionExpression;
	}());
	exports.FunctionExpression = FunctionExpression;
	var Identifier = (function () {
	    function Identifier(name) {
	        this.type = syntax_1.Syntax.Identifier;
	        this.name = name;
	    }
	    return Identifier;
	}());
	exports.Identifier = Identifier;
	var IfStatement = (function () {
	    function IfStatement(test, consequent, alternate) {
	        this.type = syntax_1.Syntax.IfStatement;
	        this.test = test;
	        this.consequent = consequent;
	        this.alternate = alternate;
	    }
	    return IfStatement;
	}());
	exports.IfStatement = IfStatement;
	var ImportDeclaration = (function () {
	    function ImportDeclaration(specifiers, source) {
	        this.type = syntax_1.Syntax.ImportDeclaration;
	        this.specifiers = specifiers;
	        this.source = source;
	    }
	    return ImportDeclaration;
	}());
	exports.ImportDeclaration = ImportDeclaration;
	var ImportDefaultSpecifier = (function () {
	    function ImportDefaultSpecifier(local) {
	        this.type = syntax_1.Syntax.ImportDefaultSpecifier;
	        this.local = local;
	    }
	    return ImportDefaultSpecifier;
	}());
	exports.ImportDefaultSpecifier = ImportDefaultSpecifier;
	var ImportNamespaceSpecifier = (function () {
	    function ImportNamespaceSpecifier(local) {
	        this.type = syntax_1.Syntax.ImportNamespaceSpecifier;
	        this.local = local;
	    }
	    return ImportNamespaceSpecifier;
	}());
	exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier;
	var ImportSpecifier = (function () {
	    function ImportSpecifier(local, imported) {
	        this.type = syntax_1.Syntax.ImportSpecifier;
	        this.local = local;
	        this.imported = imported;
	    }
	    return ImportSpecifier;
	}());
	exports.ImportSpecifier = ImportSpecifier;
	var LabeledStatement = (function () {
	    function LabeledStatement(label, body) {
	        this.type = syntax_1.Syntax.LabeledStatement;
	        this.label = label;
	        this.body = body;
	    }
	    return LabeledStatement;
	}());
	exports.LabeledStatement = LabeledStatement;
	var Literal = (function () {
	    function Literal(value, raw) {
	        this.type = syntax_1.Syntax.Literal;
	        this.value = value;
	        this.raw = raw;
	    }
	    return Literal;
	}());
	exports.Literal = Literal;
	var MetaProperty = (function () {
	    function MetaProperty(meta, property) {
	        this.type = syntax_1.Syntax.MetaProperty;
	        this.meta = meta;
	        this.property = property;
	    }
	    return MetaProperty;
	}());
	exports.MetaProperty = MetaProperty;
	var MethodDefinition = (function () {
	    function MethodDefinition(key, computed, value, kind, isStatic) {
	        this.type = syntax_1.Syntax.MethodDefinition;
	        this.key = key;
	        this.computed = computed;
	        this.value = value;
	        this.kind = kind;
	        this.static = isStatic;
	    }
	    return MethodDefinition;
	}());
	exports.MethodDefinition = MethodDefinition;
	var Module = (function () {
	    function Module(body) {
	        this.type = syntax_1.Syntax.Program;
	        this.body = body;
	        this.sourceType = 'module';
	    }
	    return Module;
	}());
	exports.Module = Module;
	var NewExpression = (function () {
	    function NewExpression(callee, args) {
	        this.type = syntax_1.Syntax.NewExpression;
	        this.callee = callee;
	        this.arguments = args;
	    }
	    return NewExpression;
	}());
	exports.NewExpression = NewExpression;
	var ObjectExpression = (function () {
	    function ObjectExpression(properties) {
	        this.type = syntax_1.Syntax.ObjectExpression;
	        this.properties = properties;
	    }
	    return ObjectExpression;
	}());
	exports.ObjectExpression = ObjectExpression;
	var ObjectPattern = (function () {
	    function ObjectPattern(properties) {
	        this.type = syntax_1.Syntax.ObjectPattern;
	        this.properties = properties;
	    }
	    return ObjectPattern;
	}());
	exports.ObjectPattern = ObjectPattern;
	var Property = (function () {
	    function Property(kind, key, computed, value, method, shorthand) {
	        this.type = syntax_1.Syntax.Property;
	        this.key = key;
	        this.computed = computed;
	        this.value = value;
	        this.kind = kind;
	        this.method = method;
	        this.shorthand = shorthand;
	    }
	    return Property;
	}());
	exports.Property = Property;
	var RegexLiteral = (function () {
	    function RegexLiteral(value, raw, pattern, flags) {
	        this.type = syntax_1.Syntax.Literal;
	        this.value = value;
	        this.raw = raw;
	        this.regex = { pattern: pattern, flags: flags };
	    }
	    return RegexLiteral;
	}());
	exports.RegexLiteral = RegexLiteral;
	var RestElement = (function () {
	    function RestElement(argument) {
	        this.type = syntax_1.Syntax.RestElement;
	        this.argument = argument;
	    }
	    return RestElement;
	}());
	exports.RestElement = RestElement;
	var ReturnStatement = (function () {
	    function ReturnStatement(argument) {
	        this.type = syntax_1.Syntax.ReturnStatement;
	        this.argument = argument;
	    }
	    return ReturnStatement;
	}());
	exports.ReturnStatement = ReturnStatement;
	var Script = (function () {
	    function Script(body) {
	        this.type = syntax_1.Syntax.Program;
	        this.body = body;
	        this.sourceType = 'script';
	    }
	    return Script;
	}());
	exports.Script = Script;
	var SequenceExpression = (function () {
	    function SequenceExpression(expressions) {
	        this.type = syntax_1.Syntax.SequenceExpression;
	        this.expressions = expressions;
	    }
	    return SequenceExpression;
	}());
	exports.SequenceExpression = SequenceExpression;
	var SpreadElement = (function () {
	    function SpreadElement(argument) {
	        this.type = syntax_1.Syntax.SpreadElement;
	        this.argument = argument;
	    }
	    return SpreadElement;
	}());
	exports.SpreadElement = SpreadElement;
	var StaticMemberExpression = (function () {
	    function StaticMemberExpression(object, property) {
	        this.type = syntax_1.Syntax.MemberExpression;
	        this.computed = false;
	        this.object = object;
	        this.property = property;
	    }
	    return StaticMemberExpression;
	}());
	exports.StaticMemberExpression = StaticMemberExpression;
	var Super = (function () {
	    function Super() {
	        this.type = syntax_1.Syntax.Super;
	    }
	    return Super;
	}());
	exports.Super = Super;
	var SwitchCase = (function () {
	    function SwitchCase(test, consequent) {
	        this.type = syntax_1.Syntax.SwitchCase;
	        this.test = test;
	        this.consequent = consequent;
	    }
	    return SwitchCase;
	}());
	exports.SwitchCase = SwitchCase;
	var SwitchStatement = (function () {
	    function SwitchStatement(discriminant, cases) {
	        this.type = syntax_1.Syntax.SwitchStatement;
	        this.discriminant = discriminant;
	        this.cases = cases;
	    }
	    return SwitchStatement;
	}());
	exports.SwitchStatement = SwitchStatement;
	var TaggedTemplateExpression = (function () {
	    function TaggedTemplateExpression(tag, quasi) {
	        this.type = syntax_1.Syntax.TaggedTemplateExpression;
	        this.tag = tag;
	        this.quasi = quasi;
	    }
	    return TaggedTemplateExpression;
	}());
	exports.TaggedTemplateExpression = TaggedTemplateExpression;
	var TemplateElement = (function () {
	    function TemplateElement(value, tail) {
	        this.type = syntax_1.Syntax.TemplateElement;
	        this.value = value;
	        this.tail = tail;
	    }
	    return TemplateElement;
	}());
	exports.TemplateElement = TemplateElement;
	var TemplateLiteral = (function () {
	    function TemplateLiteral(quasis, expressions) {
	        this.type = syntax_1.Syntax.TemplateLiteral;
	        this.quasis = quasis;
	        this.expressions = expressions;
	    }
	    return TemplateLiteral;
	}());
	exports.TemplateLiteral = TemplateLiteral;
	var ThisExpression = (function () {
	    function ThisExpression() {
	        this.type = syntax_1.Syntax.ThisExpression;
	    }
	    return ThisExpression;
	}());
	exports.ThisExpression = ThisExpression;
	var ThrowStatement = (function () {
	    function ThrowStatement(argument) {
	        this.type = syntax_1.Syntax.ThrowStatement;
	        this.argument = argument;
	    }
	    return ThrowStatement;
	}());
	exports.ThrowStatement = ThrowStatement;
	var TryStatement = (function () {
	    function TryStatement(block, handler, finalizer) {
	        this.type = syntax_1.Syntax.TryStatement;
	        this.block = block;
	        this.handler = handler;
	        this.finalizer = finalizer;
	    }
	    return TryStatement;
	}());
	exports.TryStatement = TryStatement;
	var UnaryExpression = (function () {
	    function UnaryExpression(operator, argument) {
	        this.type = syntax_1.Syntax.UnaryExpression;
	        this.operator = operator;
	        this.argument = argument;
	        this.prefix = true;
	    }
	    return UnaryExpression;
	}());
	exports.UnaryExpression = UnaryExpression;
	var UpdateExpression = (function () {
	    function UpdateExpression(operator, argument, prefix) {
	        this.type = syntax_1.Syntax.UpdateExpression;
	        this.operator = operator;
	        this.argument = argument;
	        this.prefix = prefix;
	    }
	    return UpdateExpression;
	}());
	exports.UpdateExpression = UpdateExpression;
	var VariableDeclaration = (function () {
	    function VariableDeclaration(declarations, kind) {
	        this.type = syntax_1.Syntax.VariableDeclaration;
	        this.declarations = declarations;
	        this.kind = kind;
	    }
	    return VariableDeclaration;
	}());
	exports.VariableDeclaration = VariableDeclaration;
	var VariableDeclarator = (function () {
	    function VariableDeclarator(id, init) {
	        this.type = syntax_1.Syntax.VariableDeclarator;
	        this.id = id;
	        this.init = init;
	    }
	    return VariableDeclarator;
	}());
	exports.VariableDeclarator = VariableDeclarator;
	var WhileStatement = (function () {
	    function WhileStatement(test, body) {
	        this.type = syntax_1.Syntax.WhileStatement;
	        this.test = test;
	        this.body = body;
	    }
	    return WhileStatement;
	}());
	exports.WhileStatement = WhileStatement;
	var WithStatement = (function () {
	    function WithStatement(object, body) {
	        this.type = syntax_1.Syntax.WithStatement;
	        this.object = object;
	        this.body = body;
	    }
	    return WithStatement;
	}());
	exports.WithStatement = WithStatement;
	var YieldExpression = (function () {
	    function YieldExpression(argument, delegate) {
	        this.type = syntax_1.Syntax.YieldExpression;
	        this.argument = argument;
	        this.delegate = delegate;
	    }
	    return YieldExpression;
	}());
	exports.YieldExpression = YieldExpression;


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var assert_1 = __webpack_require__(9);
	var error_handler_1 = __webpack_require__(10);
	var messages_1 = __webpack_require__(11);
	var Node = __webpack_require__(7);
	var scanner_1 = __webpack_require__(12);
	var syntax_1 = __webpack_require__(2);
	var token_1 = __webpack_require__(13);
	var ArrowParameterPlaceHolder = 'ArrowParameterPlaceHolder';
	var Parser = (function () {
	    function Parser(code, options, delegate) {
	        if (options === void 0) { options = {}; }
	        this.config = {
	            range: (typeof options.range === 'boolean') && options.range,
	            loc: (typeof options.loc === 'boolean') && options.loc,
	            source: null,
	            tokens: (typeof options.tokens === 'boolean') && options.tokens,
	            comment: (typeof options.comment === 'boolean') && options.comment,
	            tolerant: (typeof options.tolerant === 'boolean') && options.tolerant
	        };
	        if (this.config.loc && options.source && options.source !== null) {
	            this.config.source = String(options.source);
	        }
	        this.delegate = delegate;
	        this.errorHandler = new error_handler_1.ErrorHandler();
	        this.errorHandler.tolerant = this.config.tolerant;
	        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
	        this.scanner.trackComment = this.config.comment;
	        this.operatorPrecedence = {
	            ')': 0,
	            ';': 0,
	            ',': 0,
	            '=': 0,
	            ']': 0,
	            '||': 1,
	            '&&': 2,
	            '|': 3,
	            '^': 4,
	            '&': 5,
	            '==': 6,
	            '!=': 6,
	            '===': 6,
	            '!==': 6,
	            '<': 7,
	            '>': 7,
	            '<=': 7,
	            '>=': 7,
	            '<<': 8,
	            '>>': 8,
	            '>>>': 8,
	            '+': 9,
	            '-': 9,
	            '*': 11,
	            '/': 11,
	            '%': 11
	        };
	        this.lookahead = {
	            type: 2 /* EOF */,
	            value: '',
	            lineNumber: this.scanner.lineNumber,
	            lineStart: 0,
	            start: 0,
	            end: 0
	        };
	        this.hasLineTerminator = false;
	        this.context = {
	            isModule: false,
	            await: false,
	            allowIn: true,
	            allowStrictDirective: true,
	            allowYield: true,
	            firstCoverInitializedNameError: null,
	            isAssignmentTarget: false,
	            isBindingElement: false,
	            inFunctionBody: false,
	            inIteration: false,
	            inSwitch: false,
	            labelSet: {},
	            strict: false
	        };
	        this.tokens = [];
	        this.startMarker = {
	            index: 0,
	            line: this.scanner.lineNumber,
	            column: 0
	        };
	        this.lastMarker = {
	            index: 0,
	            line: this.scanner.lineNumber,
	            column: 0
	        };
	        this.nextToken();
	        this.lastMarker = {
	            index: this.scanner.index,
	            line: this.scanner.lineNumber,
	            column: this.scanner.index - this.scanner.lineStart
	        };
	    }
	    Parser.prototype.throwError = function (messageFormat) {
	        var values = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            values[_i - 1] = arguments[_i];
	        }
	        var args = Array.prototype.slice.call(arguments, 1);
	        var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
	            assert_1.assert(idx < args.length, 'Message reference must be in range');
	            return args[idx];
	        });
	        var index = this.lastMarker.index;
	        var line = this.lastMarker.line;
	        var column = this.lastMarker.column + 1;
	        throw this.errorHandler.createError(index, line, column, msg);
	    };
	    Parser.prototype.tolerateError = function (messageFormat) {
	        var values = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            values[_i - 1] = arguments[_i];
	        }
	        var args = Array.prototype.slice.call(arguments, 1);
	        var msg = messageFormat.replace(/%(\d)/g, function (whole, idx) {
	            assert_1.assert(idx < args.length, 'Message reference must be in range');
	            return args[idx];
	        });
	        var index = this.lastMarker.index;
	        var line = this.scanner.lineNumber;
	        var column = this.lastMarker.column + 1;
	        this.errorHandler.tolerateError(index, line, column, msg);
	    };
	    // Throw an exception because of the token.
	    Parser.prototype.unexpectedTokenError = function (token, message) {
	        var msg = message || messages_1.Messages.UnexpectedToken;
	        var value;
	        if (token) {
	            if (!message) {
	                msg = (token.type === 2 /* EOF */) ? messages_1.Messages.UnexpectedEOS :
	                    (token.type === 3 /* Identifier */) ? messages_1.Messages.UnexpectedIdentifier :
	                        (token.type === 6 /* NumericLiteral */) ? messages_1.Messages.UnexpectedNumber :
	                            (token.type === 8 /* StringLiteral */) ? messages_1.Messages.UnexpectedString :
	                                (token.type === 10 /* Template */) ? messages_1.Messages.UnexpectedTemplate :
	                                    messages_1.Messages.UnexpectedToken;
	                if (token.type === 4 /* Keyword */) {
	                    if (this.scanner.isFutureReservedWord(token.value)) {
	                        msg = messages_1.Messages.UnexpectedReserved;
	                    }
	                    else if (this.context.strict && this.scanner.isStrictModeReservedWord(token.value)) {
	                        msg = messages_1.Messages.StrictReservedWord;
	                    }
	                }
	            }
	            value = token.value;
	        }
	        else {
	            value = 'ILLEGAL';
	        }
	        msg = msg.replace('%0', value);
	        if (token && typeof token.lineNumber === 'number') {
	            var index = token.start;
	            var line = token.lineNumber;
	            var lastMarkerLineStart = this.lastMarker.index - this.lastMarker.column;
	            var column = token.start - lastMarkerLineStart + 1;
	            return this.errorHandler.createError(index, line, column, msg);
	        }
	        else {
	            var index = this.lastMarker.index;
	            var line = this.lastMarker.line;
	            var column = this.lastMarker.column + 1;
	            return this.errorHandler.createError(index, line, column, msg);
	        }
	    };
	    Parser.prototype.throwUnexpectedToken = function (token, message) {
	        throw this.unexpectedTokenError(token, message);
	    };
	    Parser.prototype.tolerateUnexpectedToken = function (token, message) {
	        this.errorHandler.tolerate(this.unexpectedTokenError(token, message));
	    };
	    Parser.prototype.collectComments = function () {
	        if (!this.config.comment) {
	            this.scanner.scanComments();
	        }
	        else {
	            var comments = this.scanner.scanComments();
	            if (comments.length > 0 && this.delegate) {
	                for (var i = 0; i < comments.length; ++i) {
	                    var e = comments[i];
	                    var node = void 0;
	                    node = {
	                        type: e.multiLine ? 'BlockComment' : 'LineComment',
	                        value: this.scanner.source.slice(e.slice[0], e.slice[1])
	                    };
	                    if (this.config.range) {
	                        node.range = e.range;
	                    }
	                    if (this.config.loc) {
	                        node.loc = e.loc;
	                    }
	                    var metadata = {
	                        start: {
	                            line: e.loc.start.line,
	                            column: e.loc.start.column,
	                            offset: e.range[0]
	                        },
	                        end: {
	                            line: e.loc.end.line,
	                            column: e.loc.end.column,
	                            offset: e.range[1]
	                        }
	                    };
	                    this.delegate(node, metadata);
	                }
	            }
	        }
	    };
	    // From internal representation to an external structure
	    Parser.prototype.getTokenRaw = function (token) {
	        return this.scanner.source.slice(token.start, token.end);
	    };
	    Parser.prototype.convertToken = function (token) {
	        var t = {
	            type: token_1.TokenName[token.type],
	            value: this.getTokenRaw(token)
	        };
	        if (this.config.range) {
	            t.range = [token.start, token.end];
	        }
	        if (this.config.loc) {
	            t.loc = {
	                start: {
	                    line: this.startMarker.line,
	                    column: this.startMarker.column
	                },
	                end: {
	                    line: this.scanner.lineNumber,
	                    column: this.scanner.index - this.scanner.lineStart
	                }
	            };
	        }
	        if (token.type === 9 /* RegularExpression */) {
	            var pattern = token.pattern;
	            var flags = token.flags;
	            t.regex = { pattern: pattern, flags: flags };
	        }
	        return t;
	    };
	    Parser.prototype.nextToken = function () {
	        var token = this.lookahead;
	        this.lastMarker.index = this.scanner.index;
	        this.lastMarker.line = this.scanner.lineNumber;
	        this.lastMarker.column = this.scanner.index - this.scanner.lineStart;
	        this.collectComments();
	        if (this.scanner.index !== this.startMarker.index) {
	            this.startMarker.index = this.scanner.index;
	            this.startMarker.line = this.scanner.lineNumber;
	            this.startMarker.column = this.scanner.index - this.scanner.lineStart;
	        }
	        var next = this.scanner.lex();
	        this.hasLineTerminator = (token.lineNumber !== next.lineNumber);
	        if (next && this.context.strict && next.type === 3 /* Identifier */) {
	            if (this.scanner.isStrictModeReservedWord(next.value)) {
	                next.type = 4 /* Keyword */;
	            }
	        }
	        this.lookahead = next;
	        if (this.config.tokens && next.type !== 2 /* EOF */) {
	            this.tokens.push(this.convertToken(next));
	        }
	        return token;
	    };
	    Parser.prototype.nextRegexToken = function () {
	        this.collectComments();
	        var token = this.scanner.scanRegExp();
	        if (this.config.tokens) {
	            // Pop the previous token, '/' or '/='
	            // This is added from the lookahead token.
	            this.tokens.pop();
	            this.tokens.push(this.convertToken(token));
	        }
	        // Prime the next lookahead.
	        this.lookahead = token;
	        this.nextToken();
	        return token;
	    };
	    Parser.prototype.createNode = function () {
	        return {
	            index: this.startMarker.index,
	            line: this.startMarker.line,
	            column: this.startMarker.column
	        };
	    };
	    Parser.prototype.startNode = function (token) {
	        return {
	            index: token.start,
	            line: token.lineNumber,
	            column: token.start - token.lineStart
	        };
	    };
	    Parser.prototype.finalize = function (marker, node) {
	        if (this.config.range) {
	            node.range = [marker.index, this.lastMarker.index];
	        }
	        if (this.config.loc) {
	            node.loc = {
	                start: {
	                    line: marker.line,
	                    column: marker.column,
	                },
	                end: {
	                    line: this.lastMarker.line,
	                    column: this.lastMarker.column
	                }
	            };
	            if (this.config.source) {
	                node.loc.source = this.config.source;
	            }
	        }
	        if (this.delegate) {
	            var metadata = {
	                start: {
	                    line: marker.line,
	                    column: marker.column,
	                    offset: marker.index
	                },
	                end: {
	                    line: this.lastMarker.line,
	                    column: this.lastMarker.column,
	                    offset: this.lastMarker.index
	                }
	            };
	            this.delegate(node, metadata);
	        }
	        return node;
	    };
	    // Expect the next token to match the specified punctuator.
	    // If not, an exception will be thrown.
	    Parser.prototype.expect = function (value) {
	        var token = this.nextToken();
	        if (token.type !== 7 /* Punctuator */ || token.value !== value) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Quietly expect a comma when in tolerant mode, otherwise delegates to expect().
	    Parser.prototype.expectCommaSeparator = function () {
	        if (this.config.tolerant) {
	            var token = this.lookahead;
	            if (token.type === 7 /* Punctuator */ && token.value === ',') {
	                this.nextToken();
	            }
	            else if (token.type === 7 /* Punctuator */ && token.value === ';') {
	                this.nextToken();
	                this.tolerateUnexpectedToken(token);
	            }
	            else {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.UnexpectedToken);
	            }
	        }
	        else {
	            this.expect(',');
	        }
	    };
	    // Expect the next token to match the specified keyword.
	    // If not, an exception will be thrown.
	    Parser.prototype.expectKeyword = function (keyword) {
	        var token = this.nextToken();
	        if (token.type !== 4 /* Keyword */ || token.value !== keyword) {
	            this.throwUnexpectedToken(token);
	        }
	    };
	    // Return true if the next token matches the specified punctuator.
	    Parser.prototype.match = function (value) {
	        return this.lookahead.type === 7 /* Punctuator */ && this.lookahead.value === value;
	    };
	    // Return true if the next token matches the specified keyword
	    Parser.prototype.matchKeyword = function (keyword) {
	        return this.lookahead.type === 4 /* Keyword */ && this.lookahead.value === keyword;
	    };
	    // Return true if the next token matches the specified contextual keyword
	    // (where an identifier is sometimes a keyword depending on the context)
	    Parser.prototype.matchContextualKeyword = function (keyword) {
	        return this.lookahead.type === 3 /* Identifier */ && this.lookahead.value === keyword;
	    };
	    // Return true if the next token is an assignment operator
	    Parser.prototype.matchAssign = function () {
	        if (this.lookahead.type !== 7 /* Punctuator */) {
	            return false;
	        }
	        var op = this.lookahead.value;
	        return op === '=' ||
	            op === '*=' ||
	            op === '**=' ||
	            op === '/=' ||
	            op === '%=' ||
	            op === '+=' ||
	            op === '-=' ||
	            op === '<<=' ||
	            op === '>>=' ||
	            op === '>>>=' ||
	            op === '&=' ||
	            op === '^=' ||
	            op === '|=';
	    };
	    // Cover grammar support.
	    //
	    // When an assignment expression position starts with an left parenthesis, the determination of the type
	    // of the syntax is to be deferred arbitrarily long until the end of the parentheses pair (plus a lookahead)
	    // or the first comma. This situation also defers the determination of all the expressions nested in the pair.
	    //
	    // There are three productions that can be parsed in a parentheses pair that needs to be determined
	    // after the outermost pair is closed. They are:
	    //
	    //   1. AssignmentExpression
	    //   2. BindingElements
	    //   3. AssignmentTargets
	    //
	    // In order to avoid exponential backtracking, we use two flags to denote if the production can be
	    // binding element or assignment target.
	    //
	    // The three productions have the relationship:
	    //
	    //   BindingElements ⊆ AssignmentTargets ⊆ AssignmentExpression
	    //
	    // with a single exception that CoverInitializedName when used directly in an Expression, generates
	    // an early error. Therefore, we need the third state, firstCoverInitializedNameError, to track the
	    // first usage of CoverInitializedName and report it when we reached the end of the parentheses pair.
	    //
	    // isolateCoverGrammar function runs the given parser function with a new cover grammar context, and it does not
	    // effect the current flags. This means the production the parser parses is only used as an expression. Therefore
	    // the CoverInitializedName check is conducted.
	    //
	    // inheritCoverGrammar function runs the given parse function with a new cover grammar context, and it propagates
	    // the flags outside of the parser. This means the production the parser parses is used as a part of a potential
	    // pattern. The CoverInitializedName check is deferred.
	    Parser.prototype.isolateCoverGrammar = function (parseFunction) {
	        var previousIsBindingElement = this.context.isBindingElement;
	        var previousIsAssignmentTarget = this.context.isAssignmentTarget;
	        var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
	        this.context.isBindingElement = true;
	        this.context.isAssignmentTarget = true;
	        this.context.firstCoverInitializedNameError = null;
	        var result = parseFunction.call(this);
	        if (this.context.firstCoverInitializedNameError !== null) {
	            this.throwUnexpectedToken(this.context.firstCoverInitializedNameError);
	        }
	        this.context.isBindingElement = previousIsBindingElement;
	        this.context.isAssignmentTarget = previousIsAssignmentTarget;
	        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError;
	        return result;
	    };
	    Parser.prototype.inheritCoverGrammar = function (parseFunction) {
	        var previousIsBindingElement = this.context.isBindingElement;
	        var previousIsAssignmentTarget = this.context.isAssignmentTarget;
	        var previousFirstCoverInitializedNameError = this.context.firstCoverInitializedNameError;
	        this.context.isBindingElement = true;
	        this.context.isAssignmentTarget = true;
	        this.context.firstCoverInitializedNameError = null;
	        var result = parseFunction.call(this);
	        this.context.isBindingElement = this.context.isBindingElement && previousIsBindingElement;
	        this.context.isAssignmentTarget = this.context.isAssignmentTarget && previousIsAssignmentTarget;
	        this.context.firstCoverInitializedNameError = previousFirstCoverInitializedNameError || this.context.firstCoverInitializedNameError;
	        return result;
	    };
	    Parser.prototype.consumeSemicolon = function () {
	        if (this.match(';')) {
	            this.nextToken();
	        }
	        else if (!this.hasLineTerminator) {
	            if (this.lookahead.type !== 2 /* EOF */ && !this.match('}')) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            this.lastMarker.index = this.startMarker.index;
	            this.lastMarker.line = this.startMarker.line;
	            this.lastMarker.column = this.startMarker.column;
	        }
	    };
	    // https://tc39.github.io/ecma262/#sec-primary-expression
	    Parser.prototype.parsePrimaryExpression = function () {
	        var node = this.createNode();
	        var expr;
	        var token, raw;
	        switch (this.lookahead.type) {
	            case 3 /* Identifier */:
	                if ((this.context.isModule || this.context.await) && this.lookahead.value === 'await') {
	                    this.tolerateUnexpectedToken(this.lookahead);
	                }
	                expr = this.matchAsyncFunction() ? this.parseFunctionExpression() : this.finalize(node, new Node.Identifier(this.nextToken().value));
	                break;
	            case 6 /* NumericLiteral */:
	            case 8 /* StringLiteral */:
	                if (this.context.strict && this.lookahead.octal) {
	                    this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.StrictOctalLiteral);
	                }
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(token.value, raw));
	                break;
	            case 1 /* BooleanLiteral */:
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(token.value === 'true', raw));
	                break;
	            case 5 /* NullLiteral */:
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                token = this.nextToken();
	                raw = this.getTokenRaw(token);
	                expr = this.finalize(node, new Node.Literal(null, raw));
	                break;
	            case 10 /* Template */:
	                expr = this.parseTemplateLiteral();
	                break;
	            case 7 /* Punctuator */:
	                switch (this.lookahead.value) {
	                    case '(':
	                        this.context.isBindingElement = false;
	                        expr = this.inheritCoverGrammar(this.parseGroupExpression);
	                        break;
	                    case '[':
	                        expr = this.inheritCoverGrammar(this.parseArrayInitializer);
	                        break;
	                    case '{':
	                        expr = this.inheritCoverGrammar(this.parseObjectInitializer);
	                        break;
	                    case '/':
	                    case '/=':
	                        this.context.isAssignmentTarget = false;
	                        this.context.isBindingElement = false;
	                        this.scanner.index = this.startMarker.index;
	                        token = this.nextRegexToken();
	                        raw = this.getTokenRaw(token);
	                        expr = this.finalize(node, new Node.RegexLiteral(token.regex, raw, token.pattern, token.flags));
	                        break;
	                    default:
	                        expr = this.throwUnexpectedToken(this.nextToken());
	                }
	                break;
	            case 4 /* Keyword */:
	                if (!this.context.strict && this.context.allowYield && this.matchKeyword('yield')) {
	                    expr = this.parseIdentifierName();
	                }
	                else if (!this.context.strict && this.matchKeyword('let')) {
	                    expr = this.finalize(node, new Node.Identifier(this.nextToken().value));
	                }
	                else {
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    if (this.matchKeyword('function')) {
	                        expr = this.parseFunctionExpression();
	                    }
	                    else if (this.matchKeyword('this')) {
	                        this.nextToken();
	                        expr = this.finalize(node, new Node.ThisExpression());
	                    }
	                    else if (this.matchKeyword('class')) {
	                        expr = this.parseClassExpression();
	                    }
	                    else {
	                        expr = this.throwUnexpectedToken(this.nextToken());
	                    }
	                }
	                break;
	            default:
	                expr = this.throwUnexpectedToken(this.nextToken());
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-array-initializer
	    Parser.prototype.parseSpreadElement = function () {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.inheritCoverGrammar(this.parseAssignmentExpression);
	        return this.finalize(node, new Node.SpreadElement(arg));
	    };
	    Parser.prototype.parseArrayInitializer = function () {
	        var node = this.createNode();
	        var elements = [];
	        this.expect('[');
	        while (!this.match(']')) {
	            if (this.match(',')) {
	                this.nextToken();
	                elements.push(null);
	            }
	            else if (this.match('...')) {
	                var element = this.parseSpreadElement();
	                if (!this.match(']')) {
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    this.expect(',');
	                }
	                elements.push(element);
	            }
	            else {
	                elements.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
	                if (!this.match(']')) {
	                    this.expect(',');
	                }
	            }
	        }
	        this.expect(']');
	        return this.finalize(node, new Node.ArrayExpression(elements));
	    };
	    // https://tc39.github.io/ecma262/#sec-object-initializer
	    Parser.prototype.parsePropertyMethod = function (params) {
	        this.context.isAssignmentTarget = false;
	        this.context.isBindingElement = false;
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = params.simple;
	        var body = this.isolateCoverGrammar(this.parseFunctionSourceElements);
	        if (this.context.strict && params.firstRestricted) {
	            this.tolerateUnexpectedToken(params.firstRestricted, params.message);
	        }
	        if (this.context.strict && params.stricted) {
	            this.tolerateUnexpectedToken(params.stricted, params.message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        return body;
	    };
	    Parser.prototype.parsePropertyMethodFunction = function () {
	        var isGenerator = false;
	        var node = this.createNode();
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = false;
	        var params = this.parseFormalParameters();
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	    };
	    Parser.prototype.parsePropertyMethodAsyncFunction = function () {
	        var node = this.createNode();
	        var previousAllowYield = this.context.allowYield;
	        var previousAwait = this.context.await;
	        this.context.allowYield = false;
	        this.context.await = true;
	        var params = this.parseFormalParameters();
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        this.context.await = previousAwait;
	        return this.finalize(node, new Node.AsyncFunctionExpression(null, params.params, method));
	    };
	    Parser.prototype.parseObjectPropertyKey = function () {
	        var node = this.createNode();
	        var token = this.nextToken();
	        var key;
	        switch (token.type) {
	            case 8 /* StringLiteral */:
	            case 6 /* NumericLiteral */:
	                if (this.context.strict && token.octal) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictOctalLiteral);
	                }
	                var raw = this.getTokenRaw(token);
	                key = this.finalize(node, new Node.Literal(token.value, raw));
	                break;
	            case 3 /* Identifier */:
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 4 /* Keyword */:
	                key = this.finalize(node, new Node.Identifier(token.value));
	                break;
	            case 7 /* Punctuator */:
	                if (token.value === '[') {
	                    key = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    this.expect(']');
	                }
	                else {
	                    key = this.throwUnexpectedToken(token);
	                }
	                break;
	            default:
	                key = this.throwUnexpectedToken(token);
	        }
	        return key;
	    };
	    Parser.prototype.isPropertyKey = function (key, value) {
	        return (key.type === syntax_1.Syntax.Identifier && key.name === value) ||
	            (key.type === syntax_1.Syntax.Literal && key.value === value);
	    };
	    Parser.prototype.parseObjectProperty = function (hasProto) {
	        var node = this.createNode();
	        var token = this.lookahead;
	        var kind;
	        var key = null;
	        var value = null;
	        var computed = false;
	        var method = false;
	        var shorthand = false;
	        var isAsync = false;
	        if (token.type === 3 /* Identifier */) {
	            var id = token.value;
	            this.nextToken();
	            computed = this.match('[');
	            isAsync = !this.hasLineTerminator && (id === 'async') &&
	                !this.match(':') && !this.match('(') && !this.match('*');
	            key = isAsync ? this.parseObjectPropertyKey() : this.finalize(node, new Node.Identifier(id));
	        }
	        else if (this.match('*')) {
	            this.nextToken();
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	        }
	        var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
	        if (token.type === 3 /* Identifier */ && !isAsync && token.value === 'get' && lookaheadPropertyKey) {
	            kind = 'get';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            this.context.allowYield = false;
	            value = this.parseGetterMethod();
	        }
	        else if (token.type === 3 /* Identifier */ && !isAsync && token.value === 'set' && lookaheadPropertyKey) {
	            kind = 'set';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseSetterMethod();
	        }
	        else if (token.type === 7 /* Punctuator */ && token.value === '*' && lookaheadPropertyKey) {
	            kind = 'init';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseGeneratorMethod();
	            method = true;
	        }
	        else {
	            if (!key) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            kind = 'init';
	            if (this.match(':') && !isAsync) {
	                if (!computed && this.isPropertyKey(key, '__proto__')) {
	                    if (hasProto.value) {
	                        this.tolerateError(messages_1.Messages.DuplicateProtoProperty);
	                    }
	                    hasProto.value = true;
	                }
	                this.nextToken();
	                value = this.inheritCoverGrammar(this.parseAssignmentExpression);
	            }
	            else if (this.match('(')) {
	                value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
	                method = true;
	            }
	            else if (token.type === 3 /* Identifier */) {
	                var id = this.finalize(node, new Node.Identifier(token.value));
	                if (this.match('=')) {
	                    this.context.firstCoverInitializedNameError = this.lookahead;
	                    this.nextToken();
	                    shorthand = true;
	                    var init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    value = this.finalize(node, new Node.AssignmentPattern(id, init));
	                }
	                else {
	                    shorthand = true;
	                    value = id;
	                }
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	        }
	        return this.finalize(node, new Node.Property(kind, key, computed, value, method, shorthand));
	    };
	    Parser.prototype.parseObjectInitializer = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var properties = [];
	        var hasProto = { value: false };
	        while (!this.match('}')) {
	            properties.push(this.parseObjectProperty(hasProto));
	            if (!this.match('}')) {
	                this.expectCommaSeparator();
	            }
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.ObjectExpression(properties));
	    };
	    // https://tc39.github.io/ecma262/#sec-template-literals
	    Parser.prototype.parseTemplateHead = function () {
	        assert_1.assert(this.lookahead.head, 'Template literal must start with a template head');
	        var node = this.createNode();
	        var token = this.nextToken();
	        var raw = token.value;
	        var cooked = token.cooked;
	        return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	    };
	    Parser.prototype.parseTemplateElement = function () {
	        if (this.lookahead.type !== 10 /* Template */) {
	            this.throwUnexpectedToken();
	        }
	        var node = this.createNode();
	        var token = this.nextToken();
	        var raw = token.value;
	        var cooked = token.cooked;
	        return this.finalize(node, new Node.TemplateElement({ raw: raw, cooked: cooked }, token.tail));
	    };
	    Parser.prototype.parseTemplateLiteral = function () {
	        var node = this.createNode();
	        var expressions = [];
	        var quasis = [];
	        var quasi = this.parseTemplateHead();
	        quasis.push(quasi);
	        while (!quasi.tail) {
	            expressions.push(this.parseExpression());
	            quasi = this.parseTemplateElement();
	            quasis.push(quasi);
	        }
	        return this.finalize(node, new Node.TemplateLiteral(quasis, expressions));
	    };
	    // https://tc39.github.io/ecma262/#sec-grouping-operator
	    Parser.prototype.reinterpretExpressionAsPattern = function (expr) {
	        switch (expr.type) {
	            case syntax_1.Syntax.Identifier:
	            case syntax_1.Syntax.MemberExpression:
	            case syntax_1.Syntax.RestElement:
	            case syntax_1.Syntax.AssignmentPattern:
	                break;
	            case syntax_1.Syntax.SpreadElement:
	                expr.type = syntax_1.Syntax.RestElement;
	                this.reinterpretExpressionAsPattern(expr.argument);
	                break;
	            case syntax_1.Syntax.ArrayExpression:
	                expr.type = syntax_1.Syntax.ArrayPattern;
	                for (var i = 0; i < expr.elements.length; i++) {
	                    if (expr.elements[i] !== null) {
	                        this.reinterpretExpressionAsPattern(expr.elements[i]);
	                    }
	                }
	                break;
	            case syntax_1.Syntax.ObjectExpression:
	                expr.type = syntax_1.Syntax.ObjectPattern;
	                for (var i = 0; i < expr.properties.length; i++) {
	                    this.reinterpretExpressionAsPattern(expr.properties[i].value);
	                }
	                break;
	            case syntax_1.Syntax.AssignmentExpression:
	                expr.type = syntax_1.Syntax.AssignmentPattern;
	                delete expr.operator;
	                this.reinterpretExpressionAsPattern(expr.left);
	                break;
	            default:
	                // Allow other node type for tolerant parsing.
	                break;
	        }
	    };
	    Parser.prototype.parseGroupExpression = function () {
	        var expr;
	        this.expect('(');
	        if (this.match(')')) {
	            this.nextToken();
	            if (!this.match('=>')) {
	                this.expect('=>');
	            }
	            expr = {
	                type: ArrowParameterPlaceHolder,
	                params: [],
	                async: false
	            };
	        }
	        else {
	            var startToken = this.lookahead;
	            var params = [];
	            if (this.match('...')) {
	                expr = this.parseRestElement(params);
	                this.expect(')');
	                if (!this.match('=>')) {
	                    this.expect('=>');
	                }
	                expr = {
	                    type: ArrowParameterPlaceHolder,
	                    params: [expr],
	                    async: false
	                };
	            }
	            else {
	                var arrow = false;
	                this.context.isBindingElement = true;
	                expr = this.inheritCoverGrammar(this.parseAssignmentExpression);
	                if (this.match(',')) {
	                    var expressions = [];
	                    this.context.isAssignmentTarget = false;
	                    expressions.push(expr);
	                    while (this.lookahead.type !== 2 /* EOF */) {
	                        if (!this.match(',')) {
	                            break;
	                        }
	                        this.nextToken();
	                        if (this.match(')')) {
	                            this.nextToken();
	                            for (var i = 0; i < expressions.length; i++) {
	                                this.reinterpretExpressionAsPattern(expressions[i]);
	                            }
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: expressions,
	                                async: false
	                            };
	                        }
	                        else if (this.match('...')) {
	                            if (!this.context.isBindingElement) {
	                                this.throwUnexpectedToken(this.lookahead);
	                            }
	                            expressions.push(this.parseRestElement(params));
	                            this.expect(')');
	                            if (!this.match('=>')) {
	                                this.expect('=>');
	                            }
	                            this.context.isBindingElement = false;
	                            for (var i = 0; i < expressions.length; i++) {
	                                this.reinterpretExpressionAsPattern(expressions[i]);
	                            }
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: expressions,
	                                async: false
	                            };
	                        }
	                        else {
	                            expressions.push(this.inheritCoverGrammar(this.parseAssignmentExpression));
	                        }
	                        if (arrow) {
	                            break;
	                        }
	                    }
	                    if (!arrow) {
	                        expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
	                    }
	                }
	                if (!arrow) {
	                    this.expect(')');
	                    if (this.match('=>')) {
	                        if (expr.type === syntax_1.Syntax.Identifier && expr.name === 'yield') {
	                            arrow = true;
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: [expr],
	                                async: false
	                            };
	                        }
	                        if (!arrow) {
	                            if (!this.context.isBindingElement) {
	                                this.throwUnexpectedToken(this.lookahead);
	                            }
	                            if (expr.type === syntax_1.Syntax.SequenceExpression) {
	                                for (var i = 0; i < expr.expressions.length; i++) {
	                                    this.reinterpretExpressionAsPattern(expr.expressions[i]);
	                                }
	                            }
	                            else {
	                                this.reinterpretExpressionAsPattern(expr);
	                            }
	                            var parameters = (expr.type === syntax_1.Syntax.SequenceExpression ? expr.expressions : [expr]);
	                            expr = {
	                                type: ArrowParameterPlaceHolder,
	                                params: parameters,
	                                async: false
	                            };
	                        }
	                    }
	                    this.context.isBindingElement = false;
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-left-hand-side-expressions
	    Parser.prototype.parseArguments = function () {
	        this.expect('(');
	        var args = [];
	        if (!this.match(')')) {
	            while (true) {
	                var expr = this.match('...') ? this.parseSpreadElement() :
	                    this.isolateCoverGrammar(this.parseAssignmentExpression);
	                args.push(expr);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expectCommaSeparator();
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return args;
	    };
	    Parser.prototype.isIdentifierName = function (token) {
	        return token.type === 3 /* Identifier */ ||
	            token.type === 4 /* Keyword */ ||
	            token.type === 1 /* BooleanLiteral */ ||
	            token.type === 5 /* NullLiteral */;
	    };
	    Parser.prototype.parseIdentifierName = function () {
	        var node = this.createNode();
	        var token = this.nextToken();
	        if (!this.isIdentifierName(token)) {
	            this.throwUnexpectedToken(token);
	        }
	        return this.finalize(node, new Node.Identifier(token.value));
	    };
	    Parser.prototype.parseNewExpression = function () {
	        var node = this.createNode();
	        var id = this.parseIdentifierName();
	        assert_1.assert(id.name === 'new', 'New expression must start with `new`');
	        var expr;
	        if (this.match('.')) {
	            this.nextToken();
	            if (this.lookahead.type === 3 /* Identifier */ && this.context.inFunctionBody && this.lookahead.value === 'target') {
	                var property = this.parseIdentifierName();
	                expr = new Node.MetaProperty(id, property);
	            }
	            else {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	        }
	        else {
	            var callee = this.isolateCoverGrammar(this.parseLeftHandSideExpression);
	            var args = this.match('(') ? this.parseArguments() : [];
	            expr = new Node.NewExpression(callee, args);
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        return this.finalize(node, expr);
	    };
	    Parser.prototype.parseAsyncArgument = function () {
	        var arg = this.parseAssignmentExpression();
	        this.context.firstCoverInitializedNameError = null;
	        return arg;
	    };
	    Parser.prototype.parseAsyncArguments = function () {
	        this.expect('(');
	        var args = [];
	        if (!this.match(')')) {
	            while (true) {
	                var expr = this.match('...') ? this.parseSpreadElement() :
	                    this.isolateCoverGrammar(this.parseAsyncArgument);
	                args.push(expr);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expectCommaSeparator();
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return args;
	    };
	    Parser.prototype.parseLeftHandSideExpressionAllowCall = function () {
	        var startToken = this.lookahead;
	        var maybeAsync = this.matchContextualKeyword('async');
	        var previousAllowIn = this.context.allowIn;
	        this.context.allowIn = true;
	        var expr;
	        if (this.matchKeyword('super') && this.context.inFunctionBody) {
	            expr = this.createNode();
	            this.nextToken();
	            expr = this.finalize(expr, new Node.Super());
	            if (!this.match('(') && !this.match('.') && !this.match('[')) {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	        }
	        else {
	            expr = this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
	        }
	        while (true) {
	            if (this.match('.')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('.');
	                var property = this.parseIdentifierName();
	                expr = this.finalize(this.startNode(startToken), new Node.StaticMemberExpression(expr, property));
	            }
	            else if (this.match('(')) {
	                var asyncArrow = maybeAsync && (startToken.lineNumber === this.lookahead.lineNumber);
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = false;
	                var args = asyncArrow ? this.parseAsyncArguments() : this.parseArguments();
	                expr = this.finalize(this.startNode(startToken), new Node.CallExpression(expr, args));
	                if (asyncArrow && this.match('=>')) {
	                    for (var i = 0; i < args.length; ++i) {
	                        this.reinterpretExpressionAsPattern(args[i]);
	                    }
	                    expr = {
	                        type: ArrowParameterPlaceHolder,
	                        params: args,
	                        async: true
	                    };
	                }
	            }
	            else if (this.match('[')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('[');
	                var property = this.isolateCoverGrammar(this.parseExpression);
	                this.expect(']');
	                expr = this.finalize(this.startNode(startToken), new Node.ComputedMemberExpression(expr, property));
	            }
	            else if (this.lookahead.type === 10 /* Template */ && this.lookahead.head) {
	                var quasi = this.parseTemplateLiteral();
	                expr = this.finalize(this.startNode(startToken), new Node.TaggedTemplateExpression(expr, quasi));
	            }
	            else {
	                break;
	            }
	        }
	        this.context.allowIn = previousAllowIn;
	        return expr;
	    };
	    Parser.prototype.parseSuper = function () {
	        var node = this.createNode();
	        this.expectKeyword('super');
	        if (!this.match('[') && !this.match('.')) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        return this.finalize(node, new Node.Super());
	    };
	    Parser.prototype.parseLeftHandSideExpression = function () {
	        assert_1.assert(this.context.allowIn, 'callee of new expression always allow in keyword.');
	        var node = this.startNode(this.lookahead);
	        var expr = (this.matchKeyword('super') && this.context.inFunctionBody) ? this.parseSuper() :
	            this.inheritCoverGrammar(this.matchKeyword('new') ? this.parseNewExpression : this.parsePrimaryExpression);
	        while (true) {
	            if (this.match('[')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('[');
	                var property = this.isolateCoverGrammar(this.parseExpression);
	                this.expect(']');
	                expr = this.finalize(node, new Node.ComputedMemberExpression(expr, property));
	            }
	            else if (this.match('.')) {
	                this.context.isBindingElement = false;
	                this.context.isAssignmentTarget = true;
	                this.expect('.');
	                var property = this.parseIdentifierName();
	                expr = this.finalize(node, new Node.StaticMemberExpression(expr, property));
	            }
	            else if (this.lookahead.type === 10 /* Template */ && this.lookahead.head) {
	                var quasi = this.parseTemplateLiteral();
	                expr = this.finalize(node, new Node.TaggedTemplateExpression(expr, quasi));
	            }
	            else {
	                break;
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-update-expressions
	    Parser.prototype.parseUpdateExpression = function () {
	        var expr;
	        var startToken = this.lookahead;
	        if (this.match('++') || this.match('--')) {
	            var node = this.startNode(startToken);
	            var token = this.nextToken();
	            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	            if (this.context.strict && expr.type === syntax_1.Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
	                this.tolerateError(messages_1.Messages.StrictLHSPrefix);
	            }
	            if (!this.context.isAssignmentTarget) {
	                this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	            }
	            var prefix = true;
	            expr = this.finalize(node, new Node.UpdateExpression(token.value, expr, prefix));
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        else {
	            expr = this.inheritCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	            if (!this.hasLineTerminator && this.lookahead.type === 7 /* Punctuator */) {
	                if (this.match('++') || this.match('--')) {
	                    if (this.context.strict && expr.type === syntax_1.Syntax.Identifier && this.scanner.isRestrictedWord(expr.name)) {
	                        this.tolerateError(messages_1.Messages.StrictLHSPostfix);
	                    }
	                    if (!this.context.isAssignmentTarget) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	                    }
	                    this.context.isAssignmentTarget = false;
	                    this.context.isBindingElement = false;
	                    var operator = this.nextToken().value;
	                    var prefix = false;
	                    expr = this.finalize(this.startNode(startToken), new Node.UpdateExpression(operator, expr, prefix));
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-unary-operators
	    Parser.prototype.parseAwaitExpression = function () {
	        var node = this.createNode();
	        this.nextToken();
	        var argument = this.parseUnaryExpression();
	        return this.finalize(node, new Node.AwaitExpression(argument));
	    };
	    Parser.prototype.parseUnaryExpression = function () {
	        var expr;
	        if (this.match('+') || this.match('-') || this.match('~') || this.match('!') ||
	            this.matchKeyword('delete') || this.matchKeyword('void') || this.matchKeyword('typeof')) {
	            var node = this.startNode(this.lookahead);
	            var token = this.nextToken();
	            expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	            expr = this.finalize(node, new Node.UnaryExpression(token.value, expr));
	            if (this.context.strict && expr.operator === 'delete' && expr.argument.type === syntax_1.Syntax.Identifier) {
	                this.tolerateError(messages_1.Messages.StrictDelete);
	            }
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        else if (this.context.await && this.matchContextualKeyword('await')) {
	            expr = this.parseAwaitExpression();
	        }
	        else {
	            expr = this.parseUpdateExpression();
	        }
	        return expr;
	    };
	    Parser.prototype.parseExponentiationExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseUnaryExpression);
	        if (expr.type !== syntax_1.Syntax.UnaryExpression && this.match('**')) {
	            this.nextToken();
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	            var left = expr;
	            var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
	            expr = this.finalize(this.startNode(startToken), new Node.BinaryExpression('**', left, right));
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-exp-operator
	    // https://tc39.github.io/ecma262/#sec-multiplicative-operators
	    // https://tc39.github.io/ecma262/#sec-additive-operators
	    // https://tc39.github.io/ecma262/#sec-bitwise-shift-operators
	    // https://tc39.github.io/ecma262/#sec-relational-operators
	    // https://tc39.github.io/ecma262/#sec-equality-operators
	    // https://tc39.github.io/ecma262/#sec-binary-bitwise-operators
	    // https://tc39.github.io/ecma262/#sec-binary-logical-operators
	    Parser.prototype.binaryPrecedence = function (token) {
	        var op = token.value;
	        var precedence;
	        if (token.type === 7 /* Punctuator */) {
	            precedence = this.operatorPrecedence[op] || 0;
	        }
	        else if (token.type === 4 /* Keyword */) {
	            precedence = (op === 'instanceof' || (this.context.allowIn && op === 'in')) ? 7 : 0;
	        }
	        else {
	            precedence = 0;
	        }
	        return precedence;
	    };
	    Parser.prototype.parseBinaryExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseExponentiationExpression);
	        var token = this.lookahead;
	        var prec = this.binaryPrecedence(token);
	        if (prec > 0) {
	            this.nextToken();
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	            var markers = [startToken, this.lookahead];
	            var left = expr;
	            var right = this.isolateCoverGrammar(this.parseExponentiationExpression);
	            var stack = [left, token.value, right];
	            var precedences = [prec];
	            while (true) {
	                prec = this.binaryPrecedence(this.lookahead);
	                if (prec <= 0) {
	                    break;
	                }
	                // Reduce: make a binary expression from the three topmost entries.
	                while ((stack.length > 2) && (prec <= precedences[precedences.length - 1])) {
	                    right = stack.pop();
	                    var operator = stack.pop();
	                    precedences.pop();
	                    left = stack.pop();
	                    markers.pop();
	                    var node = this.startNode(markers[markers.length - 1]);
	                    stack.push(this.finalize(node, new Node.BinaryExpression(operator, left, right)));
	                }
	                // Shift.
	                stack.push(this.nextToken().value);
	                precedences.push(prec);
	                markers.push(this.lookahead);
	                stack.push(this.isolateCoverGrammar(this.parseExponentiationExpression));
	            }
	            // Final reduce to clean-up the stack.
	            var i = stack.length - 1;
	            expr = stack[i];
	            markers.pop();
	            while (i > 1) {
	                var node = this.startNode(markers.pop());
	                var operator = stack[i - 1];
	                expr = this.finalize(node, new Node.BinaryExpression(operator, stack[i - 2], expr));
	                i -= 2;
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-conditional-operator
	    Parser.prototype.parseConditionalExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.inheritCoverGrammar(this.parseBinaryExpression);
	        if (this.match('?')) {
	            this.nextToken();
	            var previousAllowIn = this.context.allowIn;
	            this.context.allowIn = true;
	            var consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            this.context.allowIn = previousAllowIn;
	            this.expect(':');
	            var alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            expr = this.finalize(this.startNode(startToken), new Node.ConditionalExpression(expr, consequent, alternate));
	            this.context.isAssignmentTarget = false;
	            this.context.isBindingElement = false;
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-assignment-operators
	    Parser.prototype.checkPatternParam = function (options, param) {
	        switch (param.type) {
	            case syntax_1.Syntax.Identifier:
	                this.validateParam(options, param, param.name);
	                break;
	            case syntax_1.Syntax.RestElement:
	                this.checkPatternParam(options, param.argument);
	                break;
	            case syntax_1.Syntax.AssignmentPattern:
	                this.checkPatternParam(options, param.left);
	                break;
	            case syntax_1.Syntax.ArrayPattern:
	                for (var i = 0; i < param.elements.length; i++) {
	                    if (param.elements[i] !== null) {
	                        this.checkPatternParam(options, param.elements[i]);
	                    }
	                }
	                break;
	            case syntax_1.Syntax.ObjectPattern:
	                for (var i = 0; i < param.properties.length; i++) {
	                    this.checkPatternParam(options, param.properties[i].value);
	                }
	                break;
	            default:
	                break;
	        }
	        options.simple = options.simple && (param instanceof Node.Identifier);
	    };
	    Parser.prototype.reinterpretAsCoverFormalsList = function (expr) {
	        var params = [expr];
	        var options;
	        var asyncArrow = false;
	        switch (expr.type) {
	            case syntax_1.Syntax.Identifier:
	                break;
	            case ArrowParameterPlaceHolder:
	                params = expr.params;
	                asyncArrow = expr.async;
	                break;
	            default:
	                return null;
	        }
	        options = {
	            simple: true,
	            paramSet: {}
	        };
	        for (var i = 0; i < params.length; ++i) {
	            var param = params[i];
	            if (param.type === syntax_1.Syntax.AssignmentPattern) {
	                if (param.right.type === syntax_1.Syntax.YieldExpression) {
	                    if (param.right.argument) {
	                        this.throwUnexpectedToken(this.lookahead);
	                    }
	                    param.right.type = syntax_1.Syntax.Identifier;
	                    param.right.name = 'yield';
	                    delete param.right.argument;
	                    delete param.right.delegate;
	                }
	            }
	            else if (asyncArrow && param.type === syntax_1.Syntax.Identifier && param.name === 'await') {
	                this.throwUnexpectedToken(this.lookahead);
	            }
	            this.checkPatternParam(options, param);
	            params[i] = param;
	        }
	        if (this.context.strict || !this.context.allowYield) {
	            for (var i = 0; i < params.length; ++i) {
	                var param = params[i];
	                if (param.type === syntax_1.Syntax.YieldExpression) {
	                    this.throwUnexpectedToken(this.lookahead);
	                }
	            }
	        }
	        if (options.message === messages_1.Messages.StrictParamDupe) {
	            var token = this.context.strict ? options.stricted : options.firstRestricted;
	            this.throwUnexpectedToken(token, options.message);
	        }
	        return {
	            simple: options.simple,
	            params: params,
	            stricted: options.stricted,
	            firstRestricted: options.firstRestricted,
	            message: options.message
	        };
	    };
	    Parser.prototype.parseAssignmentExpression = function () {
	        var expr;
	        if (!this.context.allowYield && this.matchKeyword('yield')) {
	            expr = this.parseYieldExpression();
	        }
	        else {
	            var startToken = this.lookahead;
	            var token = startToken;
	            expr = this.parseConditionalExpression();
	            if (token.type === 3 /* Identifier */ && (token.lineNumber === this.lookahead.lineNumber) && token.value === 'async') {
	                if (this.lookahead.type === 3 /* Identifier */ || this.matchKeyword('yield')) {
	                    var arg = this.parsePrimaryExpression();
	                    this.reinterpretExpressionAsPattern(arg);
	                    expr = {
	                        type: ArrowParameterPlaceHolder,
	                        params: [arg],
	                        async: true
	                    };
	                }
	            }
	            if (expr.type === ArrowParameterPlaceHolder || this.match('=>')) {
	                // https://tc39.github.io/ecma262/#sec-arrow-function-definitions
	                this.context.isAssignmentTarget = false;
	                this.context.isBindingElement = false;
	                var isAsync = expr.async;
	                var list = this.reinterpretAsCoverFormalsList(expr);
	                if (list) {
	                    if (this.hasLineTerminator) {
	                        this.tolerateUnexpectedToken(this.lookahead);
	                    }
	                    this.context.firstCoverInitializedNameError = null;
	                    var previousStrict = this.context.strict;
	                    var previousAllowStrictDirective = this.context.allowStrictDirective;
	                    this.context.allowStrictDirective = list.simple;
	                    var previousAllowYield = this.context.allowYield;
	                    var previousAwait = this.context.await;
	                    this.context.allowYield = true;
	                    this.context.await = isAsync;
	                    var node = this.startNode(startToken);
	                    this.expect('=>');
	                    var body = void 0;
	                    if (this.match('{')) {
	                        var previousAllowIn = this.context.allowIn;
	                        this.context.allowIn = true;
	                        body = this.parseFunctionSourceElements();
	                        this.context.allowIn = previousAllowIn;
	                    }
	                    else {
	                        body = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    }
	                    var expression = body.type !== syntax_1.Syntax.BlockStatement;
	                    if (this.context.strict && list.firstRestricted) {
	                        this.throwUnexpectedToken(list.firstRestricted, list.message);
	                    }
	                    if (this.context.strict && list.stricted) {
	                        this.tolerateUnexpectedToken(list.stricted, list.message);
	                    }
	                    expr = isAsync ? this.finalize(node, new Node.AsyncArrowFunctionExpression(list.params, body, expression)) :
	                        this.finalize(node, new Node.ArrowFunctionExpression(list.params, body, expression));
	                    this.context.strict = previousStrict;
	                    this.context.allowStrictDirective = previousAllowStrictDirective;
	                    this.context.allowYield = previousAllowYield;
	                    this.context.await = previousAwait;
	                }
	            }
	            else {
	                if (this.matchAssign()) {
	                    if (!this.context.isAssignmentTarget) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInAssignment);
	                    }
	                    if (this.context.strict && expr.type === syntax_1.Syntax.Identifier) {
	                        var id = expr;
	                        if (this.scanner.isRestrictedWord(id.name)) {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.StrictLHSAssignment);
	                        }
	                        if (this.scanner.isStrictModeReservedWord(id.name)) {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	                        }
	                    }
	                    if (!this.match('=')) {
	                        this.context.isAssignmentTarget = false;
	                        this.context.isBindingElement = false;
	                    }
	                    else {
	                        this.reinterpretExpressionAsPattern(expr);
	                    }
	                    token = this.nextToken();
	                    var operator = token.value;
	                    var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                    expr = this.finalize(this.startNode(startToken), new Node.AssignmentExpression(operator, expr, right));
	                    this.context.firstCoverInitializedNameError = null;
	                }
	            }
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-comma-operator
	    Parser.prototype.parseExpression = function () {
	        var startToken = this.lookahead;
	        var expr = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        if (this.match(',')) {
	            var expressions = [];
	            expressions.push(expr);
	            while (this.lookahead.type !== 2 /* EOF */) {
	                if (!this.match(',')) {
	                    break;
	                }
	                this.nextToken();
	                expressions.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
	            }
	            expr = this.finalize(this.startNode(startToken), new Node.SequenceExpression(expressions));
	        }
	        return expr;
	    };
	    // https://tc39.github.io/ecma262/#sec-block
	    Parser.prototype.parseStatementListItem = function () {
	        var statement;
	        this.context.isAssignmentTarget = true;
	        this.context.isBindingElement = true;
	        if (this.lookahead.type === 4 /* Keyword */) {
	            switch (this.lookahead.value) {
	                case 'export':
	                    if (!this.context.isModule) {
	                        this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.IllegalExportDeclaration);
	                    }
	                    statement = this.parseExportDeclaration();
	                    break;
	                case 'import':
	                    if (!this.context.isModule) {
	                        this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.IllegalImportDeclaration);
	                    }
	                    statement = this.parseImportDeclaration();
	                    break;
	                case 'const':
	                    statement = this.parseLexicalDeclaration({ inFor: false });
	                    break;
	                case 'function':
	                    statement = this.parseFunctionDeclaration();
	                    break;
	                case 'class':
	                    statement = this.parseClassDeclaration();
	                    break;
	                case 'let':
	                    statement = this.isLexicalDeclaration() ? this.parseLexicalDeclaration({ inFor: false }) : this.parseStatement();
	                    break;
	                default:
	                    statement = this.parseStatement();
	                    break;
	            }
	        }
	        else {
	            statement = this.parseStatement();
	        }
	        return statement;
	    };
	    Parser.prototype.parseBlock = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var block = [];
	        while (true) {
	            if (this.match('}')) {
	                break;
	            }
	            block.push(this.parseStatementListItem());
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.BlockStatement(block));
	    };
	    // https://tc39.github.io/ecma262/#sec-let-and-const-declarations
	    Parser.prototype.parseLexicalBinding = function (kind, options) {
	        var node = this.createNode();
	        var params = [];
	        var id = this.parsePattern(params, kind);
	        if (this.context.strict && id.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(id.name)) {
	                this.tolerateError(messages_1.Messages.StrictVarName);
	            }
	        }
	        var init = null;
	        if (kind === 'const') {
	            if (!this.matchKeyword('in') && !this.matchContextualKeyword('of')) {
	                if (this.match('=')) {
	                    this.nextToken();
	                    init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	                }
	                else {
	                    this.throwError(messages_1.Messages.DeclarationMissingInitializer, 'const');
	                }
	            }
	        }
	        else if ((!options.inFor && id.type !== syntax_1.Syntax.Identifier) || this.match('=')) {
	            this.expect('=');
	            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        }
	        return this.finalize(node, new Node.VariableDeclarator(id, init));
	    };
	    Parser.prototype.parseBindingList = function (kind, options) {
	        var list = [this.parseLexicalBinding(kind, options)];
	        while (this.match(',')) {
	            this.nextToken();
	            list.push(this.parseLexicalBinding(kind, options));
	        }
	        return list;
	    };
	    Parser.prototype.isLexicalDeclaration = function () {
	        var state = this.scanner.saveState();
	        this.scanner.scanComments();
	        var next = this.scanner.lex();
	        this.scanner.restoreState(state);
	        return (next.type === 3 /* Identifier */) ||
	            (next.type === 7 /* Punctuator */ && next.value === '[') ||
	            (next.type === 7 /* Punctuator */ && next.value === '{') ||
	            (next.type === 4 /* Keyword */ && next.value === 'let') ||
	            (next.type === 4 /* Keyword */ && next.value === 'yield');
	    };
	    Parser.prototype.parseLexicalDeclaration = function (options) {
	        var node = this.createNode();
	        var kind = this.nextToken().value;
	        assert_1.assert(kind === 'let' || kind === 'const', 'Lexical declaration must be either let or const');
	        var declarations = this.parseBindingList(kind, options);
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.VariableDeclaration(declarations, kind));
	    };
	    // https://tc39.github.io/ecma262/#sec-destructuring-binding-patterns
	    Parser.prototype.parseBindingRestElement = function (params, kind) {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.parsePattern(params, kind);
	        return this.finalize(node, new Node.RestElement(arg));
	    };
	    Parser.prototype.parseArrayPattern = function (params, kind) {
	        var node = this.createNode();
	        this.expect('[');
	        var elements = [];
	        while (!this.match(']')) {
	            if (this.match(',')) {
	                this.nextToken();
	                elements.push(null);
	            }
	            else {
	                if (this.match('...')) {
	                    elements.push(this.parseBindingRestElement(params, kind));
	                    break;
	                }
	                else {
	                    elements.push(this.parsePatternWithDefault(params, kind));
	                }
	                if (!this.match(']')) {
	                    this.expect(',');
	                }
	            }
	        }
	        this.expect(']');
	        return this.finalize(node, new Node.ArrayPattern(elements));
	    };
	    Parser.prototype.parsePropertyPattern = function (params, kind) {
	        var node = this.createNode();
	        var computed = false;
	        var shorthand = false;
	        var method = false;
	        var key;
	        var value;
	        if (this.lookahead.type === 3 /* Identifier */) {
	            var keyToken = this.lookahead;
	            key = this.parseVariableIdentifier();
	            var init = this.finalize(node, new Node.Identifier(keyToken.value));
	            if (this.match('=')) {
	                params.push(keyToken);
	                shorthand = true;
	                this.nextToken();
	                var expr = this.parseAssignmentExpression();
	                value = this.finalize(this.startNode(keyToken), new Node.AssignmentPattern(init, expr));
	            }
	            else if (!this.match(':')) {
	                params.push(keyToken);
	                shorthand = true;
	                value = init;
	            }
	            else {
	                this.expect(':');
	                value = this.parsePatternWithDefault(params, kind);
	            }
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            this.expect(':');
	            value = this.parsePatternWithDefault(params, kind);
	        }
	        return this.finalize(node, new Node.Property('init', key, computed, value, method, shorthand));
	    };
	    Parser.prototype.parseObjectPattern = function (params, kind) {
	        var node = this.createNode();
	        var properties = [];
	        this.expect('{');
	        while (!this.match('}')) {
	            properties.push(this.parsePropertyPattern(params, kind));
	            if (!this.match('}')) {
	                this.expect(',');
	            }
	        }
	        this.expect('}');
	        return this.finalize(node, new Node.ObjectPattern(properties));
	    };
	    Parser.prototype.parsePattern = function (params, kind) {
	        var pattern;
	        if (this.match('[')) {
	            pattern = this.parseArrayPattern(params, kind);
	        }
	        else if (this.match('{')) {
	            pattern = this.parseObjectPattern(params, kind);
	        }
	        else {
	            if (this.matchKeyword('let') && (kind === 'const' || kind === 'let')) {
	                this.tolerateUnexpectedToken(this.lookahead, messages_1.Messages.LetInLexicalBinding);
	            }
	            params.push(this.lookahead);
	            pattern = this.parseVariableIdentifier(kind);
	        }
	        return pattern;
	    };
	    Parser.prototype.parsePatternWithDefault = function (params, kind) {
	        var startToken = this.lookahead;
	        var pattern = this.parsePattern(params, kind);
	        if (this.match('=')) {
	            this.nextToken();
	            var previousAllowYield = this.context.allowYield;
	            this.context.allowYield = true;
	            var right = this.isolateCoverGrammar(this.parseAssignmentExpression);
	            this.context.allowYield = previousAllowYield;
	            pattern = this.finalize(this.startNode(startToken), new Node.AssignmentPattern(pattern, right));
	        }
	        return pattern;
	    };
	    // https://tc39.github.io/ecma262/#sec-variable-statement
	    Parser.prototype.parseVariableIdentifier = function (kind) {
	        var node = this.createNode();
	        var token = this.nextToken();
	        if (token.type === 4 /* Keyword */ && token.value === 'yield') {
	            if (this.context.strict) {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	            }
	            else if (!this.context.allowYield) {
	                this.throwUnexpectedToken(token);
	            }
	        }
	        else if (token.type !== 3 /* Identifier */) {
	            if (this.context.strict && token.type === 4 /* Keyword */ && this.scanner.isStrictModeReservedWord(token.value)) {
	                this.tolerateUnexpectedToken(token, messages_1.Messages.StrictReservedWord);
	            }
	            else {
	                if (this.context.strict || token.value !== 'let' || kind !== 'var') {
	                    this.throwUnexpectedToken(token);
	                }
	            }
	        }
	        else if ((this.context.isModule || this.context.await) && token.type === 3 /* Identifier */ && token.value === 'await') {
	            this.tolerateUnexpectedToken(token);
	        }
	        return this.finalize(node, new Node.Identifier(token.value));
	    };
	    Parser.prototype.parseVariableDeclaration = function (options) {
	        var node = this.createNode();
	        var params = [];
	        var id = this.parsePattern(params, 'var');
	        if (this.context.strict && id.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(id.name)) {
	                this.tolerateError(messages_1.Messages.StrictVarName);
	            }
	        }
	        var init = null;
	        if (this.match('=')) {
	            this.nextToken();
	            init = this.isolateCoverGrammar(this.parseAssignmentExpression);
	        }
	        else if (id.type !== syntax_1.Syntax.Identifier && !options.inFor) {
	            this.expect('=');
	        }
	        return this.finalize(node, new Node.VariableDeclarator(id, init));
	    };
	    Parser.prototype.parseVariableDeclarationList = function (options) {
	        var opt = { inFor: options.inFor };
	        var list = [];
	        list.push(this.parseVariableDeclaration(opt));
	        while (this.match(',')) {
	            this.nextToken();
	            list.push(this.parseVariableDeclaration(opt));
	        }
	        return list;
	    };
	    Parser.prototype.parseVariableStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('var');
	        var declarations = this.parseVariableDeclarationList({ inFor: false });
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.VariableDeclaration(declarations, 'var'));
	    };
	    // https://tc39.github.io/ecma262/#sec-empty-statement
	    Parser.prototype.parseEmptyStatement = function () {
	        var node = this.createNode();
	        this.expect(';');
	        return this.finalize(node, new Node.EmptyStatement());
	    };
	    // https://tc39.github.io/ecma262/#sec-expression-statement
	    Parser.prototype.parseExpressionStatement = function () {
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ExpressionStatement(expr));
	    };
	    // https://tc39.github.io/ecma262/#sec-if-statement
	    Parser.prototype.parseIfClause = function () {
	        if (this.context.strict && this.matchKeyword('function')) {
	            this.tolerateError(messages_1.Messages.StrictFunction);
	        }
	        return this.parseStatement();
	    };
	    Parser.prototype.parseIfStatement = function () {
	        var node = this.createNode();
	        var consequent;
	        var alternate = null;
	        this.expectKeyword('if');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            consequent = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            consequent = this.parseIfClause();
	            if (this.matchKeyword('else')) {
	                this.nextToken();
	                alternate = this.parseIfClause();
	            }
	        }
	        return this.finalize(node, new Node.IfStatement(test, consequent, alternate));
	    };
	    // https://tc39.github.io/ecma262/#sec-do-while-statement
	    Parser.prototype.parseDoWhileStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('do');
	        var previousInIteration = this.context.inIteration;
	        this.context.inIteration = true;
	        var body = this.parseStatement();
	        this.context.inIteration = previousInIteration;
	        this.expectKeyword('while');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	        }
	        else {
	            this.expect(')');
	            if (this.match(';')) {
	                this.nextToken();
	            }
	        }
	        return this.finalize(node, new Node.DoWhileStatement(body, test));
	    };
	    // https://tc39.github.io/ecma262/#sec-while-statement
	    Parser.prototype.parseWhileStatement = function () {
	        var node = this.createNode();
	        var body;
	        this.expectKeyword('while');
	        this.expect('(');
	        var test = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            var previousInIteration = this.context.inIteration;
	            this.context.inIteration = true;
	            body = this.parseStatement();
	            this.context.inIteration = previousInIteration;
	        }
	        return this.finalize(node, new Node.WhileStatement(test, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-for-statement
	    // https://tc39.github.io/ecma262/#sec-for-in-and-for-of-statements
	    Parser.prototype.parseForStatement = function () {
	        var init = null;
	        var test = null;
	        var update = null;
	        var forIn = true;
	        var left, right;
	        var node = this.createNode();
	        this.expectKeyword('for');
	        this.expect('(');
	        if (this.match(';')) {
	            this.nextToken();
	        }
	        else {
	            if (this.matchKeyword('var')) {
	                init = this.createNode();
	                this.nextToken();
	                var previousAllowIn = this.context.allowIn;
	                this.context.allowIn = false;
	                var declarations = this.parseVariableDeclarationList({ inFor: true });
	                this.context.allowIn = previousAllowIn;
	                if (declarations.length === 1 && this.matchKeyword('in')) {
	                    var decl = declarations[0];
	                    if (decl.init && (decl.id.type === syntax_1.Syntax.ArrayPattern || decl.id.type === syntax_1.Syntax.ObjectPattern || this.context.strict)) {
	                        this.tolerateError(messages_1.Messages.ForInOfLoopInitializer, 'for-in');
	                    }
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseAssignmentExpression();
	                    init = null;
	                    forIn = false;
	                }
	                else {
	                    init = this.finalize(init, new Node.VariableDeclaration(declarations, 'var'));
	                    this.expect(';');
	                }
	            }
	            else if (this.matchKeyword('const') || this.matchKeyword('let')) {
	                init = this.createNode();
	                var kind = this.nextToken().value;
	                if (!this.context.strict && this.lookahead.value === 'in') {
	                    init = this.finalize(init, new Node.Identifier(kind));
	                    this.nextToken();
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else {
	                    var previousAllowIn = this.context.allowIn;
	                    this.context.allowIn = false;
	                    var declarations = this.parseBindingList(kind, { inFor: true });
	                    this.context.allowIn = previousAllowIn;
	                    if (declarations.length === 1 && declarations[0].init === null && this.matchKeyword('in')) {
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                        this.nextToken();
	                        left = init;
	                        right = this.parseExpression();
	                        init = null;
	                    }
	                    else if (declarations.length === 1 && declarations[0].init === null && this.matchContextualKeyword('of')) {
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                        this.nextToken();
	                        left = init;
	                        right = this.parseAssignmentExpression();
	                        init = null;
	                        forIn = false;
	                    }
	                    else {
	                        this.consumeSemicolon();
	                        init = this.finalize(init, new Node.VariableDeclaration(declarations, kind));
	                    }
	                }
	            }
	            else {
	                var initStartToken = this.lookahead;
	                var previousAllowIn = this.context.allowIn;
	                this.context.allowIn = false;
	                init = this.inheritCoverGrammar(this.parseAssignmentExpression);
	                this.context.allowIn = previousAllowIn;
	                if (this.matchKeyword('in')) {
	                    if (!this.context.isAssignmentTarget || init.type === syntax_1.Syntax.AssignmentExpression) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInForIn);
	                    }
	                    this.nextToken();
	                    this.reinterpretExpressionAsPattern(init);
	                    left = init;
	                    right = this.parseExpression();
	                    init = null;
	                }
	                else if (this.matchContextualKeyword('of')) {
	                    if (!this.context.isAssignmentTarget || init.type === syntax_1.Syntax.AssignmentExpression) {
	                        this.tolerateError(messages_1.Messages.InvalidLHSInForLoop);
	                    }
	                    this.nextToken();
	                    this.reinterpretExpressionAsPattern(init);
	                    left = init;
	                    right = this.parseAssignmentExpression();
	                    init = null;
	                    forIn = false;
	                }
	                else {
	                    if (this.match(',')) {
	                        var initSeq = [init];
	                        while (this.match(',')) {
	                            this.nextToken();
	                            initSeq.push(this.isolateCoverGrammar(this.parseAssignmentExpression));
	                        }
	                        init = this.finalize(this.startNode(initStartToken), new Node.SequenceExpression(initSeq));
	                    }
	                    this.expect(';');
	                }
	            }
	        }
	        if (typeof left === 'undefined') {
	            if (!this.match(';')) {
	                test = this.parseExpression();
	            }
	            this.expect(';');
	            if (!this.match(')')) {
	                update = this.parseExpression();
	            }
	        }
	        var body;
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            var previousInIteration = this.context.inIteration;
	            this.context.inIteration = true;
	            body = this.isolateCoverGrammar(this.parseStatement);
	            this.context.inIteration = previousInIteration;
	        }
	        return (typeof left === 'undefined') ?
	            this.finalize(node, new Node.ForStatement(init, test, update, body)) :
	            forIn ? this.finalize(node, new Node.ForInStatement(left, right, body)) :
	                this.finalize(node, new Node.ForOfStatement(left, right, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-continue-statement
	    Parser.prototype.parseContinueStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('continue');
	        var label = null;
	        if (this.lookahead.type === 3 /* Identifier */ && !this.hasLineTerminator) {
	            var id = this.parseVariableIdentifier();
	            label = id;
	            var key = '$' + id.name;
	            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.UnknownLabel, id.name);
	            }
	        }
	        this.consumeSemicolon();
	        if (label === null && !this.context.inIteration) {
	            this.throwError(messages_1.Messages.IllegalContinue);
	        }
	        return this.finalize(node, new Node.ContinueStatement(label));
	    };
	    // https://tc39.github.io/ecma262/#sec-break-statement
	    Parser.prototype.parseBreakStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('break');
	        var label = null;
	        if (this.lookahead.type === 3 /* Identifier */ && !this.hasLineTerminator) {
	            var id = this.parseVariableIdentifier();
	            var key = '$' + id.name;
	            if (!Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.UnknownLabel, id.name);
	            }
	            label = id;
	        }
	        this.consumeSemicolon();
	        if (label === null && !this.context.inIteration && !this.context.inSwitch) {
	            this.throwError(messages_1.Messages.IllegalBreak);
	        }
	        return this.finalize(node, new Node.BreakStatement(label));
	    };
	    // https://tc39.github.io/ecma262/#sec-return-statement
	    Parser.prototype.parseReturnStatement = function () {
	        if (!this.context.inFunctionBody) {
	            this.tolerateError(messages_1.Messages.IllegalReturn);
	        }
	        var node = this.createNode();
	        this.expectKeyword('return');
	        var hasArgument = !this.match(';') && !this.match('}') &&
	            !this.hasLineTerminator && this.lookahead.type !== 2 /* EOF */;
	        var argument = hasArgument ? this.parseExpression() : null;
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ReturnStatement(argument));
	    };
	    // https://tc39.github.io/ecma262/#sec-with-statement
	    Parser.prototype.parseWithStatement = function () {
	        if (this.context.strict) {
	            this.tolerateError(messages_1.Messages.StrictModeWith);
	        }
	        var node = this.createNode();
	        var body;
	        this.expectKeyword('with');
	        this.expect('(');
	        var object = this.parseExpression();
	        if (!this.match(')') && this.config.tolerant) {
	            this.tolerateUnexpectedToken(this.nextToken());
	            body = this.finalize(this.createNode(), new Node.EmptyStatement());
	        }
	        else {
	            this.expect(')');
	            body = this.parseStatement();
	        }
	        return this.finalize(node, new Node.WithStatement(object, body));
	    };
	    // https://tc39.github.io/ecma262/#sec-switch-statement
	    Parser.prototype.parseSwitchCase = function () {
	        var node = this.createNode();
	        var test;
	        if (this.matchKeyword('default')) {
	            this.nextToken();
	            test = null;
	        }
	        else {
	            this.expectKeyword('case');
	            test = this.parseExpression();
	        }
	        this.expect(':');
	        var consequent = [];
	        while (true) {
	            if (this.match('}') || this.matchKeyword('default') || this.matchKeyword('case')) {
	                break;
	            }
	            consequent.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.SwitchCase(test, consequent));
	    };
	    Parser.prototype.parseSwitchStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('switch');
	        this.expect('(');
	        var discriminant = this.parseExpression();
	        this.expect(')');
	        var previousInSwitch = this.context.inSwitch;
	        this.context.inSwitch = true;
	        var cases = [];
	        var defaultFound = false;
	        this.expect('{');
	        while (true) {
	            if (this.match('}')) {
	                break;
	            }
	            var clause = this.parseSwitchCase();
	            if (clause.test === null) {
	                if (defaultFound) {
	                    this.throwError(messages_1.Messages.MultipleDefaultsInSwitch);
	                }
	                defaultFound = true;
	            }
	            cases.push(clause);
	        }
	        this.expect('}');
	        this.context.inSwitch = previousInSwitch;
	        return this.finalize(node, new Node.SwitchStatement(discriminant, cases));
	    };
	    // https://tc39.github.io/ecma262/#sec-labelled-statements
	    Parser.prototype.parseLabelledStatement = function () {
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        var statement;
	        if ((expr.type === syntax_1.Syntax.Identifier) && this.match(':')) {
	            this.nextToken();
	            var id = expr;
	            var key = '$' + id.name;
	            if (Object.prototype.hasOwnProperty.call(this.context.labelSet, key)) {
	                this.throwError(messages_1.Messages.Redeclaration, 'Label', id.name);
	            }
	            this.context.labelSet[key] = true;
	            var body = void 0;
	            if (this.matchKeyword('class')) {
	                this.tolerateUnexpectedToken(this.lookahead);
	                body = this.parseClassDeclaration();
	            }
	            else if (this.matchKeyword('function')) {
	                var token = this.lookahead;
	                var declaration = this.parseFunctionDeclaration();
	                if (this.context.strict) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunction);
	                }
	                else if (declaration.generator) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.GeneratorInLegacyContext);
	                }
	                body = declaration;
	            }
	            else {
	                body = this.parseStatement();
	            }
	            delete this.context.labelSet[key];
	            statement = new Node.LabeledStatement(id, body);
	        }
	        else {
	            this.consumeSemicolon();
	            statement = new Node.ExpressionStatement(expr);
	        }
	        return this.finalize(node, statement);
	    };
	    // https://tc39.github.io/ecma262/#sec-throw-statement
	    Parser.prototype.parseThrowStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('throw');
	        if (this.hasLineTerminator) {
	            this.throwError(messages_1.Messages.NewlineAfterThrow);
	        }
	        var argument = this.parseExpression();
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ThrowStatement(argument));
	    };
	    // https://tc39.github.io/ecma262/#sec-try-statement
	    Parser.prototype.parseCatchClause = function () {
	        var node = this.createNode();
	        this.expectKeyword('catch');
	        this.expect('(');
	        if (this.match(')')) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        var params = [];
	        var param = this.parsePattern(params);
	        var paramMap = {};
	        for (var i = 0; i < params.length; i++) {
	            var key = '$' + params[i].value;
	            if (Object.prototype.hasOwnProperty.call(paramMap, key)) {
	                this.tolerateError(messages_1.Messages.DuplicateBinding, params[i].value);
	            }
	            paramMap[key] = true;
	        }
	        if (this.context.strict && param.type === syntax_1.Syntax.Identifier) {
	            if (this.scanner.isRestrictedWord(param.name)) {
	                this.tolerateError(messages_1.Messages.StrictCatchVariable);
	            }
	        }
	        this.expect(')');
	        var body = this.parseBlock();
	        return this.finalize(node, new Node.CatchClause(param, body));
	    };
	    Parser.prototype.parseFinallyClause = function () {
	        this.expectKeyword('finally');
	        return this.parseBlock();
	    };
	    Parser.prototype.parseTryStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('try');
	        var block = this.parseBlock();
	        var handler = this.matchKeyword('catch') ? this.parseCatchClause() : null;
	        var finalizer = this.matchKeyword('finally') ? this.parseFinallyClause() : null;
	        if (!handler && !finalizer) {
	            this.throwError(messages_1.Messages.NoCatchOrFinally);
	        }
	        return this.finalize(node, new Node.TryStatement(block, handler, finalizer));
	    };
	    // https://tc39.github.io/ecma262/#sec-debugger-statement
	    Parser.prototype.parseDebuggerStatement = function () {
	        var node = this.createNode();
	        this.expectKeyword('debugger');
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.DebuggerStatement());
	    };
	    // https://tc39.github.io/ecma262/#sec-ecmascript-language-statements-and-declarations
	    Parser.prototype.parseStatement = function () {
	        var statement;
	        switch (this.lookahead.type) {
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 6 /* NumericLiteral */:
	            case 8 /* StringLiteral */:
	            case 10 /* Template */:
	            case 9 /* RegularExpression */:
	                statement = this.parseExpressionStatement();
	                break;
	            case 7 /* Punctuator */:
	                var value = this.lookahead.value;
	                if (value === '{') {
	                    statement = this.parseBlock();
	                }
	                else if (value === '(') {
	                    statement = this.parseExpressionStatement();
	                }
	                else if (value === ';') {
	                    statement = this.parseEmptyStatement();
	                }
	                else {
	                    statement = this.parseExpressionStatement();
	                }
	                break;
	            case 3 /* Identifier */:
	                statement = this.matchAsyncFunction() ? this.parseFunctionDeclaration() : this.parseLabelledStatement();
	                break;
	            case 4 /* Keyword */:
	                switch (this.lookahead.value) {
	                    case 'break':
	                        statement = this.parseBreakStatement();
	                        break;
	                    case 'continue':
	                        statement = this.parseContinueStatement();
	                        break;
	                    case 'debugger':
	                        statement = this.parseDebuggerStatement();
	                        break;
	                    case 'do':
	                        statement = this.parseDoWhileStatement();
	                        break;
	                    case 'for':
	                        statement = this.parseForStatement();
	                        break;
	                    case 'function':
	                        statement = this.parseFunctionDeclaration();
	                        break;
	                    case 'if':
	                        statement = this.parseIfStatement();
	                        break;
	                    case 'return':
	                        statement = this.parseReturnStatement();
	                        break;
	                    case 'switch':
	                        statement = this.parseSwitchStatement();
	                        break;
	                    case 'throw':
	                        statement = this.parseThrowStatement();
	                        break;
	                    case 'try':
	                        statement = this.parseTryStatement();
	                        break;
	                    case 'var':
	                        statement = this.parseVariableStatement();
	                        break;
	                    case 'while':
	                        statement = this.parseWhileStatement();
	                        break;
	                    case 'with':
	                        statement = this.parseWithStatement();
	                        break;
	                    default:
	                        statement = this.parseExpressionStatement();
	                        break;
	                }
	                break;
	            default:
	                statement = this.throwUnexpectedToken(this.lookahead);
	        }
	        return statement;
	    };
	    // https://tc39.github.io/ecma262/#sec-function-definitions
	    Parser.prototype.parseFunctionSourceElements = function () {
	        var node = this.createNode();
	        this.expect('{');
	        var body = this.parseDirectivePrologues();
	        var previousLabelSet = this.context.labelSet;
	        var previousInIteration = this.context.inIteration;
	        var previousInSwitch = this.context.inSwitch;
	        var previousInFunctionBody = this.context.inFunctionBody;
	        this.context.labelSet = {};
	        this.context.inIteration = false;
	        this.context.inSwitch = false;
	        this.context.inFunctionBody = true;
	        while (this.lookahead.type !== 2 /* EOF */) {
	            if (this.match('}')) {
	                break;
	            }
	            body.push(this.parseStatementListItem());
	        }
	        this.expect('}');
	        this.context.labelSet = previousLabelSet;
	        this.context.inIteration = previousInIteration;
	        this.context.inSwitch = previousInSwitch;
	        this.context.inFunctionBody = previousInFunctionBody;
	        return this.finalize(node, new Node.BlockStatement(body));
	    };
	    Parser.prototype.validateParam = function (options, param, name) {
	        var key = '$' + name;
	        if (this.context.strict) {
	            if (this.scanner.isRestrictedWord(name)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamName;
	            }
	            if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamDupe;
	            }
	        }
	        else if (!options.firstRestricted) {
	            if (this.scanner.isRestrictedWord(name)) {
	                options.firstRestricted = param;
	                options.message = messages_1.Messages.StrictParamName;
	            }
	            else if (this.scanner.isStrictModeReservedWord(name)) {
	                options.firstRestricted = param;
	                options.message = messages_1.Messages.StrictReservedWord;
	            }
	            else if (Object.prototype.hasOwnProperty.call(options.paramSet, key)) {
	                options.stricted = param;
	                options.message = messages_1.Messages.StrictParamDupe;
	            }
	        }
	        /* istanbul ignore next */
	        if (typeof Object.defineProperty === 'function') {
	            Object.defineProperty(options.paramSet, key, { value: true, enumerable: true, writable: true, configurable: true });
	        }
	        else {
	            options.paramSet[key] = true;
	        }
	    };
	    Parser.prototype.parseRestElement = function (params) {
	        var node = this.createNode();
	        this.expect('...');
	        var arg = this.parsePattern(params);
	        if (this.match('=')) {
	            this.throwError(messages_1.Messages.DefaultRestParameter);
	        }
	        if (!this.match(')')) {
	            this.throwError(messages_1.Messages.ParameterAfterRestParameter);
	        }
	        return this.finalize(node, new Node.RestElement(arg));
	    };
	    Parser.prototype.parseFormalParameter = function (options) {
	        var params = [];
	        var param = this.match('...') ? this.parseRestElement(params) : this.parsePatternWithDefault(params);
	        for (var i = 0; i < params.length; i++) {
	            this.validateParam(options, params[i], params[i].value);
	        }
	        options.simple = options.simple && (param instanceof Node.Identifier);
	        options.params.push(param);
	    };
	    Parser.prototype.parseFormalParameters = function (firstRestricted) {
	        var options;
	        options = {
	            simple: true,
	            params: [],
	            firstRestricted: firstRestricted
	        };
	        this.expect('(');
	        if (!this.match(')')) {
	            options.paramSet = {};
	            while (this.lookahead.type !== 2 /* EOF */) {
	                this.parseFormalParameter(options);
	                if (this.match(')')) {
	                    break;
	                }
	                this.expect(',');
	                if (this.match(')')) {
	                    break;
	                }
	            }
	        }
	        this.expect(')');
	        return {
	            simple: options.simple,
	            params: options.params,
	            stricted: options.stricted,
	            firstRestricted: options.firstRestricted,
	            message: options.message
	        };
	    };
	    Parser.prototype.matchAsyncFunction = function () {
	        var match = this.matchContextualKeyword('async');
	        if (match) {
	            var state = this.scanner.saveState();
	            this.scanner.scanComments();
	            var next = this.scanner.lex();
	            this.scanner.restoreState(state);
	            match = (state.lineNumber === next.lineNumber) && (next.type === 4 /* Keyword */) && (next.value === 'function');
	        }
	        return match;
	    };
	    Parser.prototype.parseFunctionDeclaration = function (identifierIsOptional) {
	        var node = this.createNode();
	        var isAsync = this.matchContextualKeyword('async');
	        if (isAsync) {
	            this.nextToken();
	        }
	        this.expectKeyword('function');
	        var isGenerator = isAsync ? false : this.match('*');
	        if (isGenerator) {
	            this.nextToken();
	        }
	        var message;
	        var id = null;
	        var firstRestricted = null;
	        if (!identifierIsOptional || !this.match('(')) {
	            var token = this.lookahead;
	            id = this.parseVariableIdentifier();
	            if (this.context.strict) {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunctionName);
	                }
	            }
	            else {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictFunctionName;
	                }
	                else if (this.scanner.isStrictModeReservedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictReservedWord;
	                }
	            }
	        }
	        var previousAllowAwait = this.context.await;
	        var previousAllowYield = this.context.allowYield;
	        this.context.await = isAsync;
	        this.context.allowYield = !isGenerator;
	        var formalParameters = this.parseFormalParameters(firstRestricted);
	        var params = formalParameters.params;
	        var stricted = formalParameters.stricted;
	        firstRestricted = formalParameters.firstRestricted;
	        if (formalParameters.message) {
	            message = formalParameters.message;
	        }
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = formalParameters.simple;
	        var body = this.parseFunctionSourceElements();
	        if (this.context.strict && firstRestricted) {
	            this.throwUnexpectedToken(firstRestricted, message);
	        }
	        if (this.context.strict && stricted) {
	            this.tolerateUnexpectedToken(stricted, message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        this.context.await = previousAllowAwait;
	        this.context.allowYield = previousAllowYield;
	        return isAsync ? this.finalize(node, new Node.AsyncFunctionDeclaration(id, params, body)) :
	            this.finalize(node, new Node.FunctionDeclaration(id, params, body, isGenerator));
	    };
	    Parser.prototype.parseFunctionExpression = function () {
	        var node = this.createNode();
	        var isAsync = this.matchContextualKeyword('async');
	        if (isAsync) {
	            this.nextToken();
	        }
	        this.expectKeyword('function');
	        var isGenerator = isAsync ? false : this.match('*');
	        if (isGenerator) {
	            this.nextToken();
	        }
	        var message;
	        var id = null;
	        var firstRestricted;
	        var previousAllowAwait = this.context.await;
	        var previousAllowYield = this.context.allowYield;
	        this.context.await = isAsync;
	        this.context.allowYield = !isGenerator;
	        if (!this.match('(')) {
	            var token = this.lookahead;
	            id = (!this.context.strict && !isGenerator && this.matchKeyword('yield')) ? this.parseIdentifierName() : this.parseVariableIdentifier();
	            if (this.context.strict) {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.StrictFunctionName);
	                }
	            }
	            else {
	                if (this.scanner.isRestrictedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictFunctionName;
	                }
	                else if (this.scanner.isStrictModeReservedWord(token.value)) {
	                    firstRestricted = token;
	                    message = messages_1.Messages.StrictReservedWord;
	                }
	            }
	        }
	        var formalParameters = this.parseFormalParameters(firstRestricted);
	        var params = formalParameters.params;
	        var stricted = formalParameters.stricted;
	        firstRestricted = formalParameters.firstRestricted;
	        if (formalParameters.message) {
	            message = formalParameters.message;
	        }
	        var previousStrict = this.context.strict;
	        var previousAllowStrictDirective = this.context.allowStrictDirective;
	        this.context.allowStrictDirective = formalParameters.simple;
	        var body = this.parseFunctionSourceElements();
	        if (this.context.strict && firstRestricted) {
	            this.throwUnexpectedToken(firstRestricted, message);
	        }
	        if (this.context.strict && stricted) {
	            this.tolerateUnexpectedToken(stricted, message);
	        }
	        this.context.strict = previousStrict;
	        this.context.allowStrictDirective = previousAllowStrictDirective;
	        this.context.await = previousAllowAwait;
	        this.context.allowYield = previousAllowYield;
	        return isAsync ? this.finalize(node, new Node.AsyncFunctionExpression(id, params, body)) :
	            this.finalize(node, new Node.FunctionExpression(id, params, body, isGenerator));
	    };
	    // https://tc39.github.io/ecma262/#sec-directive-prologues-and-the-use-strict-directive
	    Parser.prototype.parseDirective = function () {
	        var token = this.lookahead;
	        var node = this.createNode();
	        var expr = this.parseExpression();
	        var directive = (expr.type === syntax_1.Syntax.Literal) ? this.getTokenRaw(token).slice(1, -1) : null;
	        this.consumeSemicolon();
	        return this.finalize(node, directive ? new Node.Directive(expr, directive) : new Node.ExpressionStatement(expr));
	    };
	    Parser.prototype.parseDirectivePrologues = function () {
	        var firstRestricted = null;
	        var body = [];
	        while (true) {
	            var token = this.lookahead;
	            if (token.type !== 8 /* StringLiteral */) {
	                break;
	            }
	            var statement = this.parseDirective();
	            body.push(statement);
	            var directive = statement.directive;
	            if (typeof directive !== 'string') {
	                break;
	            }
	            if (directive === 'use strict') {
	                this.context.strict = true;
	                if (firstRestricted) {
	                    this.tolerateUnexpectedToken(firstRestricted, messages_1.Messages.StrictOctalLiteral);
	                }
	                if (!this.context.allowStrictDirective) {
	                    this.tolerateUnexpectedToken(token, messages_1.Messages.IllegalLanguageModeDirective);
	                }
	            }
	            else {
	                if (!firstRestricted && token.octal) {
	                    firstRestricted = token;
	                }
	            }
	        }
	        return body;
	    };
	    // https://tc39.github.io/ecma262/#sec-method-definitions
	    Parser.prototype.qualifiedPropertyName = function (token) {
	        switch (token.type) {
	            case 3 /* Identifier */:
	            case 8 /* StringLiteral */:
	            case 1 /* BooleanLiteral */:
	            case 5 /* NullLiteral */:
	            case 6 /* NumericLiteral */:
	            case 4 /* Keyword */:
	                return true;
	            case 7 /* Punctuator */:
	                return token.value === '[';
	            default:
	                break;
	        }
	        return false;
	    };
	    Parser.prototype.parseGetterMethod = function () {
	        var node = this.createNode();
	        var isGenerator = false;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = false;
	        var formalParameters = this.parseFormalParameters();
	        if (formalParameters.params.length > 0) {
	            this.tolerateError(messages_1.Messages.BadGetterArity);
	        }
	        var method = this.parsePropertyMethod(formalParameters);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	    };
	    Parser.prototype.parseSetterMethod = function () {
	        var node = this.createNode();
	        var isGenerator = false;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = false;
	        var formalParameters = this.parseFormalParameters();
	        if (formalParameters.params.length !== 1) {
	            this.tolerateError(messages_1.Messages.BadSetterArity);
	        }
	        else if (formalParameters.params[0] instanceof Node.RestElement) {
	            this.tolerateError(messages_1.Messages.BadSetterRestParameter);
	        }
	        var method = this.parsePropertyMethod(formalParameters);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, formalParameters.params, method, isGenerator));
	    };
	    Parser.prototype.parseGeneratorMethod = function () {
	        var node = this.createNode();
	        var isGenerator = true;
	        var previousAllowYield = this.context.allowYield;
	        this.context.allowYield = true;
	        var params = this.parseFormalParameters();
	        this.context.allowYield = false;
	        var method = this.parsePropertyMethod(params);
	        this.context.allowYield = previousAllowYield;
	        return this.finalize(node, new Node.FunctionExpression(null, params.params, method, isGenerator));
	    };
	    // https://tc39.github.io/ecma262/#sec-generator-function-definitions
	    Parser.prototype.isStartOfExpression = function () {
	        var start = true;
	        var value = this.lookahead.value;
	        switch (this.lookahead.type) {
	            case 7 /* Punctuator */:
	                start = (value === '[') || (value === '(') || (value === '{') ||
	                    (value === '+') || (value === '-') ||
	                    (value === '!') || (value === '~') ||
	                    (value === '++') || (value === '--') ||
	                    (value === '/') || (value === '/='); // regular expression literal
	                break;
	            case 4 /* Keyword */:
	                start = (value === 'class') || (value === 'delete') ||
	                    (value === 'function') || (value === 'let') || (value === 'new') ||
	                    (value === 'super') || (value === 'this') || (value === 'typeof') ||
	                    (value === 'void') || (value === 'yield');
	                break;
	            default:
	                break;
	        }
	        return start;
	    };
	    Parser.prototype.parseYieldExpression = function () {
	        var node = this.createNode();
	        this.expectKeyword('yield');
	        var argument = null;
	        var delegate = false;
	        if (!this.hasLineTerminator) {
	            var previousAllowYield = this.context.allowYield;
	            this.context.allowYield = false;
	            delegate = this.match('*');
	            if (delegate) {
	                this.nextToken();
	                argument = this.parseAssignmentExpression();
	            }
	            else if (this.isStartOfExpression()) {
	                argument = this.parseAssignmentExpression();
	            }
	            this.context.allowYield = previousAllowYield;
	        }
	        return this.finalize(node, new Node.YieldExpression(argument, delegate));
	    };
	    // https://tc39.github.io/ecma262/#sec-class-definitions
	    Parser.prototype.parseClassElement = function (hasConstructor) {
	        var token = this.lookahead;
	        var node = this.createNode();
	        var kind = '';
	        var key = null;
	        var value = null;
	        var computed = false;
	        var method = false;
	        var isStatic = false;
	        var isAsync = false;
	        if (this.match('*')) {
	            this.nextToken();
	        }
	        else {
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            var id = key;
	            if (id.name === 'static' && (this.qualifiedPropertyName(this.lookahead) || this.match('*'))) {
	                token = this.lookahead;
	                isStatic = true;
	                computed = this.match('[');
	                if (this.match('*')) {
	                    this.nextToken();
	                }
	                else {
	                    key = this.parseObjectPropertyKey();
	                }
	            }
	            if ((token.type === 3 /* Identifier */) && !this.hasLineTerminator && (token.value === 'async')) {
	                var punctuator = this.lookahead.value;
	                if (punctuator !== ':' && punctuator !== '(' && punctuator !== '*') {
	                    isAsync = true;
	                    token = this.lookahead;
	                    key = this.parseObjectPropertyKey();
	                    if (token.type === 3 /* Identifier */) {
	                        if (token.value === 'get' || token.value === 'set') {
	                            this.tolerateUnexpectedToken(token);
	                        }
	                        else if (token.value === 'constructor') {
	                            this.tolerateUnexpectedToken(token, messages_1.Messages.ConstructorIsAsync);
	                        }
	                    }
	                }
	            }
	        }
	        var lookaheadPropertyKey = this.qualifiedPropertyName(this.lookahead);
	        if (token.type === 3 /* Identifier */) {
	            if (token.value === 'get' && lookaheadPropertyKey) {
	                kind = 'get';
	                computed = this.match('[');
	                key = this.parseObjectPropertyKey();
	                this.context.allowYield = false;
	                value = this.parseGetterMethod();
	            }
	            else if (token.value === 'set' && lookaheadPropertyKey) {
	                kind = 'set';
	                computed = this.match('[');
	                key = this.parseObjectPropertyKey();
	                value = this.parseSetterMethod();
	            }
	        }
	        else if (token.type === 7 /* Punctuator */ && token.value === '*' && lookaheadPropertyKey) {
	            kind = 'init';
	            computed = this.match('[');
	            key = this.parseObjectPropertyKey();
	            value = this.parseGeneratorMethod();
	            method = true;
	        }
	        if (!kind && key && this.match('(')) {
	            kind = 'init';
	            value = isAsync ? this.parsePropertyMethodAsyncFunction() : this.parsePropertyMethodFunction();
	            method = true;
	        }
	        if (!kind) {
	            this.throwUnexpectedToken(this.lookahead);
	        }
	        if (kind === 'init') {
	            kind = 'method';
	        }
	        if (!computed) {
	            if (isStatic && this.isPropertyKey(key, 'prototype')) {
	                this.throwUnexpectedToken(token, messages_1.Messages.StaticPrototype);
	            }
	            if (!isStatic && this.isPropertyKey(key, 'constructor')) {
	                if (kind !== 'method' || !method || (value && value.generator)) {
	                    this.throwUnexpectedToken(token, messages_1.Messages.ConstructorSpecialMethod);
	                }
	                if (hasConstructor.value) {
	                    this.throwUnexpectedToken(token, messages_1.Messages.DuplicateConstructor);
	                }
	                else {
	                    hasConstructor.value = true;
	                }
	                kind = 'constructor';
	            }
	        }
	        return this.finalize(node, new Node.MethodDefinition(key, computed, value, kind, isStatic));
	    };
	    Parser.prototype.parseClassElementList = function () {
	        var body = [];
	        var hasConstructor = { value: false };
	        this.expect('{');
	        while (!this.match('}')) {
	            if (this.match(';')) {
	                this.nextToken();
	            }
	            else {
	                body.push(this.parseClassElement(hasConstructor));
	            }
	        }
	        this.expect('}');
	        return body;
	    };
	    Parser.prototype.parseClassBody = function () {
	        var node = this.createNode();
	        var elementList = this.parseClassElementList();
	        return this.finalize(node, new Node.ClassBody(elementList));
	    };
	    Parser.prototype.parseClassDeclaration = function (identifierIsOptional) {
	        var node = this.createNode();
	        var previousStrict = this.context.strict;
	        this.context.strict = true;
	        this.expectKeyword('class');
	        var id = (identifierIsOptional && (this.lookahead.type !== 3 /* Identifier */)) ? null : this.parseVariableIdentifier();
	        var superClass = null;
	        if (this.matchKeyword('extends')) {
	            this.nextToken();
	            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	        }
	        var classBody = this.parseClassBody();
	        this.context.strict = previousStrict;
	        return this.finalize(node, new Node.ClassDeclaration(id, superClass, classBody));
	    };
	    Parser.prototype.parseClassExpression = function () {
	        var node = this.createNode();
	        var previousStrict = this.context.strict;
	        this.context.strict = true;
	        this.expectKeyword('class');
	        var id = (this.lookahead.type === 3 /* Identifier */) ? this.parseVariableIdentifier() : null;
	        var superClass = null;
	        if (this.matchKeyword('extends')) {
	            this.nextToken();
	            superClass = this.isolateCoverGrammar(this.parseLeftHandSideExpressionAllowCall);
	        }
	        var classBody = this.parseClassBody();
	        this.context.strict = previousStrict;
	        return this.finalize(node, new Node.ClassExpression(id, superClass, classBody));
	    };
	    // https://tc39.github.io/ecma262/#sec-scripts
	    // https://tc39.github.io/ecma262/#sec-modules
	    Parser.prototype.parseModule = function () {
	        this.context.strict = true;
	        this.context.isModule = true;
	        var node = this.createNode();
	        var body = this.parseDirectivePrologues();
	        while (this.lookahead.type !== 2 /* EOF */) {
	            body.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.Module(body));
	    };
	    Parser.prototype.parseScript = function () {
	        var node = this.createNode();
	        var body = this.parseDirectivePrologues();
	        while (this.lookahead.type !== 2 /* EOF */) {
	            body.push(this.parseStatementListItem());
	        }
	        return this.finalize(node, new Node.Script(body));
	    };
	    // https://tc39.github.io/ecma262/#sec-imports
	    Parser.prototype.parseModuleSpecifier = function () {
	        var node = this.createNode();
	        if (this.lookahead.type !== 8 /* StringLiteral */) {
	            this.throwError(messages_1.Messages.InvalidModuleSpecifier);
	        }
	        var token = this.nextToken();
	        var raw = this.getTokenRaw(token);
	        return this.finalize(node, new Node.Literal(token.value, raw));
	    };
	    // import {<foo as bar>} ...;
	    Parser.prototype.parseImportSpecifier = function () {
	        var node = this.createNode();
	        var imported;
	        var local;
	        if (this.lookahead.type === 3 /* Identifier */) {
	            imported = this.parseVariableIdentifier();
	            local = imported;
	            if (this.matchContextualKeyword('as')) {
	                this.nextToken();
	                local = this.parseVariableIdentifier();
	            }
	        }
	        else {
	            imported = this.parseIdentifierName();
	            local = imported;
	            if (this.matchContextualKeyword('as')) {
	                this.nextToken();
	                local = this.parseVariableIdentifier();
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	        }
	        return this.finalize(node, new Node.ImportSpecifier(local, imported));
	    };
	    // {foo, bar as bas}
	    Parser.prototype.parseNamedImports = function () {
	        this.expect('{');
	        var specifiers = [];
	        while (!this.match('}')) {
	            specifiers.push(this.parseImportSpecifier());
	            if (!this.match('}')) {
	                this.expect(',');
	            }
	        }
	        this.expect('}');
	        return specifiers;
	    };
	    // import <foo> ...;
	    Parser.prototype.parseImportDefaultSpecifier = function () {
	        var node = this.createNode();
	        var local = this.parseIdentifierName();
	        return this.finalize(node, new Node.ImportDefaultSpecifier(local));
	    };
	    // import <* as foo> ...;
	    Parser.prototype.parseImportNamespaceSpecifier = function () {
	        var node = this.createNode();
	        this.expect('*');
	        if (!this.matchContextualKeyword('as')) {
	            this.throwError(messages_1.Messages.NoAsAfterImportNamespace);
	        }
	        this.nextToken();
	        var local = this.parseIdentifierName();
	        return this.finalize(node, new Node.ImportNamespaceSpecifier(local));
	    };
	    Parser.prototype.parseImportDeclaration = function () {
	        if (this.context.inFunctionBody) {
	            this.throwError(messages_1.Messages.IllegalImportDeclaration);
	        }
	        var node = this.createNode();
	        this.expectKeyword('import');
	        var src;
	        var specifiers = [];
	        if (this.lookahead.type === 8 /* StringLiteral */) {
	            // import 'foo';
	            src = this.parseModuleSpecifier();
	        }
	        else {
	            if (this.match('{')) {
	                // import {bar}
	                specifiers = specifiers.concat(this.parseNamedImports());
	            }
	            else if (this.match('*')) {
	                // import * as foo
	                specifiers.push(this.parseImportNamespaceSpecifier());
	            }
	            else if (this.isIdentifierName(this.lookahead) && !this.matchKeyword('default')) {
	                // import foo
	                specifiers.push(this.parseImportDefaultSpecifier());
	                if (this.match(',')) {
	                    this.nextToken();
	                    if (this.match('*')) {
	                        // import foo, * as foo
	                        specifiers.push(this.parseImportNamespaceSpecifier());
	                    }
	                    else if (this.match('{')) {
	                        // import foo, {bar}
	                        specifiers = specifiers.concat(this.parseNamedImports());
	                    }
	                    else {
	                        this.throwUnexpectedToken(this.lookahead);
	                    }
	                }
	            }
	            else {
	                this.throwUnexpectedToken(this.nextToken());
	            }
	            if (!this.matchContextualKeyword('from')) {
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            this.nextToken();
	            src = this.parseModuleSpecifier();
	        }
	        this.consumeSemicolon();
	        return this.finalize(node, new Node.ImportDeclaration(specifiers, src));
	    };
	    // https://tc39.github.io/ecma262/#sec-exports
	    Parser.prototype.parseExportSpecifier = function () {
	        var node = this.createNode();
	        var local = this.parseIdentifierName();
	        var exported = local;
	        if (this.matchContextualKeyword('as')) {
	            this.nextToken();
	            exported = this.parseIdentifierName();
	        }
	        return this.finalize(node, new Node.ExportSpecifier(local, exported));
	    };
	    Parser.prototype.parseExportDeclaration = function () {
	        if (this.context.inFunctionBody) {
	            this.throwError(messages_1.Messages.IllegalExportDeclaration);
	        }
	        var node = this.createNode();
	        this.expectKeyword('export');
	        var exportDeclaration;
	        if (this.matchKeyword('default')) {
	            // export default ...
	            this.nextToken();
	            if (this.matchKeyword('function')) {
	                // export default function foo () {}
	                // export default function () {}
	                var declaration = this.parseFunctionDeclaration(true);
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else if (this.matchKeyword('class')) {
	                // export default class foo {}
	                var declaration = this.parseClassDeclaration(true);
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else if (this.matchContextualKeyword('async')) {
	                // export default async function f () {}
	                // export default async function () {}
	                // export default async x => x
	                var declaration = this.matchAsyncFunction() ? this.parseFunctionDeclaration(true) : this.parseAssignmentExpression();
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	            else {
	                if (this.matchContextualKeyword('from')) {
	                    this.throwError(messages_1.Messages.UnexpectedToken, this.lookahead.value);
	                }
	                // export default {};
	                // export default [];
	                // export default (1 + 2);
	                var declaration = this.match('{') ? this.parseObjectInitializer() :
	                    this.match('[') ? this.parseArrayInitializer() : this.parseAssignmentExpression();
	                this.consumeSemicolon();
	                exportDeclaration = this.finalize(node, new Node.ExportDefaultDeclaration(declaration));
	            }
	        }
	        else if (this.match('*')) {
	            // export * from 'foo';
	            this.nextToken();
	            if (!this.matchContextualKeyword('from')) {
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            this.nextToken();
	            var src = this.parseModuleSpecifier();
	            this.consumeSemicolon();
	            exportDeclaration = this.finalize(node, new Node.ExportAllDeclaration(src));
	        }
	        else if (this.lookahead.type === 4 /* Keyword */) {
	            // export var f = 1;
	            var declaration = void 0;
	            switch (this.lookahead.value) {
	                case 'let':
	                case 'const':
	                    declaration = this.parseLexicalDeclaration({ inFor: false });
	                    break;
	                case 'var':
	                case 'class':
	                case 'function':
	                    declaration = this.parseStatementListItem();
	                    break;
	                default:
	                    this.throwUnexpectedToken(this.lookahead);
	            }
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
	        }
	        else if (this.matchAsyncFunction()) {
	            var declaration = this.parseFunctionDeclaration();
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(declaration, [], null));
	        }
	        else {
	            var specifiers = [];
	            var source = null;
	            var isExportFromIdentifier = false;
	            this.expect('{');
	            while (!this.match('}')) {
	                isExportFromIdentifier = isExportFromIdentifier || this.matchKeyword('default');
	                specifiers.push(this.parseExportSpecifier());
	                if (!this.match('}')) {
	                    this.expect(',');
	                }
	            }
	            this.expect('}');
	            if (this.matchContextualKeyword('from')) {
	                // export {default} from 'foo';
	                // export {foo} from 'foo';
	                this.nextToken();
	                source = this.parseModuleSpecifier();
	                this.consumeSemicolon();
	            }
	            else if (isExportFromIdentifier) {
	                // export {default}; // missing fromClause
	                var message = this.lookahead.value ? messages_1.Messages.UnexpectedToken : messages_1.Messages.MissingFromClause;
	                this.throwError(message, this.lookahead.value);
	            }
	            else {
	                // export {foo};
	                this.consumeSemicolon();
	            }
	            exportDeclaration = this.finalize(node, new Node.ExportNamedDeclaration(null, specifiers, source));
	        }
	        return exportDeclaration;
	    };
	    return Parser;
	}());
	exports.Parser = Parser;


/***/ },
/* 9 */
/***/ function(module, exports) {

	"use strict";
	// Ensure the condition is true, otherwise throw an error.
	// This is only to have a better contract semantic, i.e. another safety net
	// to catch a logic error. The condition shall be fulfilled in normal case.
	// Do NOT use this to enforce a certain condition on any user input.
	Object.defineProperty(exports, "__esModule", { value: true });
	function assert(condition, message) {
	    /* istanbul ignore if */
	    if (!condition) {
	        throw new Error('ASSERT: ' + message);
	    }
	}
	exports.assert = assert;


/***/ },
/* 10 */
/***/ function(module, exports) {

	"use strict";
	/* tslint:disable:max-classes-per-file */
	Object.defineProperty(exports, "__esModule", { value: true });
	var ErrorHandler = (function () {
	    function ErrorHandler() {
	        this.errors = [];
	        this.tolerant = false;
	    }
	    ErrorHandler.prototype.recordError = function (error) {
	        this.errors.push(error);
	    };
	    ErrorHandler.prototype.tolerate = function (error) {
	        if (this.tolerant) {
	            this.recordError(error);
	        }
	        else {
	            throw error;
	        }
	    };
	    ErrorHandler.prototype.constructError = function (msg, column) {
	        var error = new Error(msg);
	        try {
	            throw error;
	        }
	        catch (base) {
	            /* istanbul ignore else */
	            if (Object.create && Object.defineProperty) {
	                error = Object.create(base);
	                Object.defineProperty(error, 'column', { value: column });
	            }
	        }
	        /* istanbul ignore next */
	        return error;
	    };
	    ErrorHandler.prototype.createError = function (index, line, col, description) {
	        var msg = 'Line ' + line + ': ' + description;
	        var error = this.constructError(msg, col);
	        error.index = index;
	        error.lineNumber = line;
	        error.description = description;
	        return error;
	    };
	    ErrorHandler.prototype.throwError = function (index, line, col, description) {
	        throw this.createError(index, line, col, description);
	    };
	    ErrorHandler.prototype.tolerateError = function (index, line, col, description) {
	        var error = this.createError(index, line, col, description);
	        if (this.tolerant) {
	            this.recordError(error);
	        }
	        else {
	            throw error;
	        }
	    };
	    return ErrorHandler;
	}());
	exports.ErrorHandler = ErrorHandler;


/***/ },
/* 11 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	// Error messages should be identical to V8.
	exports.Messages = {
	    BadGetterArity: 'Getter must not have any formal parameters',
	    BadSetterArity: 'Setter must have exactly one formal parameter',
	    BadSetterRestParameter: 'Setter function argument must not be a rest parameter',
	    ConstructorIsAsync: 'Class constructor may not be an async method',
	    ConstructorSpecialMethod: 'Class constructor may not be an accessor',
	    DeclarationMissingInitializer: 'Missing initializer in %0 declaration',
	    DefaultRestParameter: 'Unexpected token =',
	    DuplicateBinding: 'Duplicate binding %0',
	    DuplicateConstructor: 'A class may only have one constructor',
	    DuplicateProtoProperty: 'Duplicate __proto__ fields are not allowed in object literals',
	    ForInOfLoopInitializer: '%0 loop variable declaration may not have an initializer',
	    GeneratorInLegacyContext: 'Generator declarations are not allowed in legacy contexts',
	    IllegalBreak: 'Illegal break statement',
	    IllegalContinue: 'Illegal continue statement',
	    IllegalExportDeclaration: 'Unexpected token',
	    IllegalImportDeclaration: 'Unexpected token',
	    IllegalLanguageModeDirective: 'Illegal \'use strict\' directive in function with non-simple parameter list',
	    IllegalReturn: 'Illegal return statement',
	    InvalidEscapedReservedWord: 'Keyword must not contain escaped characters',
	    InvalidHexEscapeSequence: 'Invalid hexadecimal escape sequence',
	    InvalidLHSInAssignment: 'Invalid left-hand side in assignment',
	    InvalidLHSInForIn: 'Invalid left-hand side in for-in',
	    InvalidLHSInForLoop: 'Invalid left-hand side in for-loop',
	    InvalidModuleSpecifier: 'Unexpected token',
	    InvalidRegExp: 'Invalid regular expression',
	    LetInLexicalBinding: 'let is disallowed as a lexically bound name',
	    MissingFromClause: 'Unexpected token',
	    MultipleDefaultsInSwitch: 'More than one default clause in switch statement',
	    NewlineAfterThrow: 'Illegal newline after throw',
	    NoAsAfterImportNamespace: 'Unexpected token',
	    NoCatchOrFinally: 'Missing catch or finally after try',
	    ParameterAfterRestParameter: 'Rest parameter must be last formal parameter',
	    Redeclaration: '%0 \'%1\' has already been declared',
	    StaticPrototype: 'Classes may not have static property named prototype',
	    StrictCatchVariable: 'Catch variable may not be eval or arguments in strict mode',
	    StrictDelete: 'Delete of an unqualified identifier in strict mode.',
	    StrictFunction: 'In strict mode code, functions can only be declared at top level or inside a block',
	    StrictFunctionName: 'Function name may not be eval or arguments in strict mode',
	    StrictLHSAssignment: 'Assignment to eval or arguments is not allowed in strict mode',
	    StrictLHSPostfix: 'Postfix increment/decrement may not have eval or arguments operand in strict mode',
	    StrictLHSPrefix: 'Prefix increment/decrement may not have eval or arguments operand in strict mode',
	    StrictModeWith: 'Strict mode code may not include a with statement',
	    StrictOctalLiteral: 'Octal literals are not allowed in strict mode.',
	    StrictParamDupe: 'Strict mode function may not have duplicate parameter names',
	    StrictParamName: 'Parameter name eval or arguments is not allowed in strict mode',
	    StrictReservedWord: 'Use of future reserved word in strict mode',
	    StrictVarName: 'Variable name may not be eval or arguments in strict mode',
	    TemplateOctalLiteral: 'Octal literals are not allowed in template strings.',
	    UnexpectedEOS: 'Unexpected end of input',
	    UnexpectedIdentifier: 'Unexpected identifier',
	    UnexpectedNumber: 'Unexpected number',
	    UnexpectedReserved: 'Unexpected reserved word',
	    UnexpectedString: 'Unexpected string',
	    UnexpectedTemplate: 'Unexpected quasi %0',
	    UnexpectedToken: 'Unexpected token %0',
	    UnexpectedTokenIllegal: 'Unexpected token ILLEGAL',
	    UnknownLabel: 'Undefined label \'%0\'',
	    UnterminatedRegExp: 'Invalid regular expression: missing /'
	};


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var assert_1 = __webpack_require__(9);
	var character_1 = __webpack_require__(4);
	var messages_1 = __webpack_require__(11);
	function hexValue(ch) {
	    return '0123456789abcdef'.indexOf(ch.toLowerCase());
	}
	function octalValue(ch) {
	    return '01234567'.indexOf(ch);
	}
	var Scanner = (function () {
	    function Scanner(code, handler) {
	        this.source = code;
	        this.errorHandler = handler;
	        this.trackComment = false;
	        this.length = code.length;
	        this.index = 0;
	        this.lineNumber = (code.length > 0) ? 1 : 0;
	        this.lineStart = 0;
	        this.curlyStack = [];
	    }
	    Scanner.prototype.saveState = function () {
	        return {
	            index: this.index,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart
	        };
	    };
	    Scanner.prototype.restoreState = function (state) {
	        this.index = state.index;
	        this.lineNumber = state.lineNumber;
	        this.lineStart = state.lineStart;
	    };
	    Scanner.prototype.eof = function () {
	        return this.index >= this.length;
	    };
	    Scanner.prototype.throwUnexpectedToken = function (message) {
	        if (message === void 0) { message = messages_1.Messages.UnexpectedTokenIllegal; }
	        return this.errorHandler.throwError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	    };
	    Scanner.prototype.tolerateUnexpectedToken = function (message) {
	        if (message === void 0) { message = messages_1.Messages.UnexpectedTokenIllegal; }
	        this.errorHandler.tolerateError(this.index, this.lineNumber, this.index - this.lineStart + 1, message);
	    };
	    // https://tc39.github.io/ecma262/#sec-comments
	    Scanner.prototype.skipSingleLineComment = function (offset) {
	        var comments = [];
	        var start, loc;
	        if (this.trackComment) {
	            comments = [];
	            start = this.index - offset;
	            loc = {
	                start: {
	                    line: this.lineNumber,
	                    column: this.index - this.lineStart - offset
	                },
	                end: {}
	            };
	        }
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            ++this.index;
	            if (character_1.Character.isLineTerminator(ch)) {
	                if (this.trackComment) {
	                    loc.end = {
	                        line: this.lineNumber,
	                        column: this.index - this.lineStart - 1
	                    };
	                    var entry = {
	                        multiLine: false,
	                        slice: [start + offset, this.index - 1],
	                        range: [start, this.index - 1],
	                        loc: loc
	                    };
	                    comments.push(entry);
	                }
	                if (ch === 13 && this.source.charCodeAt(this.index) === 10) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                this.lineStart = this.index;
	                return comments;
	            }
	        }
	        if (this.trackComment) {
	            loc.end = {
	                line: this.lineNumber,
	                column: this.index - this.lineStart
	            };
	            var entry = {
	                multiLine: false,
	                slice: [start + offset, this.index],
	                range: [start, this.index],
	                loc: loc
	            };
	            comments.push(entry);
	        }
	        return comments;
	    };
	    Scanner.prototype.skipMultiLineComment = function () {
	        var comments = [];
	        var start, loc;
	        if (this.trackComment) {
	            comments = [];
	            start = this.index - 2;
	            loc = {
	                start: {
	                    line: this.lineNumber,
	                    column: this.index - this.lineStart - 2
	                },
	                end: {}
	            };
	        }
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (character_1.Character.isLineTerminator(ch)) {
	                if (ch === 0x0D && this.source.charCodeAt(this.index + 1) === 0x0A) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                ++this.index;
	                this.lineStart = this.index;
	            }
	            else if (ch === 0x2A) {
	                // Block comment ends with '*/'.
	                if (this.source.charCodeAt(this.index + 1) === 0x2F) {
	                    this.index += 2;
	                    if (this.trackComment) {
	                        loc.end = {
	                            line: this.lineNumber,
	                            column: this.index - this.lineStart
	                        };
	                        var entry = {
	                            multiLine: true,
	                            slice: [start + 2, this.index - 2],
	                            range: [start, this.index],
	                            loc: loc
	                        };
	                        comments.push(entry);
	                    }
	                    return comments;
	                }
	                ++this.index;
	            }
	            else {
	                ++this.index;
	            }
	        }
	        // Ran off the end of the file - the whole thing is a comment
	        if (this.trackComment) {
	            loc.end = {
	                line: this.lineNumber,
	                column: this.index - this.lineStart
	            };
	            var entry = {
	                multiLine: true,
	                slice: [start + 2, this.index],
	                range: [start, this.index],
	                loc: loc
	            };
	            comments.push(entry);
	        }
	        this.tolerateUnexpectedToken();
	        return comments;
	    };
	    Scanner.prototype.scanComments = function () {
	        var comments;
	        if (this.trackComment) {
	            comments = [];
	        }
	        var start = (this.index === 0);
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (character_1.Character.isWhiteSpace(ch)) {
	                ++this.index;
	            }
	            else if (character_1.Character.isLineTerminator(ch)) {
	                ++this.index;
	                if (ch === 0x0D && this.source.charCodeAt(this.index) === 0x0A) {
	                    ++this.index;
	                }
	                ++this.lineNumber;
	                this.lineStart = this.index;
	                start = true;
	            }
	            else if (ch === 0x2F) {
	                ch = this.source.charCodeAt(this.index + 1);
	                if (ch === 0x2F) {
	                    this.index += 2;
	                    var comment = this.skipSingleLineComment(2);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                    start = true;
	                }
	                else if (ch === 0x2A) {
	                    this.index += 2;
	                    var comment = this.skipMultiLineComment();
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else if (start && ch === 0x2D) {
	                // U+003E is '>'
	                if ((this.source.charCodeAt(this.index + 1) === 0x2D) && (this.source.charCodeAt(this.index + 2) === 0x3E)) {
	                    // '-->' is a single-line comment
	                    this.index += 3;
	                    var comment = this.skipSingleLineComment(3);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else if (ch === 0x3C) {
	                if (this.source.slice(this.index + 1, this.index + 4) === '!--') {
	                    this.index += 4; // `<!--`
	                    var comment = this.skipSingleLineComment(4);
	                    if (this.trackComment) {
	                        comments = comments.concat(comment);
	                    }
	                }
	                else {
	                    break;
	                }
	            }
	            else {
	                break;
	            }
	        }
	        return comments;
	    };
	    // https://tc39.github.io/ecma262/#sec-future-reserved-words
	    Scanner.prototype.isFutureReservedWord = function (id) {
	        switch (id) {
	            case 'enum':
	            case 'export':
	            case 'import':
	            case 'super':
	                return true;
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.isStrictModeReservedWord = function (id) {
	        switch (id) {
	            case 'implements':
	            case 'interface':
	            case 'package':
	            case 'private':
	            case 'protected':
	            case 'public':
	            case 'static':
	            case 'yield':
	            case 'let':
	                return true;
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.isRestrictedWord = function (id) {
	        return id === 'eval' || id === 'arguments';
	    };
	    // https://tc39.github.io/ecma262/#sec-keywords
	    Scanner.prototype.isKeyword = function (id) {
	        switch (id.length) {
	            case 2:
	                return (id === 'if') || (id === 'in') || (id === 'do');
	            case 3:
	                return (id === 'var') || (id === 'for') || (id === 'new') ||
	                    (id === 'try') || (id === 'let');
	            case 4:
	                return (id === 'this') || (id === 'else') || (id === 'case') ||
	                    (id === 'void') || (id === 'with') || (id === 'enum');
	            case 5:
	                return (id === 'while') || (id === 'break') || (id === 'catch') ||
	                    (id === 'throw') || (id === 'const') || (id === 'yield') ||
	                    (id === 'class') || (id === 'super');
	            case 6:
	                return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
	                    (id === 'switch') || (id === 'export') || (id === 'import');
	            case 7:
	                return (id === 'default') || (id === 'finally') || (id === 'extends');
	            case 8:
	                return (id === 'function') || (id === 'continue') || (id === 'debugger');
	            case 10:
	                return (id === 'instanceof');
	            default:
	                return false;
	        }
	    };
	    Scanner.prototype.codePointAt = function (i) {
	        var cp = this.source.charCodeAt(i);
	        if (cp >= 0xD800 && cp <= 0xDBFF) {
	            var second = this.source.charCodeAt(i + 1);
	            if (second >= 0xDC00 && second <= 0xDFFF) {
	                var first = cp;
	                cp = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
	            }
	        }
	        return cp;
	    };
	    Scanner.prototype.scanHexEscape = function (prefix) {
	        var len = (prefix === 'u') ? 4 : 2;
	        var code = 0;
	        for (var i = 0; i < len; ++i) {
	            if (!this.eof() && character_1.Character.isHexDigit(this.source.charCodeAt(this.index))) {
	                code = code * 16 + hexValue(this.source[this.index++]);
	            }
	            else {
	                return null;
	            }
	        }
	        return String.fromCharCode(code);
	    };
	    Scanner.prototype.scanUnicodeCodePointEscape = function () {
	        var ch = this.source[this.index];
	        var code = 0;
	        // At least, one hex digit is required.
	        if (ch === '}') {
	            this.throwUnexpectedToken();
	        }
	        while (!this.eof()) {
	            ch = this.source[this.index++];
	            if (!character_1.Character.isHexDigit(ch.charCodeAt(0))) {
	                break;
	            }
	            code = code * 16 + hexValue(ch);
	        }
	        if (code > 0x10FFFF || ch !== '}') {
	            this.throwUnexpectedToken();
	        }
	        return character_1.Character.fromCodePoint(code);
	    };
	    Scanner.prototype.getIdentifier = function () {
	        var start = this.index++;
	        while (!this.eof()) {
	            var ch = this.source.charCodeAt(this.index);
	            if (ch === 0x5C) {
	                // Blackslash (U+005C) marks Unicode escape sequence.
	                this.index = start;
	                return this.getComplexIdentifier();
	            }
	            else if (ch >= 0xD800 && ch < 0xDFFF) {
	                // Need to handle surrogate pairs.
	                this.index = start;
	                return this.getComplexIdentifier();
	            }
	            if (character_1.Character.isIdentifierPart(ch)) {
	                ++this.index;
	            }
	            else {
	                break;
	            }
	        }
	        return this.source.slice(start, this.index);
	    };
	    Scanner.prototype.getComplexIdentifier = function () {
	        var cp = this.codePointAt(this.index);
	        var id = character_1.Character.fromCodePoint(cp);
	        this.index += id.length;
	        // '\u' (U+005C, U+0075) denotes an escaped character.
	        var ch;
	        if (cp === 0x5C) {
	            if (this.source.charCodeAt(this.index) !== 0x75) {
	                this.throwUnexpectedToken();
	            }
	            ++this.index;
	            if (this.source[this.index] === '{') {
	                ++this.index;
	                ch = this.scanUnicodeCodePointEscape();
	            }
	            else {
	                ch = this.scanHexEscape('u');
	                if (ch === null || ch === '\\' || !character_1.Character.isIdentifierStart(ch.charCodeAt(0))) {
	                    this.throwUnexpectedToken();
	                }
	            }
	            id = ch;
	        }
	        while (!this.eof()) {
	            cp = this.codePointAt(this.index);
	            if (!character_1.Character.isIdentifierPart(cp)) {
	                break;
	            }
	            ch = character_1.Character.fromCodePoint(cp);
	            id += ch;
	            this.index += ch.length;
	            // '\u' (U+005C, U+0075) denotes an escaped character.
	            if (cp === 0x5C) {
	                id = id.substr(0, id.length - 1);
	                if (this.source.charCodeAt(this.index) !== 0x75) {
	                    this.throwUnexpectedToken();
	                }
	                ++this.index;
	                if (this.source[this.index] === '{') {
	                    ++this.index;
	                    ch = this.scanUnicodeCodePointEscape();
	                }
	                else {
	                    ch = this.scanHexEscape('u');
	                    if (ch === null || ch === '\\' || !character_1.Character.isIdentifierPart(ch.charCodeAt(0))) {
	                        this.throwUnexpectedToken();
	                    }
	                }
	                id += ch;
	            }
	        }
	        return id;
	    };
	    Scanner.prototype.octalToDecimal = function (ch) {
	        // \0 is not octal escape sequence
	        var octal = (ch !== '0');
	        var code = octalValue(ch);
	        if (!this.eof() && character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	            octal = true;
	            code = code * 8 + octalValue(this.source[this.index++]);
	            // 3 digits are only allowed when string starts
	            // with 0, 1, 2, 3
	            if ('0123'.indexOf(ch) >= 0 && !this.eof() && character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	                code = code * 8 + octalValue(this.source[this.index++]);
	            }
	        }
	        return {
	            code: code,
	            octal: octal
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-names-and-keywords
	    Scanner.prototype.scanIdentifier = function () {
	        var type;
	        var start = this.index;
	        // Backslash (U+005C) starts an escaped character.
	        var id = (this.source.charCodeAt(start) === 0x5C) ? this.getComplexIdentifier() : this.getIdentifier();
	        // There is no keyword or literal with only one character.
	        // Thus, it must be an identifier.
	        if (id.length === 1) {
	            type = 3 /* Identifier */;
	        }
	        else if (this.isKeyword(id)) {
	            type = 4 /* Keyword */;
	        }
	        else if (id === 'null') {
	            type = 5 /* NullLiteral */;
	        }
	        else if (id === 'true' || id === 'false') {
	            type = 1 /* BooleanLiteral */;
	        }
	        else {
	            type = 3 /* Identifier */;
	        }
	        if (type !== 3 /* Identifier */ && (start + id.length !== this.index)) {
	            var restore = this.index;
	            this.index = start;
	            this.tolerateUnexpectedToken(messages_1.Messages.InvalidEscapedReservedWord);
	            this.index = restore;
	        }
	        return {
	            type: type,
	            value: id,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-punctuators
	    Scanner.prototype.scanPunctuator = function () {
	        var start = this.index;
	        // Check for most common single-character punctuators.
	        var str = this.source[this.index];
	        switch (str) {
	            case '(':
	            case '{':
	                if (str === '{') {
	                    this.curlyStack.push('{');
	                }
	                ++this.index;
	                break;
	            case '.':
	                ++this.index;
	                if (this.source[this.index] === '.' && this.source[this.index + 1] === '.') {
	                    // Spread operator: ...
	                    this.index += 2;
	                    str = '...';
	                }
	                break;
	            case '}':
	                ++this.index;
	                this.curlyStack.pop();
	                break;
	            case ')':
	            case ';':
	            case ',':
	            case '[':
	            case ']':
	            case ':':
	            case '?':
	            case '~':
	                ++this.index;
	                break;
	            default:
	                // 4-character punctuator.
	                str = this.source.substr(this.index, 4);
	                if (str === '>>>=') {
	                    this.index += 4;
	                }
	                else {
	                    // 3-character punctuators.
	                    str = str.substr(0, 3);
	                    if (str === '===' || str === '!==' || str === '>>>' ||
	                        str === '<<=' || str === '>>=' || str === '**=') {
	                        this.index += 3;
	                    }
	                    else {
	                        // 2-character punctuators.
	                        str = str.substr(0, 2);
	                        if (str === '&&' || str === '||' || str === '==' || str === '!=' ||
	                            str === '+=' || str === '-=' || str === '*=' || str === '/=' ||
	                            str === '++' || str === '--' || str === '<<' || str === '>>' ||
	                            str === '&=' || str === '|=' || str === '^=' || str === '%=' ||
	                            str === '<=' || str === '>=' || str === '=>' || str === '**') {
	                            this.index += 2;
	                        }
	                        else {
	                            // 1-character punctuators.
	                            str = this.source[this.index];
	                            if ('<>=!+-*%&|^/'.indexOf(str) >= 0) {
	                                ++this.index;
	                            }
	                        }
	                    }
	                }
	        }
	        if (this.index === start) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 7 /* Punctuator */,
	            value: str,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-numeric-literals
	    Scanner.prototype.scanHexLiteral = function (start) {
	        var num = '';
	        while (!this.eof()) {
	            if (!character_1.Character.isHexDigit(this.source.charCodeAt(this.index))) {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (num.length === 0) {
	            this.throwUnexpectedToken();
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt('0x' + num, 16),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.scanBinaryLiteral = function (start) {
	        var num = '';
	        var ch;
	        while (!this.eof()) {
	            ch = this.source[this.index];
	            if (ch !== '0' && ch !== '1') {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (num.length === 0) {
	            // only 0b or 0B
	            this.throwUnexpectedToken();
	        }
	        if (!this.eof()) {
	            ch = this.source.charCodeAt(this.index);
	            /* istanbul ignore else */
	            if (character_1.Character.isIdentifierStart(ch) || character_1.Character.isDecimalDigit(ch)) {
	                this.throwUnexpectedToken();
	            }
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt(num, 2),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.scanOctalLiteral = function (prefix, start) {
	        var num = '';
	        var octal = false;
	        if (character_1.Character.isOctalDigit(prefix.charCodeAt(0))) {
	            octal = true;
	            num = '0' + this.source[this.index++];
	        }
	        else {
	            ++this.index;
	        }
	        while (!this.eof()) {
	            if (!character_1.Character.isOctalDigit(this.source.charCodeAt(this.index))) {
	                break;
	            }
	            num += this.source[this.index++];
	        }
	        if (!octal && num.length === 0) {
	            // only 0o or 0O
	            this.throwUnexpectedToken();
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index)) || character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseInt(num, 8),
	            octal: octal,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.isImplicitOctalLiteral = function () {
	        // Implicit octal, unless there is a non-octal digit.
	        // (Annex B.1.1 on Numeric Literals)
	        for (var i = this.index + 1; i < this.length; ++i) {
	            var ch = this.source[i];
	            if (ch === '8' || ch === '9') {
	                return false;
	            }
	            if (!character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                return true;
	            }
	        }
	        return true;
	    };
	    Scanner.prototype.scanNumericLiteral = function () {
	        var start = this.index;
	        var ch = this.source[start];
	        assert_1.assert(character_1.Character.isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'), 'Numeric literal must start with a decimal digit or a decimal point');
	        var num = '';
	        if (ch !== '.') {
	            num = this.source[this.index++];
	            ch = this.source[this.index];
	            // Hex number starts with '0x'.
	            // Octal number starts with '0'.
	            // Octal number in ES6 starts with '0o'.
	            // Binary number in ES6 starts with '0b'.
	            if (num === '0') {
	                if (ch === 'x' || ch === 'X') {
	                    ++this.index;
	                    return this.scanHexLiteral(start);
	                }
	                if (ch === 'b' || ch === 'B') {
	                    ++this.index;
	                    return this.scanBinaryLiteral(start);
	                }
	                if (ch === 'o' || ch === 'O') {
	                    return this.scanOctalLiteral(ch, start);
	                }
	                if (ch && character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                    if (this.isImplicitOctalLiteral()) {
	                        return this.scanOctalLiteral(ch, start);
	                    }
	                }
	            }
	            while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                num += this.source[this.index++];
	            }
	            ch = this.source[this.index];
	        }
	        if (ch === '.') {
	            num += this.source[this.index++];
	            while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                num += this.source[this.index++];
	            }
	            ch = this.source[this.index];
	        }
	        if (ch === 'e' || ch === 'E') {
	            num += this.source[this.index++];
	            ch = this.source[this.index];
	            if (ch === '+' || ch === '-') {
	                num += this.source[this.index++];
	            }
	            if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                while (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                    num += this.source[this.index++];
	                }
	            }
	            else {
	                this.throwUnexpectedToken();
	            }
	        }
	        if (character_1.Character.isIdentifierStart(this.source.charCodeAt(this.index))) {
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 6 /* NumericLiteral */,
	            value: parseFloat(num),
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-string-literals
	    Scanner.prototype.scanStringLiteral = function () {
	        var start = this.index;
	        var quote = this.source[start];
	        assert_1.assert((quote === '\'' || quote === '"'), 'String literal must starts with a quote');
	        ++this.index;
	        var octal = false;
	        var str = '';
	        while (!this.eof()) {
	            var ch = this.source[this.index++];
	            if (ch === quote) {
	                quote = '';
	                break;
	            }
	            else if (ch === '\\') {
	                ch = this.source[this.index++];
	                if (!ch || !character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                        case 'u':
	                            if (this.source[this.index] === '{') {
	                                ++this.index;
	                                str += this.scanUnicodeCodePointEscape();
	                            }
	                            else {
	                                var unescaped_1 = this.scanHexEscape(ch);
	                                if (unescaped_1 === null) {
	                                    this.throwUnexpectedToken();
	                                }
	                                str += unescaped_1;
	                            }
	                            break;
	                        case 'x':
	                            var unescaped = this.scanHexEscape(ch);
	                            if (unescaped === null) {
	                                this.throwUnexpectedToken(messages_1.Messages.InvalidHexEscapeSequence);
	                            }
	                            str += unescaped;
	                            break;
	                        case 'n':
	                            str += '\n';
	                            break;
	                        case 'r':
	                            str += '\r';
	                            break;
	                        case 't':
	                            str += '\t';
	                            break;
	                        case 'b':
	                            str += '\b';
	                            break;
	                        case 'f':
	                            str += '\f';
	                            break;
	                        case 'v':
	                            str += '\x0B';
	                            break;
	                        case '8':
	                        case '9':
	                            str += ch;
	                            this.tolerateUnexpectedToken();
	                            break;
	                        default:
	                            if (ch && character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                                var octToDec = this.octalToDecimal(ch);
	                                octal = octToDec.octal || octal;
	                                str += String.fromCharCode(octToDec.code);
	                            }
	                            else {
	                                str += ch;
	                            }
	                            break;
	                    }
	                }
	                else {
	                    ++this.lineNumber;
	                    if (ch === '\r' && this.source[this.index] === '\n') {
	                        ++this.index;
	                    }
	                    this.lineStart = this.index;
	                }
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                break;
	            }
	            else {
	                str += ch;
	            }
	        }
	        if (quote !== '') {
	            this.index = start;
	            this.throwUnexpectedToken();
	        }
	        return {
	            type: 8 /* StringLiteral */,
	            value: str,
	            octal: octal,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-template-literal-lexical-components
	    Scanner.prototype.scanTemplate = function () {
	        var cooked = '';
	        var terminated = false;
	        var start = this.index;
	        var head = (this.source[start] === '`');
	        var tail = false;
	        var rawOffset = 2;
	        ++this.index;
	        while (!this.eof()) {
	            var ch = this.source[this.index++];
	            if (ch === '`') {
	                rawOffset = 1;
	                tail = true;
	                terminated = true;
	                break;
	            }
	            else if (ch === '$') {
	                if (this.source[this.index] === '{') {
	                    this.curlyStack.push('${');
	                    ++this.index;
	                    terminated = true;
	                    break;
	                }
	                cooked += ch;
	            }
	            else if (ch === '\\') {
	                ch = this.source[this.index++];
	                if (!character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    switch (ch) {
	                        case 'n':
	                            cooked += '\n';
	                            break;
	                        case 'r':
	                            cooked += '\r';
	                            break;
	                        case 't':
	                            cooked += '\t';
	                            break;
	                        case 'u':
	                            if (this.source[this.index] === '{') {
	                                ++this.index;
	                                cooked += this.scanUnicodeCodePointEscape();
	                            }
	                            else {
	                                var restore = this.index;
	                                var unescaped_2 = this.scanHexEscape(ch);
	                                if (unescaped_2 !== null) {
	                                    cooked += unescaped_2;
	                                }
	                                else {
	                                    this.index = restore;
	                                    cooked += ch;
	                                }
	                            }
	                            break;
	                        case 'x':
	                            var unescaped = this.scanHexEscape(ch);
	                            if (unescaped === null) {
	                                this.throwUnexpectedToken(messages_1.Messages.InvalidHexEscapeSequence);
	                            }
	                            cooked += unescaped;
	                            break;
	                        case 'b':
	                            cooked += '\b';
	                            break;
	                        case 'f':
	                            cooked += '\f';
	                            break;
	                        case 'v':
	                            cooked += '\v';
	                            break;
	                        default:
	                            if (ch === '0') {
	                                if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index))) {
	                                    // Illegal: \01 \02 and so on
	                                    this.throwUnexpectedToken(messages_1.Messages.TemplateOctalLiteral);
	                                }
	                                cooked += '\0';
	                            }
	                            else if (character_1.Character.isOctalDigit(ch.charCodeAt(0))) {
	                                // Illegal: \1 \2
	                                this.throwUnexpectedToken(messages_1.Messages.TemplateOctalLiteral);
	                            }
	                            else {
	                                cooked += ch;
	                            }
	                            break;
	                    }
	                }
	                else {
	                    ++this.lineNumber;
	                    if (ch === '\r' && this.source[this.index] === '\n') {
	                        ++this.index;
	                    }
	                    this.lineStart = this.index;
	                }
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                ++this.lineNumber;
	                if (ch === '\r' && this.source[this.index] === '\n') {
	                    ++this.index;
	                }
	                this.lineStart = this.index;
	                cooked += '\n';
	            }
	            else {
	                cooked += ch;
	            }
	        }
	        if (!terminated) {
	            this.throwUnexpectedToken();
	        }
	        if (!head) {
	            this.curlyStack.pop();
	        }
	        return {
	            type: 10 /* Template */,
	            value: this.source.slice(start + 1, this.index - rawOffset),
	            cooked: cooked,
	            head: head,
	            tail: tail,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
	    Scanner.prototype.testRegExp = function (pattern, flags) {
	        // The BMP character to use as a replacement for astral symbols when
	        // translating an ES6 "u"-flagged pattern to an ES5-compatible
	        // approximation.
	        // Note: replacing with '\uFFFF' enables false positives in unlikely
	        // scenarios. For example, `[\u{1044f}-\u{10440}]` is an invalid
	        // pattern that would not be detected by this substitution.
	        var astralSubstitute = '\uFFFF';
	        var tmp = pattern;
	        var self = this;
	        if (flags.indexOf('u') >= 0) {
	            tmp = tmp
	                .replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g, function ($0, $1, $2) {
	                var codePoint = parseInt($1 || $2, 16);
	                if (codePoint > 0x10FFFF) {
	                    self.throwUnexpectedToken(messages_1.Messages.InvalidRegExp);
	                }
	                if (codePoint <= 0xFFFF) {
	                    return String.fromCharCode(codePoint);
	                }
	                return astralSubstitute;
	            })
	                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, astralSubstitute);
	        }
	        // First, detect invalid regular expressions.
	        try {
	            RegExp(tmp);
	        }
	        catch (e) {
	            this.throwUnexpectedToken(messages_1.Messages.InvalidRegExp);
	        }
	        // Return a regular expression object for this pattern-flag pair, or
	        // `null` in case the current environment doesn't support the flags it
	        // uses.
	        try {
	            return new RegExp(pattern, flags);
	        }
	        catch (exception) {
	            /* istanbul ignore next */
	            return null;
	        }
	    };
	    Scanner.prototype.scanRegExpBody = function () {
	        var ch = this.source[this.index];
	        assert_1.assert(ch === '/', 'Regular expression literal must start with a slash');
	        var str = this.source[this.index++];
	        var classMarker = false;
	        var terminated = false;
	        while (!this.eof()) {
	            ch = this.source[this.index++];
	            str += ch;
	            if (ch === '\\') {
	                ch = this.source[this.index++];
	                // https://tc39.github.io/ecma262/#sec-literals-regular-expression-literals
	                if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                    this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	                }
	                str += ch;
	            }
	            else if (character_1.Character.isLineTerminator(ch.charCodeAt(0))) {
	                this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	            }
	            else if (classMarker) {
	                if (ch === ']') {
	                    classMarker = false;
	                }
	            }
	            else {
	                if (ch === '/') {
	                    terminated = true;
	                    break;
	                }
	                else if (ch === '[') {
	                    classMarker = true;
	                }
	            }
	        }
	        if (!terminated) {
	            this.throwUnexpectedToken(messages_1.Messages.UnterminatedRegExp);
	        }
	        // Exclude leading and trailing slash.
	        return str.substr(1, str.length - 2);
	    };
	    Scanner.prototype.scanRegExpFlags = function () {
	        var str = '';
	        var flags = '';
	        while (!this.eof()) {
	            var ch = this.source[this.index];
	            if (!character_1.Character.isIdentifierPart(ch.charCodeAt(0))) {
	                break;
	            }
	            ++this.index;
	            if (ch === '\\' && !this.eof()) {
	                ch = this.source[this.index];
	                if (ch === 'u') {
	                    ++this.index;
	                    var restore = this.index;
	                    var char = this.scanHexEscape('u');
	                    if (char !== null) {
	                        flags += char;
	                        for (str += '\\u'; restore < this.index; ++restore) {
	                            str += this.source[restore];
	                        }
	                    }
	                    else {
	                        this.index = restore;
	                        flags += 'u';
	                        str += '\\u';
	                    }
	                    this.tolerateUnexpectedToken();
	                }
	                else {
	                    str += '\\';
	                    this.tolerateUnexpectedToken();
	                }
	            }
	            else {
	                flags += ch;
	                str += ch;
	            }
	        }
	        return flags;
	    };
	    Scanner.prototype.scanRegExp = function () {
	        var start = this.index;
	        var pattern = this.scanRegExpBody();
	        var flags = this.scanRegExpFlags();
	        var value = this.testRegExp(pattern, flags);
	        return {
	            type: 9 /* RegularExpression */,
	            value: '',
	            pattern: pattern,
	            flags: flags,
	            regex: value,
	            lineNumber: this.lineNumber,
	            lineStart: this.lineStart,
	            start: start,
	            end: this.index
	        };
	    };
	    Scanner.prototype.lex = function () {
	        if (this.eof()) {
	            return {
	                type: 2 /* EOF */,
	                value: '',
	                lineNumber: this.lineNumber,
	                lineStart: this.lineStart,
	                start: this.index,
	                end: this.index
	            };
	        }
	        var cp = this.source.charCodeAt(this.index);
	        if (character_1.Character.isIdentifierStart(cp)) {
	            return this.scanIdentifier();
	        }
	        // Very common: ( and ) and ;
	        if (cp === 0x28 || cp === 0x29 || cp === 0x3B) {
	            return this.scanPunctuator();
	        }
	        // String literal starts with single quote (U+0027) or double quote (U+0022).
	        if (cp === 0x27 || cp === 0x22) {
	            return this.scanStringLiteral();
	        }
	        // Dot (.) U+002E can also start a floating-point number, hence the need
	        // to check the next character.
	        if (cp === 0x2E) {
	            if (character_1.Character.isDecimalDigit(this.source.charCodeAt(this.index + 1))) {
	                return this.scanNumericLiteral();
	            }
	            return this.scanPunctuator();
	        }
	        if (character_1.Character.isDecimalDigit(cp)) {
	            return this.scanNumericLiteral();
	        }
	        // Template literals start with ` (U+0060) for template head
	        // or } (U+007D) for template middle or template tail.
	        if (cp === 0x60 || (cp === 0x7D && this.curlyStack[this.curlyStack.length - 1] === '${')) {
	            return this.scanTemplate();
	        }
	        // Possible identifier start in a surrogate pair.
	        if (cp >= 0xD800 && cp < 0xDFFF) {
	            if (character_1.Character.isIdentifierStart(this.codePointAt(this.index))) {
	                return this.scanIdentifier();
	            }
	        }
	        return this.scanPunctuator();
	    };
	    return Scanner;
	}());
	exports.Scanner = Scanner;


/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.TokenName = {};
	exports.TokenName[1 /* BooleanLiteral */] = 'Boolean';
	exports.TokenName[2 /* EOF */] = '<end>';
	exports.TokenName[3 /* Identifier */] = 'Identifier';
	exports.TokenName[4 /* Keyword */] = 'Keyword';
	exports.TokenName[5 /* NullLiteral */] = 'Null';
	exports.TokenName[6 /* NumericLiteral */] = 'Numeric';
	exports.TokenName[7 /* Punctuator */] = 'Punctuator';
	exports.TokenName[8 /* StringLiteral */] = 'String';
	exports.TokenName[9 /* RegularExpression */] = 'RegularExpression';
	exports.TokenName[10 /* Template */] = 'Template';


/***/ },
/* 14 */
/***/ function(module, exports) {

	"use strict";
	// Generated by generate-xhtml-entities.js. DO NOT MODIFY!
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.XHTMLEntities = {
	    quot: '\u0022',
	    amp: '\u0026',
	    apos: '\u0027',
	    gt: '\u003E',
	    nbsp: '\u00A0',
	    iexcl: '\u00A1',
	    cent: '\u00A2',
	    pound: '\u00A3',
	    curren: '\u00A4',
	    yen: '\u00A5',
	    brvbar: '\u00A6',
	    sect: '\u00A7',
	    uml: '\u00A8',
	    copy: '\u00A9',
	    ordf: '\u00AA',
	    laquo: '\u00AB',
	    not: '\u00AC',
	    shy: '\u00AD',
	    reg: '\u00AE',
	    macr: '\u00AF',
	    deg: '\u00B0',
	    plusmn: '\u00B1',
	    sup2: '\u00B2',
	    sup3: '\u00B3',
	    acute: '\u00B4',
	    micro: '\u00B5',
	    para: '\u00B6',
	    middot: '\u00B7',
	    cedil: '\u00B8',
	    sup1: '\u00B9',
	    ordm: '\u00BA',
	    raquo: '\u00BB',
	    frac14: '\u00BC',
	    frac12: '\u00BD',
	    frac34: '\u00BE',
	    iquest: '\u00BF',
	    Agrave: '\u00C0',
	    Aacute: '\u00C1',
	    Acirc: '\u00C2',
	    Atilde: '\u00C3',
	    Auml: '\u00C4',
	    Aring: '\u00C5',
	    AElig: '\u00C6',
	    Ccedil: '\u00C7',
	    Egrave: '\u00C8',
	    Eacute: '\u00C9',
	    Ecirc: '\u00CA',
	    Euml: '\u00CB',
	    Igrave: '\u00CC',
	    Iacute: '\u00CD',
	    Icirc: '\u00CE',
	    Iuml: '\u00CF',
	    ETH: '\u00D0',
	    Ntilde: '\u00D1',
	    Ograve: '\u00D2',
	    Oacute: '\u00D3',
	    Ocirc: '\u00D4',
	    Otilde: '\u00D5',
	    Ouml: '\u00D6',
	    times: '\u00D7',
	    Oslash: '\u00D8',
	    Ugrave: '\u00D9',
	    Uacute: '\u00DA',
	    Ucirc: '\u00DB',
	    Uuml: '\u00DC',
	    Yacute: '\u00DD',
	    THORN: '\u00DE',
	    szlig: '\u00DF',
	    agrave: '\u00E0',
	    aacute: '\u00E1',
	    acirc: '\u00E2',
	    atilde: '\u00E3',
	    auml: '\u00E4',
	    aring: '\u00E5',
	    aelig: '\u00E6',
	    ccedil: '\u00E7',
	    egrave: '\u00E8',
	    eacute: '\u00E9',
	    ecirc: '\u00EA',
	    euml: '\u00EB',
	    igrave: '\u00EC',
	    iacute: '\u00ED',
	    icirc: '\u00EE',
	    iuml: '\u00EF',
	    eth: '\u00F0',
	    ntilde: '\u00F1',
	    ograve: '\u00F2',
	    oacute: '\u00F3',
	    ocirc: '\u00F4',
	    otilde: '\u00F5',
	    ouml: '\u00F6',
	    divide: '\u00F7',
	    oslash: '\u00F8',
	    ugrave: '\u00F9',
	    uacute: '\u00FA',
	    ucirc: '\u00FB',
	    uuml: '\u00FC',
	    yacute: '\u00FD',
	    thorn: '\u00FE',
	    yuml: '\u00FF',
	    OElig: '\u0152',
	    oelig: '\u0153',
	    Scaron: '\u0160',
	    scaron: '\u0161',
	    Yuml: '\u0178',
	    fnof: '\u0192',
	    circ: '\u02C6',
	    tilde: '\u02DC',
	    Alpha: '\u0391',
	    Beta: '\u0392',
	    Gamma: '\u0393',
	    Delta: '\u0394',
	    Epsilon: '\u0395',
	    Zeta: '\u0396',
	    Eta: '\u0397',
	    Theta: '\u0398',
	    Iota: '\u0399',
	    Kappa: '\u039A',
	    Lambda: '\u039B',
	    Mu: '\u039C',
	    Nu: '\u039D',
	    Xi: '\u039E',
	    Omicron: '\u039F',
	    Pi: '\u03A0',
	    Rho: '\u03A1',
	    Sigma: '\u03A3',
	    Tau: '\u03A4',
	    Upsilon: '\u03A5',
	    Phi: '\u03A6',
	    Chi: '\u03A7',
	    Psi: '\u03A8',
	    Omega: '\u03A9',
	    alpha: '\u03B1',
	    beta: '\u03B2',
	    gamma: '\u03B3',
	    delta: '\u03B4',
	    epsilon: '\u03B5',
	    zeta: '\u03B6',
	    eta: '\u03B7',
	    theta: '\u03B8',
	    iota: '\u03B9',
	    kappa: '\u03BA',
	    lambda: '\u03BB',
	    mu: '\u03BC',
	    nu: '\u03BD',
	    xi: '\u03BE',
	    omicron: '\u03BF',
	    pi: '\u03C0',
	    rho: '\u03C1',
	    sigmaf: '\u03C2',
	    sigma: '\u03C3',
	    tau: '\u03C4',
	    upsilon: '\u03C5',
	    phi: '\u03C6',
	    chi: '\u03C7',
	    psi: '\u03C8',
	    omega: '\u03C9',
	    thetasym: '\u03D1',
	    upsih: '\u03D2',
	    piv: '\u03D6',
	    ensp: '\u2002',
	    emsp: '\u2003',
	    thinsp: '\u2009',
	    zwnj: '\u200C',
	    zwj: '\u200D',
	    lrm: '\u200E',
	    rlm: '\u200F',
	    ndash: '\u2013',
	    mdash: '\u2014',
	    lsquo: '\u2018',
	    rsquo: '\u2019',
	    sbquo: '\u201A',
	    ldquo: '\u201C',
	    rdquo: '\u201D',
	    bdquo: '\u201E',
	    dagger: '\u2020',
	    Dagger: '\u2021',
	    bull: '\u2022',
	    hellip: '\u2026',
	    permil: '\u2030',
	    prime: '\u2032',
	    Prime: '\u2033',
	    lsaquo: '\u2039',
	    rsaquo: '\u203A',
	    oline: '\u203E',
	    frasl: '\u2044',
	    euro: '\u20AC',
	    image: '\u2111',
	    weierp: '\u2118',
	    real: '\u211C',
	    trade: '\u2122',
	    alefsym: '\u2135',
	    larr: '\u2190',
	    uarr: '\u2191',
	    rarr: '\u2192',
	    darr: '\u2193',
	    harr: '\u2194',
	    crarr: '\u21B5',
	    lArr: '\u21D0',
	    uArr: '\u21D1',
	    rArr: '\u21D2',
	    dArr: '\u21D3',
	    hArr: '\u21D4',
	    forall: '\u2200',
	    part: '\u2202',
	    exist: '\u2203',
	    empty: '\u2205',
	    nabla: '\u2207',
	    isin: '\u2208',
	    notin: '\u2209',
	    ni: '\u220B',
	    prod: '\u220F',
	    sum: '\u2211',
	    minus: '\u2212',
	    lowast: '\u2217',
	    radic: '\u221A',
	    prop: '\u221D',
	    infin: '\u221E',
	    ang: '\u2220',
	    and: '\u2227',
	    or: '\u2228',
	    cap: '\u2229',
	    cup: '\u222A',
	    int: '\u222B',
	    there4: '\u2234',
	    sim: '\u223C',
	    cong: '\u2245',
	    asymp: '\u2248',
	    ne: '\u2260',
	    equiv: '\u2261',
	    le: '\u2264',
	    ge: '\u2265',
	    sub: '\u2282',
	    sup: '\u2283',
	    nsub: '\u2284',
	    sube: '\u2286',
	    supe: '\u2287',
	    oplus: '\u2295',
	    otimes: '\u2297',
	    perp: '\u22A5',
	    sdot: '\u22C5',
	    lceil: '\u2308',
	    rceil: '\u2309',
	    lfloor: '\u230A',
	    rfloor: '\u230B',
	    loz: '\u25CA',
	    spades: '\u2660',
	    clubs: '\u2663',
	    hearts: '\u2665',
	    diams: '\u2666',
	    lang: '\u27E8',
	    rang: '\u27E9'
	};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var error_handler_1 = __webpack_require__(10);
	var scanner_1 = __webpack_require__(12);
	var token_1 = __webpack_require__(13);
	var Reader = (function () {
	    function Reader() {
	        this.values = [];
	        this.curly = this.paren = -1;
	    }
	    // A function following one of those tokens is an expression.
	    Reader.prototype.beforeFunctionExpression = function (t) {
	        return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
	            'return', 'case', 'delete', 'throw', 'void',
	            // assignment operators
	            '=', '+=', '-=', '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=',
	            '&=', '|=', '^=', ',',
	            // binary/unary operators
	            '+', '-', '*', '**', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
	            '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
	            '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
	    };
	    // Determine if forward slash (/) is an operator or part of a regular expression
	    // https://github.com/mozilla/sweet.js/wiki/design
	    Reader.prototype.isRegexStart = function () {
	        var previous = this.values[this.values.length - 1];
	        var regex = (previous !== null);
	        switch (previous) {
	            case 'this':
	            case ']':
	                regex = false;
	                break;
	            case ')':
	                var keyword = this.values[this.paren - 1];
	                regex = (keyword === 'if' || keyword === 'while' || keyword === 'for' || keyword === 'with');
	                break;
	            case '}':
	                // Dividing a function by anything makes little sense,
	                // but we have to check for that.
	                regex = false;
	                if (this.values[this.curly - 3] === 'function') {
	                    // Anonymous function, e.g. function(){} /42
	                    var check = this.values[this.curly - 4];
	                    regex = check ? !this.beforeFunctionExpression(check) : false;
	                }
	                else if (this.values[this.curly - 4] === 'function') {
	                    // Named function, e.g. function f(){} /42/
	                    var check = this.values[this.curly - 5];
	                    regex = check ? !this.beforeFunctionExpression(check) : true;
	                }
	                break;
	            default:
	                break;
	        }
	        return regex;
	    };
	    Reader.prototype.push = function (token) {
	        if (token.type === 7 /* Punctuator */ || token.type === 4 /* Keyword */) {
	            if (token.value === '{') {
	                this.curly = this.values.length;
	            }
	            else if (token.value === '(') {
	                this.paren = this.values.length;
	            }
	            this.values.push(token.value);
	        }
	        else {
	            this.values.push(null);
	        }
	    };
	    return Reader;
	}());
	var Tokenizer = (function () {
	    function Tokenizer(code, config) {
	        this.errorHandler = new error_handler_1.ErrorHandler();
	        this.errorHandler.tolerant = config ? (typeof config.tolerant === 'boolean' && config.tolerant) : false;
	        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
	        this.scanner.trackComment = config ? (typeof config.comment === 'boolean' && config.comment) : false;
	        this.trackRange = config ? (typeof config.range === 'boolean' && config.range) : false;
	        this.trackLoc = config ? (typeof config.loc === 'boolean' && config.loc) : false;
	        this.buffer = [];
	        this.reader = new Reader();
	    }
	    Tokenizer.prototype.errors = function () {
	        return this.errorHandler.errors;
	    };
	    Tokenizer.prototype.getNextToken = function () {
	        if (this.buffer.length === 0) {
	            var comments = this.scanner.scanComments();
	            if (this.scanner.trackComment) {
	                for (var i = 0; i < comments.length; ++i) {
	                    var e = comments[i];
	                    var value = this.scanner.source.slice(e.slice[0], e.slice[1]);
	                    var comment = {
	                        type: e.multiLine ? 'BlockComment' : 'LineComment',
	                        value: value
	                    };
	                    if (this.trackRange) {
	                        comment.range = e.range;
	                    }
	                    if (this.trackLoc) {
	                        comment.loc = e.loc;
	                    }
	                    this.buffer.push(comment);
	                }
	            }
	            if (!this.scanner.eof()) {
	                var loc = void 0;
	                if (this.trackLoc) {
	                    loc = {
	                        start: {
	                            line: this.scanner.lineNumber,
	                            column: this.scanner.index - this.scanner.lineStart
	                        },
	                        end: {}
	                    };
	                }
	                var startRegex = (this.scanner.source[this.scanner.index] === '/') && this.reader.isRegexStart();
	                var token = startRegex ? this.scanner.scanRegExp() : this.scanner.lex();
	                this.reader.push(token);
	                var entry = {
	                    type: token_1.TokenName[token.type],
	                    value: this.scanner.source.slice(token.start, token.end)
	                };
	                if (this.trackRange) {
	                    entry.range = [token.start, token.end];
	                }
	                if (this.trackLoc) {
	                    loc.end = {
	                        line: this.scanner.lineNumber,
	                        column: this.scanner.index - this.scanner.lineStart
	                    };
	                    entry.loc = loc;
	                }
	                if (token.type === 9 /* RegularExpression */) {
	                    var pattern = token.pattern;
	                    var flags = token.flags;
	                    entry.regex = { pattern: pattern, flags: flags };
	                }
	                this.buffer.push(entry);
	            }
	        }
	        return this.buffer.shift();
	    };
	    return Tokenizer;
	}());
	exports.Tokenizer = Tokenizer;


/***/ }
/******/ ])
});
;
},{}],60:[function(require,module,exports){
'use strict'
var readonlyProxies = new WeakMap
var currentSandbox = undefined
var GLOBAL = new Function('return this')()
var unscopablesSymbol = Symbol.unscopables
var FunctionConstructor = 0..constructor.constructor

function compileExpression(src) {
	if (typeof src !== 'string') {
		throw new TypeError('Expected argument to be a string.')
	}
	
	new FunctionConstructor('"use strict"; return ' + src) // Tests for syntax errors without running the code
	var code = new FunctionConstructor('sandbox', 'with (sandbox) {return (function () {"use strict"; return ' + src + '}).call(this)}')
	
	return function (sandbox) {
		if (!isObject(sandbox)) {
			throw new TypeError('Expected argument to be an object or function.')
		}
		if (currentSandbox) {
			throw new Error('You cannot run sandboxed code inside an already-running sandbox.')
		}
		var sandboxProxy = getProxy(sandbox)
		var result, error
		
		currentSandbox = sandbox
		try {
			result = code.call(sandboxProxy, sandboxProxy)
			currentSandbox = undefined
		} catch (ex) {
			currentSandbox = undefined
			if (ex instanceof Error) {
				error = new ex.constructor('' + ex.message)
				error.stack = '' + ex.stack
				throw error
			}
			throw new Error(String(ex))
		}
		if (isObject(result)) {
			throw TypeError('Sandboxes are only allowed to return primitive values.')
		}
		return result
	}
}
module.exports = compileExpression

var traps = {
	get: function (target, key, receiver) {
		if (currentSandbox) {
			if (key === unscopablesSymbol && target === currentSandbox) {
				return undefined
			}
			if (!notPrivate(key)) {
				return undefined
			}
			return getProxyOrPrimitive(Reflect.get(target, key, receiver))
		}
		return Reflect.get(target, key, receiver)
	},
	set: function (target, key, value, receiver) {
		if (currentSandbox) {
			throw new TypeError('You cannot set properties on a sandboxed object.')
		}
		return Reflect.set(target, key, value, receiver)
	},
	has: function (target, key) {
		if (currentSandbox) {
			if (target === currentSandbox) {
				return true
			}
			if (!notPrivate(key)) {
				return false
			}
			return getProxyOrPrimitive(Reflect.has(target, key))
		}
		return Reflect.has(target, key)
	},
	getPrototypeOf: function (target) {
		if (currentSandbox) {
			return getProxyOrPrimitive(Reflect.getPrototypeOf(target))
		}
		return Reflect.getPrototypeOf(target)
	},
	setPrototypeOf: function (target, proto) {
		if (currentSandbox) {
			throw new TypeError('You cannot set the prototype of a sandboxed object.')
		}
		return Reflect.setPrototypeOf(target, proto)
	},
	isExtensible: function (target) {
		if (currentSandbox) {
			return getProxyOrPrimitive(Reflect.isExtensible(target))
		}
		return Reflect.isExtensible(target)
	},
	preventExtensions: function (target) {
		if (currentSandbox) {
			throw new TypeError('You cannot change the extensibility of a sandboxed object.')
		}
		return Reflect.preventExtensions(target)
	},
	getOwnPropertyDescriptor: function (target, key) {
		if (currentSandbox) {
			if (key === Symbol.unscopables && target === currentSandbox) {
				return undefined
			}
			if (!notPrivate(key)) {
				return undefined
			}
			return getProxyOrPrimitive(Reflect.getOwnPropertyDescriptor(target, key))
		}
		return Reflect.getOwnPropertyDescriptor(target, key)
	},
	defineProperty: function (target, key, descriptor) {
		if (currentSandbox) {
			throw new TypeError('You cannot define properties on a sandboxed object.')
		}
		return Reflect.defineProperty(target, key, descriptor)
	},
	deleteProperty: function (target, key) {
		if (currentSandbox) {
			throw new TypeError('You cannot delete properties on a sandboxed object.')
		}
		return Reflect.deleteProperty(target, key)
	},
	ownKeys: function (target) {
		if (currentSandbox) {
			return getProxyOrPrimitive(Reflect.ownKeys(target).filter(notPrivate))
		}
		return Reflect.ownKeys(target)
	},
	apply: function (target, thisArg, argumentsList) {
		if (currentSandbox) {
			if (target === FunctionConstructor || target === FunctionConstructorProxy) {
				throw new TypeError('You cannot use the Function constructor in a sandboxed context.')
			}
			return getProxyOrPrimitive(Reflect.apply(target, thisArg, argumentsList))
		}
		return Reflect.apply(target, thisArg, argumentsList)
	},
	construct: function (target, argumentsList, newTarget) {
		if (currentSandbox) {
			if (target === FunctionConstructor || target === FunctionConstructorProxy) {
				throw new TypeError('You cannot use the Function constructor in a sandboxed context.')
			}
			return getProxyOrPrimitive(Reflect.construct(target, argumentsList, newTarget))
		}
		return Reflect.construct(target, argumentsList, newTarget)
	}
}

function isObject(value) {
	return typeof value === 'function' || (value !== null && typeof value === 'object')
}

function getProxyOrPrimitive(value) {
	if (isObject(value)) {
		return safeObjects.indexOf(value) >= 0 ? value : getProxy(value)
	}
	return value
}

function getProxy(object, hideOriginal) {
	if (object === GLOBAL) {
		throw new TypeError('The global object is forbidden from entering a sandboxed context.')
	}
	if (object === evalFunction) {
		throw new TypeError('The eval function is forbidden from entering a sandboxed context.')
	}
	var proxy = readonlyProxies.get(object)
	if (typeof proxy === 'undefined') {
		proxy = new Proxy(object, traps)
		readonlyProxies.set(hideOriginal ? proxy : object, proxy)
	}
	return proxy
}

function notPrivate(key) {
	return typeof key !== 'string' || key[0] !== '_'
}

// Freeze and proxy anything that is accessible through JavaScript syntax alone
// This should include any value that you can get from JavaScript syntax itself.
// For example:
//     "my string".foobar
//     try {throw 1} catch (err) {err.foobar}
// Symbols are included here because they are not protected by our proxying
// because they are primitives.
var safeObjects = require('./lib/make-safe')([
	Boolean.prototype,
	Number.prototype,
	String.prototype,
	Symbol.prototype,
	Function.prototype,
	Object.prototype,
	Array.prototype,
	RegExp.prototype,
	Error.prototype,
	EvalError.prototype,
	RangeError.prototype,
	ReferenceError.prototype,
	SyntaxError.prototype,
	TypeError.prototype,
	URIError.prototype,
	Promise.prototype,
	Object.getPrototypeOf(function*(){}),
	Object.getPrototypeOf(function*(){}())
], isObject, getProxy, GLOBAL)

var evalFunction = GLOBAL.eval
var FunctionConstructorProxy = 0..constructor.constructor

module.exports.equals = function (a, b) {
	return a === b || (readonlyProxies.get(a) || a) === (readonlyProxies.get(b) || b)
}



},{"./lib/make-safe":61}],61:[function(require,module,exports){
'use strict'

module.exports = function (unsafeObjects, isObject, getProxy, GLOBAL) {
	var proxies = []
	var safeObjects = []
	var returnsSafeValues = [
		Function.prototype[Symbol.hasInstance]
	]
	var globalKeys = Object.getOwnPropertyNames(GLOBAL).filter(function (key) {return key !== 'root' && key !== 'GLOBAL' && key !== 'global' && key !== 'window' && key !== 'self'})
	var globalValues = globalKeys.map(function (key) {return this[key]}, GLOBAL)
	
	while (unsafeObjects.length) {
		makeSafe(unsafeObjects.shift())
	}
	
	function makeSafe(object) {
		if (isSafe(object)) {
			return
		}
		
		var reachable = Object.getOwnPropertyNames(object)
			.concat(Object.getOwnPropertySymbols(object))
		
		if (object === Function.prototype) {
			reachable = reachable.filter(ignoredKeys)
		}
		
		reachable.forEach(replaceWithProxy, object)
		Object.freeze(object)
		safeObjects.push(object)
		
		unsafeObjects.push(Object.getPrototypeOf(object))
	}
	
	function ignoredKeys(key) {
		return key !== 'caller' && key !== 'arguments'
	}
	
	function isSafe(value) {
		return !isObject(value) || proxies.indexOf(value) >= 0 || safeObjects.indexOf(value) >= 0
	}
	
	function replaceWithProxy(key) {
		var d = Object.getOwnPropertyDescriptor(this, key)
		if (!('value' in d)) {
			if (key === '__proto__' && isSafe(this[key])) {
				return
			}
			if (!d.configurable) {
				d.get && unsafeObjects.push(d.get)
				d.set && unsafeObjects.push(d.set)
				// This getter/setter could potentially return a non-proxied object
				console.warn('Potentially vulnerable getter/setter at %s in %s', key, this)
				return
			}
			var getter = d.get && getProxy(d.get, true)
			var setter = d.set && getProxy(d.set, true)
			Object.defineProperty(this, key, {
				get: getter,
				set: setter,
				enumerable: d.enumerable,
				configurable: false
			})
			getter && proxies.push(getter)
			setter && proxies.push(setter)
			return
		}
		
		var value = this[key]
		if (isSafe(value)) {
			return
		}
		
		if (d.writable) {
			var proxy = getProxy(value, true)
			proxies.push(this[key] = proxy)
			replaceInGlobal(value, proxy)
			return
		}
		
		if (d.configurable) {
			var proxy = getProxy(value, true)
			Object.defineProperty(this, key, {
				value: proxy,
				writable: false,
				enumerable: d.enumerable,
				configurable: false
			})
			replaceInGlobal(value, proxy)
			proxies.push(proxy)
			return
		}
		
		unsafeObjects.push(value)
		if (typeof value === 'function' && returnsSafeValues.indexOf(value) === -1) {
			// This function could potentially return a non-proxied object
			console.warn('Potentially vulnerable function at %s in %s', key, this)
		}
	}
	
	function replaceInGlobal(value, proxy) {
		var index = globalValues.indexOf(value)
		if (index >= 0) {
			var key = globalKeys[index]
			var d = Object.getOwnPropertyDescriptor(GLOBAL, key)
			if (d.writable) {
				GLOBAL[key] = proxy
			} else if (d.configurable) {
				Object.defineProperty(GLOBAL, key, {
					value: proxy,
					writable: false,
					enumerable: d.enumerable,
					configurable: false
				})
			} else {
				console.warn('Was not able to replace %s in global object', key)
			}
		}
	}
	
	return safeObjects
}

},{}],62:[function(require,module,exports){
var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

function isPlainObject(obj) {
	if (!obj || toString.call(obj) !== '[object Object]' || obj.nodeType || obj.setInterval)
		return false;

	var has_own_constructor = hasOwn.call(obj, 'constructor');
	var has_is_property_of_method = hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !has_own_constructor && !has_is_property_of_method)
		return false;

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for ( key in obj ) {}

	return key === undefined || hasOwn.call( obj, key );
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
	    target = arguments[0] || {},
	    i = 1,
	    length = arguments.length,
	    deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject(copy) || (copyIsArray = Array.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && Array.isArray(src) ? src : [];

					} else {
						clone = src && isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],63:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex');
var re = new RegExp(ansiRegex().source); // remove the `g` flag
module.exports = re.test.bind(re);

},{"ansi-regex":53}],64:[function(require,module,exports){
(function (global){
/**
 * © Copyright IBM Corp. 2016, 2017 All Rights Reserved
 *   Project name: JSONata
 *   This project is licensed under the MIT License, see LICENSE
 */

/**
 * @module JSONata
 * @description JSON query and transformation language
 */

/**
 * jsonata
 * @function
 * @param {Object} expr - JSONata expression
 * @returns {{evaluate: evaluate, assign: assign}} Evaluated expression
 */
var jsonata = (function() {
    'use strict';

    var operators = {
        '.': 75,
        '[': 80,
        ']': 0,
        '{': 70,
        '}': 0,
        '(': 80,
        ')': 0,
        ',': 0,
        '@': 75,
        '#': 70,
        ';': 80,
        ':': 80,
        '?': 20,
        '+': 50,
        '-': 50,
        '*': 60,
        '/': 60,
        '%': 60,
        '|': 20,
        '=': 40,
        '<': 40,
        '>': 40,
        '^': 40,
        '**': 60,
        '..': 20,
        ':=': 10,
        '!=': 40,
        '<=': 40,
        '>=': 40,
        '~>': 40,
        'and': 30,
        'or': 25,
        'in': 40,
        '&': 50,
        '!': 0,   // not an operator, but needed as a stop character for name tokens
        '~': 0   // not an operator, but needed as a stop character for name tokens
    };

    var escapes = {  // JSON string escape sequences - see json.org
        '"': '"',
        '\\': '\\',
        '/': '/',
        'b': '\b',
        'f': '\f',
        'n': '\n',
        'r': '\r',
        't': '\t'
    };

    // Tokenizer (lexer) - invoked by the parser to return one token at a time
    var tokenizer = function (path) {
        var position = 0;
        var length = path.length;

        var create = function (type, value) {
            var obj = {type: type, value: value, position: position};
            return obj;
        };

        var scanRegex = function() {
            // the prefix '/' will have been previously scanned. Find the end of the regex.
            // search for closing '/' ignoring any that are escaped, or within brackets
            var start = position;
            var depth = 0;
            var pattern;
            var flags;
            while(position < length) {
                var currentChar = path.charAt(position);
                if(currentChar === '/' && path.charAt(position - 1) !== '\\' && depth === 0) {
                    // end of regex found
                    pattern = path.substring(start, position);
                    if(pattern === '') {
                        throw {
                            code: "S0301",
                            stack: (new Error()).stack,
                            position: position
                        };
                    }
                    position++;
                    currentChar = path.charAt(position);
                    // flags
                    start = position;
                    while(currentChar === 'i' || currentChar === 'm') {
                        position++;
                        currentChar = path.charAt(position);
                    }
                    flags = path.substring(start, position) + 'g';
                    return new RegExp(pattern, flags);
                }
                if((currentChar === '(' || currentChar === '[' || currentChar === '{') && path.charAt(position - 1) !== '\\' ) {
                    depth++;
                }
                if((currentChar === ')' || currentChar === ']' || currentChar === '}') && path.charAt(position - 1) !== '\\' ) {
                    depth--;
                }

                position++;
            }
            throw {
                code: "S0302",
                stack: (new Error()).stack,
                position: position
            };
        };

        var next = function (prefix) {
            if (position >= length) return null;
            var currentChar = path.charAt(position);
            // skip whitespace
            while (position < length && ' \t\n\r\v'.indexOf(currentChar) > -1) {
                position++;
                currentChar = path.charAt(position);
            }
            // test for regex
            if (prefix !== true && currentChar === '/') {
                position++;
                return create('regex', scanRegex());
            }
            // handle double-char operators
            if (currentChar === '.' && path.charAt(position + 1) === '.') {
                // double-dot .. range operator
                position += 2;
                return create('operator', '..');
            }
            if (currentChar === ':' && path.charAt(position + 1) === '=') {
                // := assignment
                position += 2;
                return create('operator', ':=');
            }
            if (currentChar === '!' && path.charAt(position + 1) === '=') {
                // !=
                position += 2;
                return create('operator', '!=');
            }
            if (currentChar === '>' && path.charAt(position + 1) === '=') {
                // >=
                position += 2;
                return create('operator', '>=');
            }
            if (currentChar === '<' && path.charAt(position + 1) === '=') {
                // <=
                position += 2;
                return create('operator', '<=');
            }
            if (currentChar === '*' && path.charAt(position + 1) === '*') {
                // **  descendant wildcard
                position += 2;
                return create('operator', '**');
            }
            if (currentChar === '~' && path.charAt(position + 1) === '>') {
                // ~>  chain function
                position += 2;
                return create('operator', '~>');
            }
            // test for single char operators
            if (operators.hasOwnProperty(currentChar)) {
                position++;
                return create('operator', currentChar);
            }
            // test for string literals
            if (currentChar === '"' || currentChar === "'") {
                var quoteType = currentChar;
                // double quoted string literal - find end of string
                position++;
                var qstr = "";
                while (position < length) {
                    currentChar = path.charAt(position);
                    if (currentChar === '\\') { // escape sequence
                        position++;
                        currentChar = path.charAt(position);
                        if (escapes.hasOwnProperty(currentChar)) {
                            qstr += escapes[currentChar];
                        } else if (currentChar === 'u') {
                            // \u should be followed by 4 hex digits
                            var octets = path.substr(position + 1, 4);
                            if (/^[0-9a-fA-F]+$/.test(octets)) {
                                var codepoint = parseInt(octets, 16);
                                qstr += String.fromCharCode(codepoint);
                                position += 4;
                            } else {
                                throw {
                                    code: "S0104",
                                    stack: (new Error()).stack,
                                    position: position
                                };
                            }
                        } else {
                            // illegal escape sequence
                            throw {
                                code: "S0103",
                                stack: (new Error()).stack,
                                position: position,
                                token: currentChar
                            };

                        }
                    } else if (currentChar === quoteType) {
                        position++;
                        return create('string', qstr);
                    } else {
                        qstr += currentChar;
                    }
                    position++;
                }
                throw {
                    code: "S0101",
                    stack: (new Error()).stack,
                    position: position
                };
            }
            // test for numbers
            var numregex = /^-?(0|([1-9][0-9]*))(\.[0-9]+)?([Ee][-+]?[0-9]+)?/;
            var match = numregex.exec(path.substring(position));
            if (match !== null) {
                var num = parseFloat(match[0]);
                if (!isNaN(num) && isFinite(num)) {
                    position += match[0].length;
                    return create('number', num);
                } else {
                    throw {
                        code: "S0102",
                        stack: (new Error()).stack,
                        position: position,
                        token: match[0]
                    };
                }
            }
            // test for quoted names (backticks)
            var name;
            if(currentChar === '`') {
                // scan for closing quote
                position++;
                var end = path.indexOf('`', position);
                if(end !== -1) {
                    name = path.substring(position, end);
                    position = end + 1;
                    return create('name', name);
                }
                position = length;
                throw {
                    code: "S0105",
                    stack: (new Error()).stack,
                    position: position
                };
            }
            // test for names
            var i = position;
            var ch;
            for (;;) {
                ch = path.charAt(i);
                if (i === length || ' \t\n\r\v'.indexOf(ch) > -1 || operators.hasOwnProperty(ch)) {
                    if (path.charAt(position) === '$') {
                        // variable reference
                        name = path.substring(position + 1, i);
                        position = i;
                        return create('variable', name);
                    } else {
                        name = path.substring(position, i);
                        position = i;
                        switch (name) {
                            case 'or':
                            case 'in':
                            case 'and':
                                return create('operator', name);
                            case 'true':
                                return create('value', true);
                            case 'false':
                                return create('value', false);
                            case 'null':
                                return create('value', null);
                            default:
                                if (position === length && name === '') {
                                    // whitespace at end of input
                                    return null;
                                }
                                return create('name', name);
                        }
                    }
                } else {
                    i++;
                }
            }
        };

        return next;
    };

    /**
     * Parses a function signature definition and returns a validation function
     * @param {string} signature - the signature between the <angle brackets>
     * @returns {Function} validation function
     */
    function parseSignature(signature) {
        // create a Regex that represents this signature and return a function that when invoked,
        // returns the validated (possibly fixed-up) arguments, or throws a validation error
        // step through the signature, one symbol at a time
        var position = 1;
        var params = [];
        var param = {};
        var prevParam = param;
        while (position < signature.length) {
            var symbol = signature.charAt(position);
            if(symbol === ':') {
                // TODO figure out what to do with the return type
                // ignore it for now
                break;
            }

            var next = function() {
                params.push(param);
                prevParam = param;
                param = {};
            };

            var findClosingBracket = function(str, start, openSymbol, closeSymbol) {
                // returns the position of the closing symbol (e.g. bracket) in a string
                // that balances the opening symbol at position start
                var depth = 1;
                var position = start;
                while(position < str.length) {
                    position++;
                    symbol = str.charAt(position);
                    if(symbol === closeSymbol) {
                        depth--;
                        if(depth === 0) {
                            // we're done
                            break; // out of while loop
                        }
                    } else if(symbol === openSymbol) {
                        depth++;
                    }
                }
                return position;
            };

            switch (symbol) {
                case 's': // string
                case 'n': // number
                case 'b': // boolean
                case 'l': // not so sure about expecting null?
                case 'o': // object
                    param.regex = '[' + symbol + 'm]';
                    param.type = symbol;
                    next();
                    break;
                case 'a': // array
                    //  normally treat any value as singleton array
                    param.regex = '[asnblfom]';
                    param.type = symbol;
                    param.array = true;
                    next();
                    break;
                case 'f': // function
                    param.regex = 'f';
                    param.type = symbol;
                    next();
                    break;
                case 'j': // any JSON type
                    param.regex = '[asnblom]';
                    param.type = symbol;
                    next();
                    break;
                case 'x': // any type
                    param.regex = '[asnblfom]';
                    param.type = symbol;
                    next();
                    break;
                case '-': // use context if param not supplied
                    prevParam.context = true;
                    prevParam.contextRegex = new RegExp(prevParam.regex); // pre-compiled to test the context type at runtime
                    prevParam.regex += '?';
                    break;
                case '?': // optional param
                case '+': // one or more
                    prevParam.regex += symbol;
                    break;
                case '(': // choice of types
                    // search forward for matching ')'
                    var endParen = findClosingBracket(signature, position, '(', ')');
                    var choice = signature.substring(position + 1, endParen);
                    if(choice.indexOf('<') === -1) {
                        // no parameterized types, simple regex
                        param.regex = '[' + choice + 'm]';
                    } else {
                        // TODO harder
                        throw {
                            code: "S0402",
                            stack: (new Error()).stack,
                            value: choice,
                            offset: position
                        };
                    }
                    param.type = '(' + choice + ')';
                    position = endParen;
                    next();
                    break;
                case '<': // type parameter - can only be applied to 'a' and 'f'
                    if(prevParam.type === 'a' || prevParam.type === 'f') {
                        // search forward for matching '>'
                        var endPos = findClosingBracket(signature, position, '<', '>');
                        prevParam.subtype = signature.substring(position + 1, endPos);
                        position = endPos;
                    } else {
                        throw {
                            code: "S0401",
                            stack: (new Error()).stack,
                            value: prevParam.type,
                            offset: position
                        };
                    }
                    break;
            }
            position++;
        }
        var regexStr = '^' +
          params.map(function(param) {
              return '(' + param.regex + ')';
          }).join('') +
          '$';
        var regex = new RegExp(regexStr);
        var getSymbol = function(value) {
            var symbol;
            if(isFunction(value)) {
                symbol = 'f';
            } else {
                var type = typeof value;
                switch (type) {
                    case 'string':
                        symbol = 's';
                        break;
                    case 'number':
                        symbol = 'n';
                        break;
                    case 'boolean':
                        symbol = 'b';
                        break;
                    case 'object':
                        if (value === null) {
                            symbol = 'l';
                        } else if (Array.isArray(value)) {
                            symbol = 'a';
                        } else {
                            symbol = 'o';
                        }
                        break;
                    case 'undefined':
                        // any value can be undefined, but should be allowed to match
                        symbol = 'm'; // m for missing
                }
            }
            return symbol;
        };

        var throwValidationError = function(badArgs, badSig) {
            // to figure out where this went wrong we need apply each component of the
            // regex to each argument until we get to the one that fails to match
            var partialPattern = '^';
            var goodTo = 0;
            for(var index = 0; index < params.length; index++) {
                partialPattern += params[index].regex;
                var match = badSig.match(partialPattern);
                if(match === null) {
                    // failed here
                    throw {
                        code: "T0410",
                        stack: (new Error()).stack,
                        value: badArgs[goodTo],
                        index: goodTo + 1
                    };
                }
                goodTo = match[0].length;
            }
            // if it got this far, it's probably because of extraneous arguments (we
            // haven't added the trailing '$' in the regex yet.
            throw {
                code: "T0410",
                stack: (new Error()).stack,
                value: badArgs[goodTo],
                index: goodTo + 1
            };
        };

        return {
            definition: signature,
            validate: function(args, context) {
                var suppliedSig = '';
                args.forEach(function(arg) {
                    suppliedSig += getSymbol(arg);
                });
                var isValid = regex.exec(suppliedSig);
                if(isValid) {
                    var validatedArgs = [];
                    var argIndex = 0;
                    params.forEach(function(param, index) {
                        var arg = args[argIndex];
                        var match = isValid[index + 1];
                        if(match === '') {
                            if (param.context) {
                                // substitute context value for missing arg
                                // first check that the context value is the right type
                                var contextType = getSymbol(context);
                                // test contextType against the regex for this arg (without the trailing ?)
                                if(param.contextRegex.test(contextType)) {
                                    validatedArgs.push(context);
                                } else {
                                    // context value not compatible with this argument
                                    throw {
                                        code: "T0411",
                                        stack: (new Error()).stack,
                                        value: context,
                                        index: argIndex + 1
                                    };
                                }
                            } else {
                                validatedArgs.push(arg);
                                argIndex++;
                            }
                        } else {
                            // may have matched multiple args (if the regex ends with a '+'
                            // split into single tokens
                            match.split('').forEach(function(single) {
                                if (param.type === 'a') {
                                    if (single === 'm') {
                                        // missing (undefined)
                                        arg = undefined;
                                    } else {
                                        arg = args[argIndex];
                                        var arrayOK = true;
                                        // is there type information on the contents of the array?
                                        if (typeof param.subtype !== 'undefined') {
                                            if (single !== 'a' && match !== param.subtype) {
                                                arrayOK = false;
                                            } else if (single === 'a') {
                                                if (arg.length > 0) {
                                                    var itemType = getSymbol(arg[0]);
                                                    if (itemType !== param.subtype.charAt(0)) { // TODO recurse further
                                                        arrayOK = false;
                                                    } else {
                                                        // make sure every item in the array is this type
                                                        var differentItems = arg.filter(function (val) {
                                                            return (getSymbol(val) !== itemType);
                                                        });
                                                        arrayOK = (differentItems.length === 0);
                                                    }
                                                }
                                            }
                                        }
                                        if (!arrayOK) {
                                            throw {
                                                code: "T0412",
                                                stack: (new Error()).stack,
                                                value: arg,
                                                index: argIndex + 1,
                                                type: param.subtype // TODO translate symbol to type name
                                            };
                                        }
                                        // the function expects an array. If it's not one, make it so
                                        if (single !== 'a') {
                                            arg = [arg];
                                        }
                                    }
                                    validatedArgs.push(arg);
                                    argIndex++;
                                } else {
                                    validatedArgs.push(arg);
                                    argIndex++;
                                }
                            });
                        }
                    });
                    return validatedArgs;
                }
                throwValidationError(args, suppliedSig);
            }
        };
    }

    // This parser implements the 'Top down operator precedence' algorithm developed by Vaughan R Pratt; http://dl.acm.org/citation.cfm?id=512931.
    // and builds on the Javascript framework described by Douglas Crockford at http://javascript.crockford.com/tdop/tdop.html
    // and in 'Beautiful Code', edited by Andy Oram and Greg Wilson, Copyright 2007 O'Reilly Media, Inc. 798-0-596-51004-6

    var parser = function (source, recover) {
        var node;
        var lexer;

        var symbol_table = {};
        var errors = [];

        var remainingTokens = function() {
            var remaining = [];
            if(node.id !== '(end)') {
                remaining.push({type: node.type, value: node.value, position: node.position});
            }
            var nxt = lexer();
            while(nxt !== null) {
                remaining.push(nxt);
                nxt = lexer();
            }
            return remaining;
        };

        var base_symbol = {
            nud: function () {
                // error - symbol has been invoked as a unary operator
                var err = {
                    code: 'S0211',
                    token: this.value,
                    position: this.position
                };

                if(recover) {
                    err.remaining = remainingTokens();
                    err.type = 'error';
                    errors.push(err);
                    return err;
                } else {
                    err.stack = (new Error()).stack;
                    throw err;
                }
            }
        };

        var symbol = function (id, bp) {
            var s = symbol_table[id];
            bp = bp || 0;
            if (s) {
                if (bp >= s.lbp) {
                    s.lbp = bp;
                }
            } else {
                s = Object.create(base_symbol);
                s.id = s.value = id;
                s.lbp = bp;
                symbol_table[id] = s;
            }
            return s;
        };

        var handleError = function(err) {
            if(recover) {
                // tokenize the rest of the buffer and add it to an error token
                err.remaining = remainingTokens();
                errors.push(err);
                var symbol = symbol_table["(error)"];
                node = Object.create(symbol);
                node.error = err;
                node.type = "(error)";
                return node;
            } else {
                err.stack = (new Error()).stack;
                throw err;
            }
        };

        var advance = function (id, infix) {
            if (id && node.id !== id) {
                var code;
                if(node.id === '(end)') {
                    // unexpected end of buffer
                    code = "S0203";
                } else {
                    code = "S0202";
                }
                var err = {
                    code: code,
                    position: node.position,
                    token: node.value,
                    value: id
                };
                return handleError(err);
            }
            var next_token = lexer(infix);
            if (next_token === null) {
                node = symbol_table["(end)"];
                node.position = source.length;
                return node;
            }
            var value = next_token.value;
            var type = next_token.type;
            var symbol;
            switch (type) {
                case 'name':
                case 'variable':
                    symbol = symbol_table["(name)"];
                    break;
                case 'operator':
                    symbol = symbol_table[value];
                    if (!symbol) {
                        return handleError( {
                            code: "S0204",
                            stack: (new Error()).stack,
                            position: next_token.position,
                            token: value
                        });
                    }
                    break;
                case 'string':
                case 'number':
                case 'value':
                    type = "literal";
                    symbol = symbol_table["(literal)"];
                    break;
                case 'regex':
                    type = "regex";
                    symbol = symbol_table["(regex)"];
                    break;
                    /* istanbul ignore next */
                default:
                    return handleError( {
                        code: "S0205",
                        stack: (new Error()).stack,
                        position: next_token.position,
                        token: value
                    });
            }

            node = Object.create(symbol);
            node.value = value;
            node.type = type;
            node.position = next_token.position;
            return node;
        };

        // Pratt's algorithm
        var expression = function (rbp) {
            var left;
            var t = node;
            advance(null, true);
            left = t.nud();
            while (rbp < node.lbp) {
                t = node;
                advance();
                left = t.led(left);
            }
            return left;
        };

        var terminal = function(id) {
            var s = symbol(id, 0);
            s.nud = function() {
                return this;
            };
        };

        // match infix operators
        // <expression> <operator> <expression>
        // left associative
        var infix = function (id, bp, led) {
            var bindingPower = bp || operators[id];
            var s = symbol(id, bindingPower);
            s.led = led || function (left) {
                this.lhs = left;
                this.rhs = expression(bindingPower);
                this.type = "binary";
                return this;
            };
            return s;
        };

        // match infix operators
        // <expression> <operator> <expression>
        // right associative
        var infixr = function (id, bp, led) {
            var bindingPower = bp || operators[id];
            var s = symbol(id, bindingPower);
            s.led = led || function (left) {
                this.lhs = left;
                this.rhs = expression(bindingPower - 1); // subtract 1 from bindingPower for right associative operators
                this.type = "binary";
                return this;
            };
            return s;
        };

        // match prefix operators
        // <operator> <expression>
        var prefix = function (id, nud) {
            var s = symbol(id);
            s.nud = nud || function () {
                this.expression = expression(70);
                this.type = "unary";
                return this;
            };
            return s;
        };

        terminal("(end)");
        terminal("(name)");
        terminal("(literal)");
        terminal("(regex)");
        symbol(":");
        symbol(";");
        symbol(",");
        symbol(")");
        symbol("]");
        symbol("}");
        symbol(".."); // range operator
        infix("."); // field reference
        infix("+"); // numeric addition
        infix("-"); // numeric subtraction
        infix("*"); // numeric multiplication
        infix("/"); // numeric division
        infix("%"); // numeric modulus
        infix("="); // equality
        infix("<"); // less than
        infix(">"); // greater than
        infix("!="); // not equal to
        infix("<="); // less than or equal
        infix(">="); // greater than or equal
        infix("&"); // string concatenation
        infix("and"); // Boolean AND
        infix("or"); // Boolean OR
        infix("in"); // is member of array
        terminal("and"); // the 'keywords' can also be used as terminals (field names)
        terminal("or"); //
        terminal("in"); //
        infixr(":="); // bind variable
        prefix("-"); // unary numeric negation
        infix("~>"); // function application

        infixr("(error)", 10, function(left) {
            this.lhs = left;

            this.error = node.error;
            this.remaining = remainingTokens();
            this.type = 'error';
            return this;
        });

        // field wildcard (single level)
        prefix('*', function () {
            this.type = "wildcard";
            return this;
        });

        // descendant wildcard (multi-level)
        prefix('**', function () {
            this.type = "descendant";
            return this;
        });

        // function invocation
        infix("(", operators['('], function (left) {
            // left is is what we are trying to invoke
            this.procedure = left;
            this.type = 'function';
            this.arguments = [];
            if (node.id !== ')') {
                for (;;) {
                    if (node.type === 'operator' && node.id === '?') {
                        // partial function application
                        this.type = 'partial';
                        this.arguments.push(node);
                        advance('?');
                    } else {
                        this.arguments.push(expression(0));
                    }
                    if (node.id !== ',') break;
                    advance(',');
                }
            }
            advance(")", true);
            // if the name of the function is 'function' or λ, then this is function definition (lambda function)
            if (left.type === 'name' && (left.value === 'function' || left.value === '\u03BB')) {
                // all of the args must be VARIABLE tokens
                this.arguments.forEach(function (arg, index) {
                    if (arg.type !== 'variable') {
                        return handleError( {
                            code: "S0208",
                            stack: (new Error()).stack,
                            position: arg.position,
                            token: arg.value,
                            value: index + 1
                        });
                    }
                });
                this.type = 'lambda';
                // is the next token a '<' - if so, parse the function signature
                if(node.id === '<') {
                    var sigPos = node.position;
                    var depth = 1;
                    var sig = '<';
                    while(depth > 0 && node.id !== '{' && node.id !== '(end)') {
                        var tok = advance();
                        if(tok.id === '>') {
                            depth--;
                        } else if(tok.id === '<') {
                            depth++;
                        }
                        sig += tok.value;
                    }
                    advance('>');
                    try {
                        this.signature = parseSignature(sig);
                    } catch(err) {
                        // insert the position into this error
                        err.position = sigPos + err.offset;
                        return handleError( err );
                    }
                }
                // parse the function body
                advance('{');
                this.body = expression(0);
                advance('}');
            }
            return this;
        });

        // parenthesis - block expression
        prefix("(", function () {
            var expressions = [];
            while (node.id !== ")") {
                expressions.push(expression(0));
                if (node.id !== ";") {
                    break;
                }
                advance(";");
            }
            advance(")", true);
            this.type = 'block';
            this.expressions = expressions;
            return this;
        });

        // array constructor
        prefix("[", function () {
            var a = [];
            if (node.id !== "]") {
                for (;;) {
                    var item = expression(0);
                    if (node.id === "..") {
                        // range operator
                        var range = {type: "binary", value: "..", position: node.position, lhs: item};
                        advance("..");
                        range.rhs = expression(0);
                        item = range;
                    }
                    a.push(item);
                    if (node.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("]", true);
            this.expressions = a;
            this.type = "unary";
            return this;
        });

        // filter - predicate or array index
        infix("[", operators['['], function (left) {
            if(node.id === "]") {
                // empty predicate means maintain singleton arrays in the output
                var step = left;
                while(step && step.type === 'binary' && step.value === '[') {
                    step = step.lhs;
                }
                step.keepArray = true;
                advance("]");
                return left;
            } else {
                this.lhs = left;
                this.rhs = expression(operators[']']);
                this.type = 'binary';
                advance("]", true);
                return this;
            }
        });

        // order-by
        infix("^", operators['^'], function (left) {
            advance("(");
            var terms = [];
            for(;;) {
                var term = {
                    descending: false
                };
                if (node.id === "<") {
                    // ascending sort
                    advance("<");
                } else if (node.id === ">") {
                    // descending sort
                    term.descending = true;
                    advance(">");
                } else {
                    //unspecified - default to ascending
                }
                term.expression = expression(0);
                terms.push(term);
                if(node.id !== ",") {
                    break;
                }
                advance(",");
            }
            advance(")");
            this.lhs = left;
            this.rhs = terms;
            this.type = 'binary';
            return this;
        });

        var objectParser = function (left) {
            var a = [];
            if (node.id !== "}") {
                for (;;) {
                    var n = expression(0);
                    advance(":");
                    var v = expression(0);
                    a.push([n, v]); // holds an array of name/value expression pairs
                    if (node.id !== ",") {
                        break;
                    }
                    advance(",");
                }
            }
            advance("}", true);
            if(typeof left === 'undefined') {
                // NUD - unary prefix form
                this.lhs = a;
                this.type = "unary";
            } else {
                // LED - binary infix form
                this.lhs = left;
                this.rhs = a;
                this.type = 'binary';
            }
            return this;
        };

        // object constructor
        prefix("{", objectParser);

        // object grouping
        infix("{", operators['{'], objectParser);

        // if/then/else ternary operator ?:
        infix("?", operators['?'], function (left) {
            this.type = 'condition';
            this.condition = left;
            this.then = expression(0);
            if (node.id === ':') {
                // else condition
                advance(":");
                this.else = expression(0);
            }
            return this;
        });

        // object transformer
        prefix("|", function () {
            this.type = 'transform';
            this.pattern = expression(0);
            advance('|');
            this.update = expression(0);
            if(node.id === ',') {
                advance(',');
                this.delete = expression(0);
            }
            advance('|');
            return this;
        });

        // tail call optimization
        // this is invoked by the post parser to analyse lambda functions to see
        // if they make a tail call.  If so, it is replaced by a thunk which will
        // be invoked by the trampoline loop during function application.
        // This enables tail-recursive functions to be written without growing the stack
        var tail_call_optimize = function(expr) {
            var result;
            if(expr.type === 'function') {
                var thunk = {type: 'lambda', thunk: true, arguments: [], position: expr.position};
                thunk.body = expr;
                result = thunk;
            } else if(expr.type === 'condition') {
                // analyse both branches
                expr.then = tail_call_optimize(expr.then);
                if(typeof expr.else !== 'undefined') {
                    expr.else = tail_call_optimize(expr.else);
                }
                result = expr;
            } else if(expr.type === 'block') {
                // only the last expression in the block
                var length = expr.expressions.length;
                if(length > 0) {
                    expr.expressions[length - 1] = tail_call_optimize(expr.expressions[length - 1]);
                }
                result = expr;
            } else {
                result = expr;
            }
            return result;
        };

        // post-parse stage
        // the purpose of this is flatten the parts of the AST representing location paths,
        // converting them to arrays of steps which in turn may contain arrays of predicates.
        // following this, nodes containing '.' and '[' should be eliminated from the AST.
        var ast_optimize = function (expr) {
            var result;
            switch (expr.type) {
                case 'binary':
                    switch (expr.value) {
                        case '.':
                            var lstep = ast_optimize(expr.lhs);
                            result = {type: 'path', steps: []};
                            if (lstep.type === 'path') {
                                Array.prototype.push.apply(result.steps, lstep.steps);
                            } else {
                                result.steps = [lstep];
                            }
                            var rest = ast_optimize(expr.rhs);
                            if(rest.type === 'function' &&
                              rest.procedure.type === 'path' &&
                              rest.procedure.steps.length === 1 &&
                              rest.procedure.steps[0].type === 'name' &&
                              result.steps[result.steps.length-1].type === 'function') {
                                // next function in chain of functions - will override a thenable
                                result.steps[result.steps.length-1].nextFunction = rest.procedure.steps[0].value;
                            }
                            if(rest.type !== 'path') {
                                rest = {type: 'path', steps: [rest]};
                            }
                            Array.prototype.push.apply(result.steps, rest.steps);
                            // any steps within a path that are literals, should be changed to 'name'
                            result.steps.filter(function(step) {
                                return step.type === 'literal';
                            }).forEach(function(lit) {
                                lit.type = 'name';
                            });
                            // any step that signals keeping a singleton array, should be flagged on the path
                            if(result.steps.filter(function(step) { return step.keepArray === true;}).length > 0) {
                                result.keepSingletonArray = true;
                            }
                            // if first step is a path constructor, flag it for special handling
                            if(result.steps[0].type === 'unary' && result.steps[0].value === '[') {
                                result.steps[0].consarray = true;
                            }
                            break;
                        case '[':
                            // predicated step
                            // LHS is a step or a predicated step
                            // RHS is the predicate expr
                            result = ast_optimize(expr.lhs);
                            var step = result;
                            if(result.type === 'path') {
                                step = result.steps[result.steps.length - 1];
                            }
                            if (typeof step.group !== 'undefined') {
                                throw {
                                    code: "S0209",
                                    stack: (new Error()).stack,
                                    position: expr.position
                                };
                            }
                            if (typeof step.predicate === 'undefined') {
                                step.predicate = [];
                            }
                            step.predicate.push(ast_optimize(expr.rhs));
                            break;
                        case '{':
                            // group-by
                            // LHS is a step or a predicated step
                            // RHS is the object constructor expr
                            result = ast_optimize(expr.lhs);
                            if (typeof result.group !== 'undefined') {
                                throw {
                                    code: "S0210",
                                    stack: (new Error()).stack,
                                    position: expr.position
                                };
                            }
                            // object constructor - process each pair
                            result.group = {
                                lhs: expr.rhs.map(function (pair) {
                                    return [ast_optimize(pair[0]), ast_optimize(pair[1])];
                                }),
                                position: expr.position
                            };
                            break;
                        case '^':
                            // order-by
                            // LHS is the array to be ordered
                            // RHS defines the terms
                            result = {type: 'sort', value: expr.value, position: expr.position};
                            result.lhs = ast_optimize(expr.lhs);
                            result.rhs = expr.rhs.map(function (terms) {
                                return {
                                    descending: terms.descending,
                                    expression: ast_optimize(terms.expression)
                                };
                            });
                            break;
                        case ':=':
                            result = {type: 'bind', value: expr.value, position: expr.position};
                            result.lhs = ast_optimize(expr.lhs);
                            result.rhs = ast_optimize(expr.rhs);
                            break;
                        case '~>':
                            result = {type: 'apply', value: expr.value, position: expr.position};
                            result.lhs = ast_optimize(expr.lhs);
                            result.rhs = ast_optimize(expr.rhs);
                            break;
                        default:
                            result = {type: expr.type, value: expr.value, position: expr.position};
                            result.lhs = ast_optimize(expr.lhs);
                            result.rhs = ast_optimize(expr.rhs);
                    }
                    break;
                case 'unary':
                    result = {type: expr.type, value: expr.value, position: expr.position};
                    if (expr.value === '[') {
                        // array constructor - process each item
                        result.expressions = expr.expressions.map(function (item) {
                            return ast_optimize(item);
                        });
                    } else if (expr.value === '{') {
                        // object constructor - process each pair
                        result.lhs = expr.lhs.map(function (pair) {
                            return [ast_optimize(pair[0]), ast_optimize(pair[1])];
                        });
                    } else {
                        // all other unary expressions - just process the expression
                        result.expression = ast_optimize(expr.expression);
                        // if unary minus on a number, then pre-process
                        if (expr.value === '-' && result.expression.type === 'literal' && isNumeric(result.expression.value)) {
                            result = result.expression;
                            result.value = -result.value;
                        }
                    }
                    break;
                case 'function':
                case 'partial':
                    result = {type: expr.type, name: expr.name, value: expr.value, position: expr.position};
                    result.arguments = expr.arguments.map(function (arg) {
                        return ast_optimize(arg);
                    });
                    result.procedure = ast_optimize(expr.procedure);
                    break;
                case 'lambda':
                    result = {type: expr.type, arguments: expr.arguments, signature: expr.signature, position: expr.position};
                    var body = ast_optimize(expr.body);
                    result.body = tail_call_optimize(body);
                    break;
                case 'condition':
                    result = {type: expr.type, position: expr.position};
                    result.condition = ast_optimize(expr.condition);
                    result.then = ast_optimize(expr.then);
                    if (typeof expr.else !== 'undefined') {
                        result.else = ast_optimize(expr.else);
                    }
                    break;
                case 'transform':
                    result = {type: expr.type, position: expr.position};
                    result.pattern = ast_optimize(expr.pattern);
                    result.update = ast_optimize(expr.update);
                    if(typeof expr.delete !== 'undefined') {
                        result.delete = ast_optimize(expr.delete);
                    }
                    break;
                case 'block':
                    result = {type: expr.type, position: expr.position};
                    // array of expressions - process each one
                    result.expressions = expr.expressions.map(function (item) {
                        return ast_optimize(item);
                    });
                    // TODO scan the array of expressions to see if any of them assign variables
                    // if so, need to mark the block as one that needs to create a new frame
                    break;
                case 'name':
                    result = {type: 'path', steps: [expr]};
                    if(expr.keepArray) {
                        result.keepSingletonArray = true;
                    }
                    break;
                case 'literal':
                case 'wildcard':
                case 'descendant':
                case 'variable':
                case 'regex':
                    result = expr;
                    break;
                case 'operator':
                    // the tokens 'and' and 'or' might have been used as a name rather than an operator
                    if (expr.value === 'and' || expr.value === 'or' || expr.value === 'in') {
                        expr.type = 'name';
                        result = ast_optimize(expr);
                    } else /* istanbul ignore else */ if (expr.value === '?') {
                        // partial application
                        result = expr;
                    } else {
                        throw {
                            code: "S0201",
                            stack: (new Error()).stack,
                            position: expr.position,
                            token: expr.value
                        };
                    }
                    break;
                case 'error':
                    result = expr;
                    if(expr.lhs) {
                        result = ast_optimize(expr.lhs);
                    }
                    break;
                default:
                    var code = "S0206";
                    /* istanbul ignore else */
                    if (expr.id === '(end)') {
                        code = "S0207";
                    }
                    var err = {
                        code: code,
                        position: expr.position,
                        token: expr.value
                    };
                    if(recover) {
                        errors.push(err);
                        return {type: 'error', error: err};
                    } else {
                        err.stack = (new Error()).stack;
                        throw err;
                    }
            }
            return result;
        };

        // now invoke the tokenizer and the parser and return the syntax tree
        lexer = tokenizer(source);
        advance();
        // parse the tokens
        var expr = expression(0);
        if (node.id !== '(end)') {
            var err = {
                code: "S0201",
                position: node.position,
                token: node.value
            };
            handleError(err);
        }
        expr = ast_optimize(expr);

        if(errors.length > 0) {
            expr.errors = errors;
        }

        return expr;
    };

    // Start of Evaluator code

    var staticFrame = createFrame(null);

    /**
     * Check if value is a finite number
     * @param {float} n - number to evaluate
     * @returns {boolean} True if n is a finite number
     */
    function isNumeric(n) {
        var isNum = false;
        if(typeof n === 'number') {
            var num = parseFloat(n);
            isNum = !isNaN(num);
            if (isNum && !isFinite(num)) {
                throw {
                    code: "D1001",
                    value: n,
                    stack: (new Error()).stack
                };
            }
        }
        return isNum;
    }

    /**
     * Returns true if the arg is an array of strings
     * @param {*} arg - the item to test
     * @returns {boolean} True if arg is an array of strings
     */
    function isArrayOfStrings(arg) {
        var result = false;
        /* istanbul ignore else */
        if(Array.isArray(arg)) {
            result = (arg.filter(function(item){return typeof item !== 'string';}).length === 0);
        }
        return result;
    }

    /**
     * Returns true if the arg is an array of numbers
     * @param {*} arg - the item to test
     * @returns {boolean} True if arg is an array of numbers
     */
    function isArrayOfNumbers(arg) {
        var result = false;
        if(Array.isArray(arg)) {
            result = (arg.filter(function(item){return !isNumeric(item);}).length === 0);
        }
        return result;
    }

    // Polyfill
    /* istanbul ignore next */
    Number.isInteger = Number.isInteger || function(value) {
        return typeof value === "number" &&
          isFinite(value) &&
          Math.floor(value) === value;
    };

    /**
     * Evaluate expression against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluate(expr, input, environment) {
        var result;

        var entryCallback = environment.lookup('__evaluate_entry');
        if(entryCallback) {
            entryCallback(expr, input, environment);
        }

        switch (expr.type) {
            case 'path':
                result = yield * evaluatePath(expr.steps, input, environment);
                result = normalizeSequence(result, expr.keepSingletonArray);
                break;
            case 'binary':
                result = yield * evaluateBinary(expr, input, environment);
                break;
            case 'unary':
                result = yield * evaluateUnary(expr, input, environment);
                break;
            case 'name':
                result = evaluateName(expr, input, environment);
                break;
            case 'literal':
                result = evaluateLiteral(expr, input, environment);
                break;
            case 'wildcard':
                result = evaluateWildcard(expr, input, environment);
                break;
            case 'descendant':
                result = evaluateDescendants(expr, input, environment);
                break;
            case 'condition':
                result = yield * evaluateCondition(expr, input, environment);
                break;
            case 'block':
                result = yield * evaluateBlock(expr, input, environment);
                break;
            case 'bind':
                result = yield * evaluateBindExpression(expr, input, environment);
                break;
            case 'regex':
                result = evaluateRegex(expr, input, environment);
                break;
            case 'function':
                result = yield * evaluateFunction(expr, input, environment);
                break;
            case 'variable':
                result = evaluateVariable(expr, input, environment);
                break;
            case 'lambda':
                result = evaluateLambda(expr, input, environment);
                break;
            case 'partial':
                result = yield * evaluatePartialApplication(expr, input, environment);
                break;
            case 'apply':
                result = yield * evaluateApplyExpression(expr, input, environment);
                break;
            case 'sort':
                result = yield * evaluateSortExpression(expr, input, environment);
                break;
            case 'transform':
                result = evaluateTransformExpression(expr, input, environment);
                break;
        }

        if(environment.lookup('__jsonata_async') &&
          (typeof result === 'undefined' || result === null || typeof result.then !== 'function')) {
            result = Promise.resolve(result);
        }
        if(environment.lookup('__jsonata_async') && typeof result.then === 'function' && expr.nextFunction && typeof result[expr.nextFunction] === 'function') {
            // although this is a 'thenable', it is chaining a different function
            // so don't yield since yielding will trigger the .then()
        } else {
            result = yield result;
        }


        if (expr.hasOwnProperty('predicate')) {
            result = yield * applyPredicates(expr.predicate, result, environment);
            result = normalizeSequence(result);

        }
        if (expr.hasOwnProperty('group')) {
            result = yield * evaluateGroupExpression(expr.group, result, environment);
        }

        var exitCallback = environment.lookup('__evaluate_exit');
        if(exitCallback) {
            exitCallback(expr, input, environment, result);
        }

        return result;
    }

    /**
     * Evaluate path expression against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluatePath(expr, input, environment) {
        var inputSequence;
        // expr is an array of steps
        // if the first step is a variable reference ($...), including root reference ($$),
        //   then the path is absolute rather than relative
        if (expr[0].type === 'variable') {
            inputSequence = [input]; // dummy singleton sequence for first (absolute) step
        } else if (Array.isArray(input)) {
            inputSequence = input;
        } else {
            // if input is not an array, make it so
            inputSequence = [input];
        }

        var resultSequence;

        // evaluate each step in turn
        for(var ii = 0; ii < expr.length; ii++) {
            var step = expr[ii];

            // if the first step is an explicit array constructor, then just evaluate that (i.e. don't iterate over a context array)
            if(ii === 0 && step.consarray) {
                resultSequence = yield * evaluate(step, inputSequence, environment);
            } else {
                resultSequence = yield * evaluateStep(step, inputSequence, environment);
            }

            if(typeof resultSequence === 'undefined' || resultSequence.length === 0) {
                break;
            }
            inputSequence = resultSequence;
        }

        return resultSequence;
    }

    /**
     * Normalize a JSONata sequence - singleton arrays become atomic values
     * @param {Array} sequence - input sequence
     * @param {Boolean} keepSingleton - keep singleton sequences as arrays
     * @returns {*} normalized sequence
     */
    function normalizeSequence(sequence, keepSingleton) {
        var result;
        if(typeof sequence === 'undefined') {
            result = undefined;
        } else if(!Array.isArray(sequence)) {
            result = sequence;
        } else if (sequence.length === 1) {
            if(keepSingleton) {
                result = sequence;
            } else {
                result = sequence[0];
            }
        } else if (sequence.length > 1) {
            result = sequence;
        }
        return result;
    }

    /**
     * Evaluate a step within a path
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluateStep(expr, input, environment) {
        var result = [];


        for(var ii = 0; ii < input.length; ii++) {
            var res = yield * evaluate(expr, input[ii], environment);
            if (!(Array.isArray(res) && (expr.value !== '[' )) && !expr.consarray) {
                res = [res];
            }
            // is res an array - if so, flatten it into the parent array
            res.forEach(function (innerRes) {
                if (typeof innerRes !== 'undefined') {
                    result.push(innerRes);
                }
            });
        }
        return result;
    }

    /**
     * Apply predicates to input data
     * @param {Object} predicates - Predicates
     * @param {Object} input - Input data to apply predicates against
     * @param {Object} environment - Environment
     * @returns {*} Result after applying predicates
     */
    function* applyPredicates(predicates, input, environment) {
        var inputSequence = input;
        // lhs potentially holds an array
        // we want to iterate over the array, and only keep the items that are
        // truthy when applied to the predicate.
        // if the predicate evaluates to an integer, then select that index

        var results = [];
        for(var ii = 0; ii < predicates.length; ii++) {
            var predicate = predicates[ii];
            // if it's not an array, turn it into one
            // since in XPath >= 2.0 an item is equivalent to a singleton sequence of that item
            // if input is not an array, make it so
            if (!Array.isArray(inputSequence)) {
                inputSequence = [inputSequence];
            }
            results = [];
            if (predicate.type === 'literal' && isNumeric(predicate.value)) {
                var index = predicate.value;
                if (!Number.isInteger(index)) {
                    // round it down
                    index = Math.floor(index);
                }
                if (index < 0) {
                    // count in from end of array
                    index = inputSequence.length + index;
                }
                results = inputSequence[index];
            } else {
                results = yield * evaluateFilter(predicate, inputSequence, environment);
            }
            inputSequence = results;
        }
        return results;
    }

    /**
     * Apply filter predicate to input data
     * @param {Object} predicate - filter expression
     * @param {Object} input - Input data to apply predicates against
     * @param {Object} environment - Environment
     * @returns {*} Result after applying predicates
     */
    function* evaluateFilter(predicate, input, environment) {
        var results = [];
        for(var index = 0; index < input.length; index++) {
            var item = input[index];
            var res = yield * evaluate(predicate, item, environment);
            if (isNumeric(res)) {
                res = [res];
            }
            if(isArrayOfNumbers(res)) {
                res.forEach(function(ires) {
                    if (!Number.isInteger(ires)) {
                        // round it down
                        ires = Math.floor(ires);
                    }
                    if (ires < 0) {
                        // count in from end of array
                        ires = input.length + ires;
                    }
                    if (ires === index) {
                        results.push(item);
                    }
                });
            } else if (functionBoolean(res)) { // truthy
                results.push(item);
            }
        }
        return results;
    }

    /**
     * Evaluate binary expression against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function * evaluateBinary(expr, input, environment) {
        var result;
        var lhs = yield * evaluate(expr.lhs, input, environment);
        var rhs = yield * evaluate(expr.rhs, input, environment);
        var op = expr.value;

        try {
            switch (op) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                    result = evaluateNumericExpression(lhs, rhs, op);
                    break;
                case '=':
                case '!=':
                case '<':
                case '<=':
                case '>':
                case '>=':
                    result = evaluateComparisonExpression(lhs, rhs, op);
                    break;
                case '&':
                    result = evaluateStringConcat(lhs, rhs);
                    break;
                case 'and':
                case 'or':
                    result = evaluateBooleanExpression(lhs, rhs, op);
                    break;
                case '..':
                    result = evaluateRangeExpression(lhs, rhs);
                    break;
                case 'in':
                    result = evaluateIncludesExpression(lhs, rhs);
                    break;
            }
        } catch(err) {
            err.position = expr.position;
            err.token = op;
            throw err;
        }
        return result;
    }

    /**
     * Evaluate unary expression against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluateUnary(expr, input, environment) {
        var result;

        switch (expr.value) {
            case '-':
                result = yield * evaluate(expr.expression, input, environment);
                if (isNumeric(result)) {
                    result = -result;
                } else {
                    throw {
                        code: "D1002",
                        stack: (new Error()).stack,
                        position: expr.position,
                        token: expr.value,
                        value: result
                    };
                }
                break;
            case '[':
                // array constructor - evaluate each item
                result = [];
                for(var ii = 0; ii < expr.expressions.length; ii++) {
                    var item = expr.expressions[ii];
                    var value = yield * evaluate(item, input, environment);
                    if (typeof value !== 'undefined') {
                        if(item.value === '[') {
                            result.push(value);
                        } else {
                            result = functionAppend(result, value);
                        }
                    }
                }
                break;
            case '{':
                // object constructor - apply grouping
                result = yield * evaluateGroupExpression(expr, input, environment);
                break;

        }
        return result;
    }

    /**
     * Evaluate name object against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function evaluateName(expr, input, environment) {
        // lookup the 'name' item in the input
        var result;
        if (Array.isArray(input)) {
            result = [];
            for(var ii = 0; ii < input.length; ii++) {
                var res =  evaluateName(expr, input[ii], environment);
                if (typeof res !== 'undefined') {
                    result.push(res);
                }
            }
        } else if (input !== null && typeof input === 'object') {
            result = input[expr.value];
        }
        result = normalizeSequence(result);
        return result;
    }

    /**
     * Evaluate literal against input data
     * @param {Object} expr - JSONata expression
     * @returns {*} Evaluated input data
     */
    function evaluateLiteral(expr) {
        return expr.value;
    }

    /**
     * Evaluate wildcard against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @returns {*} Evaluated input data
     */
    function evaluateWildcard(expr, input) {
        var result;
        var results = [];
        if (input !== null && typeof input === 'object') {
            Object.keys(input).forEach(function (key) {
                var value = input[key];
                if(Array.isArray(value)) {
                    value = flatten(value);
                    results = functionAppend(results, value);
                } else {
                    results.push(value);
                }
            });
        }

        result = normalizeSequence(results);
        return result;
    }

    /**
     * Returns a flattened array
     * @param {Array} arg - the array to be flatten
     * @param {Array} flattened - carries the flattened array - if not defined, will initialize to []
     * @returns {Array} - the flattened array
     */
    function flatten(arg, flattened) {
        if(typeof flattened === 'undefined') {
            flattened = [];
        }
        if(Array.isArray(arg)) {
            arg.forEach(function (item) {
                flatten(item, flattened);
            });
        } else {
            flattened.push(arg);
        }
        return flattened;
    }

    /**
     * Evaluate descendants against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @returns {*} Evaluated input data
     */
    function evaluateDescendants(expr, input) {
        var result;
        var resultSequence = [];
        if (typeof input !== 'undefined') {
            // traverse all descendants of this object/array
            recurseDescendants(input, resultSequence);
            if (resultSequence.length === 1) {
                result = resultSequence[0];
            } else {
                result = resultSequence;
            }
        }
        return result;
    }

    /**
     * Recurse through descendants
     * @param {Object} input - Input data
     * @param {Object} results - Results
     */
    function recurseDescendants(input, results) {
        // this is the equivalent of //* in XPath
        if (!Array.isArray(input)) {
            results.push(input);
        }
        if (Array.isArray(input)) {
            input.forEach(function (member) {
                recurseDescendants(member, results);
            });
        } else if (input !== null && typeof input === 'object') {
            Object.keys(input).forEach(function (key) {
                recurseDescendants(input[key], results);
            });
        }
    }

    /**
     * Evaluate numeric expression against input data
     * @param {Object} lhs - LHS value
     * @param {Object} rhs - RHS value
     * @param {Object} op - opcode
     * @returns {*} Result
     */
    function evaluateNumericExpression(lhs, rhs, op) {
        var result;

        if (typeof lhs === 'undefined' || typeof rhs === 'undefined') {
            // if either side is undefined, the result is undefined
            return result;
        }

        if (!isNumeric(lhs)) {
            throw {
                code: "T2001",
                stack: (new Error()).stack,
                value: lhs
            };
        }
        if (!isNumeric(rhs)) {
            throw {
                code: "T2002",
                stack: (new Error()).stack,
                value: rhs
            };
        }

        switch (op) {
            case '+':
                result = lhs + rhs;
                break;
            case '-':
                result = lhs - rhs;
                break;
            case '*':
                result = lhs * rhs;
                break;
            case '/':
                result = lhs / rhs;
                break;
            case '%':
                result = lhs % rhs;
                break;
        }
        return result;
    }

    /**
     * Evaluate comparison expression against input data
     * @param {Object} lhs - LHS value
     * @param {Object} rhs - RHS value
     * @param {Object} op - opcode
     * @returns {*} Result
     */
    function evaluateComparisonExpression(lhs, rhs, op) {
        var result;

        // type checks
        var ltype = typeof lhs;
        var rtype = typeof rhs;

        if (ltype === 'undefined' || rtype === 'undefined') {
            // if either side is undefined, the result is false
            return false;
        }

        var validate = function() {
            // if aa or bb are not string or numeric values, then throw an error
            if (!(ltype === 'string' || ltype === 'number') || !(rtype === 'string' || rtype === 'number')) {
                throw {
                    code: "T2010",
                    stack: (new Error()).stack,
                    value: !(ltype === 'string' || ltype === 'number') ? lhs : rhs
                };
            }

            //if aa and bb are not of the same type
            if (ltype !== rtype) {
                throw {
                    code: "T2009",
                    stack: (new Error()).stack,
                    value: lhs,
                    value2: rhs
                };
            }
        };

        switch (op) {
            case '=':
                result = lhs === rhs;
                break;
            case '!=':
                result = (lhs !== rhs);
                break;
            case '<':
                validate();
                result = lhs < rhs;
                break;
            case '<=':
                validate();
                result = lhs <= rhs;
                break;
            case '>':
                validate();
                result = lhs > rhs;
                break;
            case '>=':
                validate();
                result = lhs >= rhs;
                break;
        }
        return result;
    }

    /**
     * Inclusion operator - in
     *
     * @param {Object} lhs - LHS value
     * @param {Object} rhs - RHS value
     * @returns {boolean} - true if lhs is a member of rhs
     */
    function evaluateIncludesExpression(lhs, rhs) {
        var result = false;

        if (typeof lhs === 'undefined' || typeof rhs === 'undefined') {
            // if either side is undefined, the result is false
            return false;
        }

        if(!Array.isArray(rhs)) {
            rhs = [rhs];
        }

        for(var i = 0; i < rhs.length; i++) {
            if(rhs[i] === lhs) {
                result = true;
                break;
            }
        }

        return result;
    }

    /**
     * Evaluate boolean expression against input data
     * @param {Object} lhs - LHS value
     * @param {Object} rhs - RHS value
     * @param {Object} op - opcode
     * @returns {*} Result
     */
    function evaluateBooleanExpression(lhs, rhs, op) {
        var result;

        switch (op) {
            case 'and':
                result = functionBoolean(lhs) && functionBoolean(rhs);
                break;
            case 'or':
                result = functionBoolean(lhs) || functionBoolean(rhs);
                break;
        }
        return result;
    }

    /**
     * Evaluate string concatenation against input data
     * @param {Object} lhs - LHS value
     * @param {Object} rhs - RHS value
     * @returns {string|*} Concatenated string
     */
    function evaluateStringConcat(lhs, rhs) {
        var result;

        var lstr = '';
        var rstr = '';
        if (typeof lhs !== 'undefined') {
            lstr = functionString(lhs);
        }
        if (typeof rhs !== 'undefined') {
            rstr = functionString(rhs);
        }

        result = lstr.concat(rstr);
        return result;
    }

    /**
     * Evaluate group expression against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {{}} Evaluated input data
     */
    function* evaluateGroupExpression(expr, input, environment) {
        var result = {};
        var groups = {};
        // group the input sequence by 'key' expression
        if (!Array.isArray(input)) {
            input = [input];
        }
        for(var itemIndex = 0; itemIndex < input.length; itemIndex++) {
            var item = input[itemIndex];
            for(var pairIndex = 0; pairIndex < expr.lhs.length; pairIndex++) {
                var pair = expr.lhs[pairIndex];
                var key = yield * evaluate(pair[0], item, environment);
                // key has to be a string
                if (typeof  key !== 'string') {
                    throw {
                        code: "T1003",
                        stack: (new Error()).stack,
                        position: expr.position,
                        value: key
                    };
                }
                var entry = {data: item, expr: pair[1]};
                if (groups.hasOwnProperty(key)) {
                    // a value already exists in this slot
                    // append it as an array
                    groups[key].data = functionAppend(groups[key].data, item);
                } else {
                    groups[key] = entry;
                }
            }
        }

        // iterate over the groups to evaluate the 'value' expression
        for (key in groups) {
            entry = groups[key];
            var value = yield * evaluate(entry.expr, entry.data, environment);
            if(typeof value !== 'undefined') {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Evaluate range expression against input data
     * @param {Object} lhs - LHS value
     * @param {Object} rhs - RHS value
     * @returns {Array} Resultant array
     */
    function evaluateRangeExpression(lhs, rhs) {
        var result;

        if (typeof lhs === 'undefined' || typeof rhs === 'undefined') {
            // if either side is undefined, the result is undefined
            return result;
        }

        if (lhs > rhs) {
            // if the lhs is greater than the rhs, return undefined
            return result;
        }

        if (!Number.isInteger(lhs)) {
            throw {
                code: "T2003",
                stack: (new Error()).stack,
                value: lhs
            };
        }
        if (!Number.isInteger(rhs)) {
            throw {
                code: "T2004",
                stack: (new Error()).stack,
                value: rhs
            };
        }

        result = new Array(rhs - lhs + 1);
        for (var item = lhs, index = 0; item <= rhs; item++, index++) {
            result[index] = item;
        }
        return result;
    }

    /**
     * Evaluate bind expression against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluateBindExpression(expr, input, environment) {
        // The RHS is the expression to evaluate
        // The LHS is the name of the variable to bind to - should be a VARIABLE token
        var value = yield * evaluate(expr.rhs, input, environment);
        if (expr.lhs.type !== 'variable') {
            throw {
                code: "D2005",
                stack: (new Error()).stack,
                position: expr.position,
                token: expr.value,
                value: expr.lhs.type === 'path' ? expr.lhs.steps[0].value : expr.lhs.value
            };
        }
        environment.bind(expr.lhs.value, value);
        return value;
    }

    /**
     * Evaluate condition against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluateCondition(expr, input, environment) {
        var result;
        var condition = yield * evaluate(expr.condition, input, environment);
        if (functionBoolean(condition)) {
            result = yield * evaluate(expr.then, input, environment);
        } else if (typeof expr.else !== 'undefined') {
            result = yield * evaluate(expr.else, input, environment);
        }
        return result;
    }

    /**
     * Evaluate block against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluateBlock(expr, input, environment) {
        var result;
        // create a new frame to limit the scope of variable assignments
        // TODO, only do this if the post-parse stage has flagged this as required
        var frame = createFrame(environment);
        // invoke each expression in turn
        // only return the result of the last one
        for(var ii = 0; ii < expr.expressions.length; ii++) {
            result = yield * evaluate(expr.expressions[ii], input, frame);
        }

        return result;
    }

    /**
     * Prepare a regex
     * @param {Object} expr - expression containing regex
     * @returns {Function} Higher order function representing prepared regex
     */
    function evaluateRegex(expr) {
        expr.value.lastIndex = 0;
        var closure = function(str) {
            var re = expr.value;
            var result;
            var match = re.exec(str);
            if(match !== null) {
                result = {
                    match: match[0],
                    start: match.index,
                    end: match.index + match[0].length,
                    groups: []
                };
                if(match.length > 1) {
                    for(var i = 1; i < match.length; i++) {
                        result.groups.push(match[i]);
                    }
                }
                result.next = function() {
                    if(re.lastIndex >= str.length) {
                        return undefined;
                    } else {
                        var next = closure(str);
                        if(next && next.match === '' && re.lastIndex === expr.value.lastIndex) {
                            // matches zero length string; this will never progress
                            throw {
                                code: "D1004",
                                stack: (new Error()).stack,
                                position: expr.position,
                                value: expr.value.source
                            };
                        }
                        return next;
                    }
                };
            }

            return result;
        };
        return closure;
    }

    /**
     * Evaluate variable against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function evaluateVariable(expr, input, environment) {
        // lookup the variable value in the environment
        var result;
        // if the variable name is empty string, then it refers to context value
        if (expr.value === '') {
            result = input;
        } else {
            result = environment.lookup(expr.value);
        }
        return result;
    }

    /**
     * sort / order-by operator
     * @param {Object} expr - AST for operator
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Ordered sequence
     */
    function* evaluateSortExpression(expr, input, environment) {
        var result;

        // evaluate the lhs, then sort the results in order according to rhs expression
        var lhs = yield * evaluate(expr.lhs, input, environment);

        // sort the lhs array
        // use comparator function
        var comparator = function(a, b) {
            // expr.rhs is an array of order-by in priority order
            var comp = 0;
            for(var index = 0; comp === 0 && index < expr.rhs.length; index++) {
                var term = expr.rhs[index];
                //evaluate the rhs expression in the context of a
                var aa = driveGenerator(term.expression, a, environment);
                //evaluate the rhs expression in the context of b
                var bb = driveGenerator(term.expression, b, environment);

                // type checks
                var atype = typeof aa;
                var btype = typeof bb;
                // undefined should be last in sort order
                if(atype === 'undefined') {
                    // swap them, unless btype is also undefined
                    comp = (btype === 'undefined') ? 0 : 1;
                    continue;
                }
                if(btype === 'undefined') {
                    comp = -1;
                    continue;
                }

                // if aa or bb are not string or numeric values, then throw an error
                if(!(atype === 'string' || atype === 'number') || !(btype === 'string' || btype === 'number')) {
                    throw {
                        code: "T2008",
                        stack: (new Error()).stack,
                        position: expr.position,
                        value: !(atype === 'string' || atype === 'number') ? aa : bb
                    };
                }

                //if aa and bb are not of the same type
                if(atype !== btype) {
                    throw {
                        code: "T2007",
                        stack: (new Error()).stack,
                        position: expr.position,
                        value: aa,
                        value2: bb
                    };
                }
                if(aa === bb) {
                    // both the same - move on to next term
                    continue;
                } else if (aa < bb) {
                    comp = -1;
                } else {
                    comp = 1;
                }
                if(term.descending === true) {
                    comp = -comp;
                }
            }
            // only swap a & b if comp equals 1
            return comp === 1;
        };

        result = functionSort(lhs, comparator);

        return result;
    }

    /**
     * create a transformer function
     * @param {Object} expr - AST for operator
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} tranformer function
     */
    function evaluateTransformExpression(expr, input, environment) {
        // create a function to implement the transform definition
        var transformer = function*(obj) { // signature <(oa):o>
            // undefined inputs always return undefined
            if(typeof obj === 'undefined') {
                return undefined;
            }

            // this function returns a copy of obj with changes specified by the pattern/operation
            var cloneFunction = environment.lookup('clone');
            if(!isFunction(cloneFunction)) {
                // throw type error
                throw {
                    code: "T2013",
                    stack: (new Error()).stack,
                    position: expr.position
                };
            }
            var result = yield * apply(cloneFunction, [obj], environment);
            var matches = yield * evaluate(expr.pattern, result, environment);
            if(typeof matches !== 'undefined') {
                if(!Array.isArray(matches)) {
                    matches = [matches];
                }
                for(var ii = 0; ii < matches.length; ii++) {
                    var match = matches[ii];
                    // evaluate the update value for each match
                    var update = yield * evaluate(expr.update, match, environment);
                    // update must be an object
                    var updateType = typeof update;
                    if(updateType !== 'undefined') {
                        if(updateType !== 'object' || update === null) {
                            // throw type error
                            throw {
                                code: "T2011",
                                stack: (new Error()).stack,
                                position: expr.update.position,
                                value: update
                            };
                        }
                        // merge the update
                        for(var prop in update) {
                            match[prop] = update[prop];
                        }
                    }

                    // delete, if specified, must be an array of strings (or single string)
                    if(typeof expr.delete !== 'undefined') {
                        var deletions = yield * evaluate(expr.delete, match, environment);
                        if(typeof deletions !== 'undefined') {
                            var val = deletions;
                            if (!Array.isArray(deletions)) {
                                deletions = [deletions];
                            }
                            if (!isArrayOfStrings(deletions)) {
                                // throw type error
                                throw {
                                    code: "T2012",
                                    stack: (new Error()).stack,
                                    position: expr.delete.position,
                                    value: val
                                };
                            }
                            for (var jj = 0; jj < deletions.length; jj++) {
                                delete match[deletions[jj]];
                            }
                        }
                    }
                }
            }

            return result;
        };

        return defineFunction(transformer, '<(oa):o>');
    }

    /**
     * Evaluate an expression by driving the generator to completion
     * Used when it's not possible to yield
     * @param {Object} expr - AST
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} result
     */
    function driveGenerator(expr, input, environment) {
        var gen = evaluate(expr, input, environment);
        // returns a generator - so iterate over it
        var comp = gen.next();
        while (!comp.done) {
            comp = gen.next(comp.value);
        }
        return comp.value;
    }

    var chain = driveGenerator(parser('function($f, $g) { function($x){ $g($f($x)) } }'), null, staticFrame);

    /**
     * Apply the function on the RHS using the sequence on the LHS as the first argument
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluateApplyExpression(expr, input, environment) {
        var result;


        if(expr.rhs.type === 'function') {
            // this is a function _invocation_; invoke it with lhs expression as the first argument
            expr.rhs.arguments.unshift(expr.lhs);
            result = yield * evaluateFunction(expr.rhs, input, environment);
            expr.rhs.arguments.shift();
        } else {
            var lhs = yield * evaluate(expr.lhs, input, environment);
            var func = yield * evaluate(expr.rhs, input, environment);

            if(!isFunction(func)) {
                throw {
                    code: "T2006",
                    stack: (new Error()).stack,
                    position: expr.position,
                    value: func
                };
            }

            if(isFunction(lhs)) {
                // this is function chaining (func1 ~> func2)
                // λ($f, $g) { λ($x){ $g($f($x)) } }
                result = yield * apply(chain, [lhs, func], environment, null);
            } else {
                result = yield * apply(func, [lhs], environment, null);
            }

        }

        return result;
    }

    /**
     *
     * @param {Object} arg - expression to test
     * @returns {boolean} - true if it is a function (lambda or built-in)
     */
    function isFunction(arg) {
        return ((arg && (arg._jsonata_function === true || arg._jsonata_lambda === true)) || typeof arg === 'function');
    }

    /**
     * Tests whether arg is a lambda function
     * @param {*} arg - the value to test
     * @returns {boolean} - true if it is a lambda function
     */
    function isLambda(arg) {
        return arg && arg._jsonata_lambda === true;
    }

    /**
     * @param {Object} arg - expression to test
     * @returns {boolean} - true if it is a generator i.e. the result from calling a
     * generator function
     */
    function isGenerator(arg) {
        return (
            typeof arg === 'object' &&
            arg !== null &&
            Symbol.iterator in arg &&
            typeof arg[Symbol.iterator] === 'function' &&
            'next' in arg &&
            typeof arg.next === 'function'
        );
    }

    /**
     * Evaluate function against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @param {Object} [applyto] - LHS of ~> operator
     * @returns {*} Evaluated input data
     */
    function* evaluateFunction(expr, input, environment) {
        var result;

        // create the procedure
        // can't assume that expr.procedure is a lambda type directly
        // could be an expression that evaluates to a function (e.g. variable reference, parens expr etc.
        // evaluate it generically first, then check that it is a function.  Throw error if not.
        var proc = yield * evaluate(expr.procedure, input, environment);

        if (typeof proc === 'undefined' && expr.procedure.type === 'path' && environment.lookup(expr.procedure.steps[0].value)) {
            // help the user out here if they simply forgot the leading $
            throw {
                code: "T1005",
                stack: (new Error()).stack,
                position: expr.position,
                token: expr.procedure.steps[0].value
            };
        }

        var evaluatedArgs = [];
        // eager evaluation - evaluate the arguments
        for (var jj = 0; jj < expr.arguments.length; jj++) {
            // only evaluate 'eager' arguments at this stage; wrap the 'lazy' ones in a closure
            evaluatedArgs.push(yield* evaluate(expr.arguments[jj], input, environment));
        }
        // apply the procedure
        try {
            // if(input instanceof Object) {
            //     Object.defineProperty(input, '__env__', {
            //         enumerable: false,
            //         configurable: true,
            //         get: function () {
            //             return environment;
            //         }
            //     });
            // }
            result = yield * apply(proc, evaluatedArgs, input);
        } catch (err) {
            // add the position field to the error
            err.position = expr.position;
            // and the function identifier
            err.token = expr.procedure.type === 'path' ? expr.procedure.steps[0].value : expr.procedure.value;
            throw err;
        }
        return result;
    }

    /**
     * Apply procedure or function
     * @param {Object} proc - Procedure
     * @param {Array} args - Arguments
     * @param {Object} self - Self
     * @returns {*} Result of procedure
     */
    function* apply(proc, args, self) {
        var result;
        result = yield * applyInner(proc, args, self);
        while(isLambda(result) && result.thunk === true) {
            // trampoline loop - this gets invoked as a result of tail-call optimization
            // the function returned a tail-call thunk
            // unpack it, evaluate its arguments, and apply the tail call
            var next = yield * evaluate(result.body.procedure, result.input, result.environment);
            var evaluatedArgs = [];
            for(var ii = 0; ii < result.body.arguments.length; ii++) {
                evaluatedArgs.push(yield * evaluate(result.body.arguments[ii], result.input, result.environment));
            }

            result = yield * applyInner(next, evaluatedArgs, self);
        }
        return result;
    }

    /**
     * Apply procedure or function
     * @param {Object} proc - Procedure
     * @param {Array} args - Arguments
     * @param {Object} self - Self
     * @returns {*} Result of procedure
     */
    function* applyInner(proc, args, self) {
        var result;
        var validatedArgs = args;
        if(proc) {
            validatedArgs = validateArguments(proc.signature, args, self);
        }
        if (isLambda(proc)) {
            result = yield * applyProcedure(proc, validatedArgs);
        } else if (proc && proc._jsonata_function === true) {
            result = proc.implementation.apply(self, validatedArgs);
            // `proc.implementation` might be a generator function
            // and `result` might be a generator - if so, yield
            if(isGenerator(result)) {
                result = yield *result;
            }
        } else if (typeof proc === 'function') {
            result = proc.apply(self, validatedArgs);
            /* istanbul ignore next */
            if(isGenerator(result)) {
                result = yield *result;
            }
        } else {
            throw {
                code: "T1006",
                stack: (new Error()).stack
            };
        }
        return result;
    }

    /**
     * Evaluate lambda against input data
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {{lambda: boolean, input: *, environment: *, arguments: *, body: *}} Evaluated input data
     */
    function evaluateLambda(expr, input, environment) {
        // make a function (closure)
        var procedure = {
            _jsonata_lambda: true,
            input: input,
            environment: environment,
            arguments: expr.arguments,
            signature: expr.signature,
            body: expr.body
        };
        if(expr.thunk === true) {
            procedure.thunk = true;
        }
        return procedure;
    }

    /**
     * Evaluate partial application
     * @param {Object} expr - JSONata expression
     * @param {Object} input - Input data to evaluate against
     * @param {Object} environment - Environment
     * @returns {*} Evaluated input data
     */
    function* evaluatePartialApplication(expr, input, environment) {
        // partially apply a function
        var result;
        // evaluate the arguments
        var evaluatedArgs = [];
        for(var ii = 0; ii < expr.arguments.length; ii++) {
            var arg = expr.arguments[ii];
            if (arg.type === 'operator' && arg.value === '?') {
                evaluatedArgs.push(arg);
            } else {
                evaluatedArgs.push(yield * evaluate(arg, input, environment));
            }
        }
        // lookup the procedure
        var proc = yield * evaluate(expr.procedure, input, environment);
        if (typeof proc === 'undefined' && expr.procedure.type === 'path' && environment.lookup(expr.procedure.steps[0].value)) {
            // help the user out here if they simply forgot the leading $
            throw {
                code: "T1007",
                stack: (new Error()).stack,
                position: expr.position,
                token: expr.procedure.steps[0].value
            };
        }
        if (isLambda(proc)) {
            result = partialApplyProcedure(proc, evaluatedArgs);
        } else if (proc && proc._jsonata_function === true) {
            result = partialApplyNativeFunction(proc.implementation, evaluatedArgs);
        } else if (typeof proc === 'function') {
            result = partialApplyNativeFunction(proc, evaluatedArgs);
        } else {
            throw {
                code: "T1008",
                stack: (new Error()).stack,
                position: expr.position,
                token: expr.procedure.type === 'path' ? expr.procedure.steps[0].value : expr.procedure.value
            };
        }
        return result;
    }

    /**
     * Validate the arguments against the signature validator (if it exists)
     * @param {Function} signature - validator function
     * @param {Array} args - function arguments
     * @param {*} context - context value
     * @returns {Array} - validated arguments
     */
    function validateArguments(signature, args, context) {
        if(typeof signature === 'undefined') {
            // nothing to validate
            return args;
        }
        var validatedArgs = signature.validate(args, context);
        return validatedArgs;
    }

    /**
     * Apply procedure
     * @param {Object} proc - Procedure
     * @param {Array} args - Arguments
     * @returns {*} Result of procedure
     */
    function* applyProcedure(proc, args) {
        var result;
        var env = createFrame(proc.environment);
        proc.arguments.forEach(function (param, index) {
            env.bind(param.value, args[index]);
        });
        if (typeof proc.body === 'function') {
            // this is a lambda that wraps a native function - generated by partially evaluating a native
            result = yield * applyNativeFunction(proc.body, env);
        } else {
            result = yield * evaluate(proc.body, proc.input, env);
        }
        return result;
    }

    /**
     * Partially apply procedure
     * @param {Object} proc - Procedure
     * @param {Array} args - Arguments
     * @returns {{lambda: boolean, input: *, environment: {bind, lookup}, arguments: Array, body: *}} Result of partially applied procedure
     */
    function partialApplyProcedure(proc, args) {
        // create a closure, bind the supplied parameters and return a function that takes the remaining (?) parameters
        var env = createFrame(proc.environment);
        var unboundArgs = [];
        proc.arguments.forEach(function (param, index) {
            var arg = args[index];
            if (arg && arg.type === 'operator' && arg.value === '?') {
                unboundArgs.push(param);
            } else {
                env.bind(param.value, arg);
            }
        });
        var procedure = {
            _jsonata_lambda: true,
            input: proc.input,
            environment: env,
            arguments: unboundArgs,
            body: proc.body
        };
        return procedure;
    }

    /**
     * Partially apply native function
     * @param {Function} native - Native function
     * @param {Array} args - Arguments
     * @returns {{lambda: boolean, input: *, environment: {bind, lookup}, arguments: Array, body: *}} Result of partially applying native function
     */
    function partialApplyNativeFunction(native, args) {
        // create a lambda function that wraps and invokes the native function
        // get the list of declared arguments from the native function
        // this has to be picked out from the toString() value
        var sigArgs = getNativeFunctionArguments(native);
        sigArgs = sigArgs.map(function (sigArg) {
            return '$' + sigArg.trim();
        });
        var body = 'function(' + sigArgs.join(', ') + '){ _ }';

        var bodyAST = parser(body);
        bodyAST.body = native;

        var partial = partialApplyProcedure(bodyAST, args);
        return partial;
    }

    /**
     * Apply native function
     * @param {Object} proc - Procedure
     * @param {Object} env - Environment
     * @returns {*} Result of applying native function
     */
    function* applyNativeFunction(proc, env) {
        var sigArgs = getNativeFunctionArguments(proc);
        // generate the array of arguments for invoking the function - look them up in the environment
        var args = sigArgs.map(function (sigArg) {
            return env.lookup(sigArg.trim());
        });

        var result = proc.apply(null, args);
        if(isGenerator(result)) {
            result = yield * result;
        }
        return result;
    }

    /**
     * Get native function arguments
     * @param {Function} func - Function
     * @returns {*|Array} Native function arguments
     */
    function getNativeFunctionArguments(func) {
        var signature = func.toString();
        var sigParens = /\(([^)]*)\)/.exec(signature)[1]; // the contents of the parens
        var sigArgs = sigParens.split(',');
        return sigArgs;
    }

    /**
     * Creates a function definition
     * @param {Function} func - function implementation in Javascript
     * @param {string} signature - JSONata function signature definition
     * @returns {{implementation: *, signature: *}} function definition
     */
    function defineFunction(func, signature) {
        var definition = {
            _jsonata_function: true,
            implementation: func
        };
        if(typeof signature !== 'undefined') {
            definition.signature = parseSignature(signature);
        }
        return definition;
    }

    /**
     * Sum function
     * @param {Object} args - Arguments
     * @returns {number} Total value of arguments
     */
    function functionSum(args) {
        // undefined inputs always return undefined
        if(typeof args === 'undefined') {
            return undefined;
        }

        var total = 0;
        args.forEach(function(num){total += num;});
        return total;
    }

    /**
     * Count function
     * @param {Object} args - Arguments
     * @returns {number} Number of elements in the array
     */
    function functionCount(args) {
        // undefined inputs always return undefined
        if(typeof args === 'undefined') {
            return 0;
        }

        return args.length;
    }

    /**
     * Max function
     * @param {Object} args - Arguments
     * @returns {number} Max element in the array
     */
    function functionMax(args) {
        // undefined inputs always return undefined
        if(typeof args === 'undefined' || args.length === 0) {
            return undefined;
        }

        return Math.max.apply(Math, args);
    }

    /**
     * Min function
     * @param {Object} args - Arguments
     * @returns {number} Min element in the array
     */
    function functionMin(args) {
        // undefined inputs always return undefined
        if(typeof args === 'undefined' || args.length === 0) {
            return undefined;
        }

        return Math.min.apply(Math, args);
    }

    /**
     * Average function
     * @param {Object} args - Arguments
     * @returns {number} Average element in the array
     */
    function functionAverage(args) {
        // undefined inputs always return undefined
        if(typeof args === 'undefined' || args.length === 0) {
            return undefined;
        }

        var total = 0;
        args.forEach(function(num){total += num;});
        return total/args.length;
    }

    /**
     * Stingify arguments
     * @param {Object} arg - Arguments
     * @returns {String} String from arguments
     */
    function functionString(arg) {
        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        var str;

        if (typeof arg === 'string') {
            // already a string
            str = arg;
        } else if(isFunction(arg)) {
            // functions (built-in and lambda convert to empty string
            str = '';
        } else if (typeof arg === 'number' && !isFinite(arg)) {
            throw {
                code: "D3001",
                value: arg,
                stack: (new Error()).stack
            };
        } else
            str = JSON.stringify(arg, function (key, val) {
                return (typeof val !== 'undefined' && val !== null && val.toPrecision && isNumeric(val)) ? Number(val.toPrecision(13)) :
                    (val && isFunction(val)) ? '' : val;
            });
        return str;
    }

    /**
     * Create substring based on character number and length
     * @param {String} str - String to evaluate
     * @param {Integer} start - Character number to start substring
     * @param {Integer} [length] - Number of characters in substring
     * @returns {string|*} Substring
     */
    function functionSubstring(str, start, length) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        return str.substr(start, length);
    }

    /**
     * Create substring up until a character
     * @param {String} str - String to evaluate
     * @param {String} chars - Character to define substring boundary
     * @returns {*} Substring
     */
    function functionSubstringBefore(str, chars) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        var pos = str.indexOf(chars);
        if (pos > -1) {
            return str.substr(0, pos);
        } else {
            return str;
        }
    }

    /**
     * Create substring after a character
     * @param {String} str - String to evaluate
     * @param {String} chars - Character to define substring boundary
     * @returns {*} Substring
     */
    function functionSubstringAfter(str, chars) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        var pos = str.indexOf(chars);
        if (pos > -1) {
            return str.substr(pos + chars.length);
        } else {
            return str;
        }
    }

    /**
     * Lowercase a string
     * @param {String} str - String to evaluate
     * @returns {string} Lowercase string
     */
    function functionLowercase(str) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        return str.toLowerCase();
    }

    /**
     * Uppercase a string
     * @param {String} str - String to evaluate
     * @returns {string} Uppercase string
     */
    function functionUppercase(str) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        return str.toUpperCase();
    }

    /**
     * length of a string
     * @param {String} str - string
     * @returns {Number} The number of characters in the string
     */
    function functionLength(str) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        return str.length;
    }

    /**
     * Normalize and trim whitespace within a string
     * @param {string} str - string to be trimmed
     * @returns {string} - trimmed string
     */
    function functionTrim(str) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        // normalize whitespace
        var result = str.replace(/[ \t\n\r]+/gm, ' ');
        if(result.charAt(0) === ' ') {
            // strip leading space
            result = result.substring(1);
        }
        if(result.charAt(result.length - 1) === ' ') {
            // strip trailing space
            result = result.substring(0, result.length - 1);
        }
        return result;
    }

    /**
     * Pad a string to a minimum width by adding characters to the start or end
     * @param {string} str - string to be padded
     * @param {number} width - the minimum width; +ve pads to the right, -ve pads to the left
     * @param {string} [char] - the pad character(s); defaults to ' '
     * @returns {string} - padded string
     */
    function functionPad(str, width, char) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        if(typeof char === 'undefined' || char.length === 0) {
            char = ' ';
        }

        var result;
        var padLength = Math.abs(width) - str.length;
        if(padLength > 0) {
            var padding = (new Array(padLength + 1)).join(char);
            if(char.length > 1) {
                padding = padding.substring(0, padLength);
            }
            if(width > 0) {
                result = str + padding;
            } else {
                result = padding + str;
            }
        } else {
            result = str;
        }
        return result;
    }

    /**
     * Tests if the str contains the token
     * @param {String} str - string to test
     * @param {String} token - substring or regex to find
     * @returns {Boolean} - true if str contains token
     */
    function functionContains(str, token) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        var result;

        if(typeof token === 'string') {
            result = (str.indexOf(token) !== -1);
        } else {
            var matches = token(str);
            result = (typeof matches !== 'undefined');
        }

        return result;
    }

    /**
     * Match a string with a regex returning an array of object containing details of each match
     * @param {String} str - string
     * @param {String} regex - the regex applied to the string
     * @param {Integer} [limit] - max number of matches to return
     * @returns {Array} The array of match objects
     */
    function functionMatch(str, regex, limit) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        // limit, if specified, must be a non-negative number
        if(limit < 0) {
            throw {
                stack: (new Error()).stack,
                value: limit,
                code: 'D3040',
                index: 3
            };
        }

        var result = [];

        if(typeof limit === 'undefined' || limit > 0) {
            var count = 0;
            var matches = regex(str);
            if (typeof matches !== 'undefined') {
                while (typeof matches !== 'undefined' && (typeof limit === 'undefined' || count < limit)) {
                    result.push({
                        match: matches.match,
                        index: matches.start,
                        groups: matches.groups
                    });
                    matches = matches.next();
                    count++;
                }
            }
        }

        return result;
    }

    /**
     * Match a string with a regex returning an array of object containing details of each match
     * @param {String} str - string
     * @param {String} pattern - the substring/regex applied to the string
     * @param {String} replacement - text to replace the matched substrings
     * @param {Integer} [limit] - max number of matches to return
     * @returns {Array} The array of match objects
     */
    function* functionReplace(str, pattern, replacement, limit) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        // pattern cannot be an empty string
        if(pattern === '') {
            throw {
                code: "D3010",
                stack: (new Error()).stack,
                value: pattern,
                index: 2
            };
        }

        // limit, if specified, must be a non-negative number
        if(limit < 0) {
            throw {
                code: "D3011",
                stack: (new Error()).stack,
                value: limit,
                index: 4
            };
        }

        var replacer;
        if(typeof replacement === 'string') {
            replacer = function (regexMatch) {
                var substitute = '';
                // scan forward, copying the replacement text into the substitute string
                // and replace any occurrence of $n with the values matched by the regex
                var position = 0;
                var index = replacement.indexOf('$', position);
                while (index !== -1 && position < replacement.length) {
                    substitute += replacement.substring(position, index);
                    position = index + 1;
                    var dollarVal = replacement.charAt(position);
                    if (dollarVal === '$') {
                        // literal $
                        substitute += '$';
                        position++;
                    } else if (dollarVal === '0') {
                        substitute += regexMatch.match;
                        position++;
                    } else {
                        var maxDigits;
                        if(regexMatch.groups.length === 0) {
                            // no sub-matches; any $ followed by a digit will be replaced by an empty string
                            maxDigits = 1;
                        } else {
                            // max number of digits to parse following the $
                            maxDigits = Math.floor(Math.log(regexMatch.groups.length) * Math.LOG10E) + 1;
                        }
                        index = parseInt(replacement.substring(position, position + maxDigits), 10);
                        if(maxDigits > 1 && index > regexMatch.groups.length) {
                            index = parseInt(replacement.substring(position, position + maxDigits - 1), 10);
                        }
                        if (!isNaN(index)) {
                            if(regexMatch.groups.length > 0 ) {
                                var submatch = regexMatch.groups[index - 1];
                                if (typeof submatch !== 'undefined') {
                                    substitute += submatch;
                                }
                            }
                            position += index.toString().length;
                        } else {
                            // not a capture group, treat the $ as literal
                            substitute += '$';
                        }
                    }
                    index = replacement.indexOf('$', position);
                }
                substitute += replacement.substring(position);
                return substitute;
            };
        } else {
            replacer = replacement;
        }

        var result = '';
        var position = 0;

        if(typeof limit === 'undefined' || limit > 0) {
            var count = 0;
            if(typeof pattern === 'string') {
                var index = str.indexOf(pattern, position);
                while(index !== -1 && (typeof limit === 'undefined' || count < limit)) {
                    result += str.substring(position, index);
                    result += replacement;
                    position = index + pattern.length;
                    count++;
                    index = str.indexOf(pattern, position);
                }
                result += str.substring(position);
            } else {
                var matches = pattern(str);
                if (typeof matches !== 'undefined') {
                    while (typeof matches !== 'undefined' && (typeof limit === 'undefined' || count < limit)) {
                        result += str.substring(position, matches.start);
                        var replacedWith = yield * apply(replacer, [matches], null);
                        // check replacedWith is a string
                        if(typeof replacedWith === 'string') {
                            result += replacedWith;
                        } else {
                            // not a string - throw error
                            throw {
                                code: "D3012",
                                stack: (new Error()).stack,
                                value: replacedWith
                            };
                        }
                        position = matches.start + matches.match.length;
                        count++;
                        matches = matches.next();
                    }
                    result += str.substring(position);
                } else {
                    result = str;
                }
            }
        } else {
            result = str;
        }

        return result;
    }

    /**
     * Base64 encode a string
     * @param {String} str - string
     * @returns {String} Base 64 encoding of the binary data
     */
    function functionBase64encode(str) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }
        // Use btoa in a browser, or Buffer in Node.js

        var btoa = typeof window !== 'undefined' ?
            /* istanbul ignore next */ window.btoa :
            function(str) {
                // Simply doing `new Buffer` at this point causes Browserify to pull
                // in the entire Buffer browser library, which is large and unnecessary.
                // Using `global.Buffer` defeats this.
                return new global.Buffer(str, 'binary').toString('base64');
            };
        return btoa(str);
    }

    /**
     * Base64 decode a string
     * @param {String} str - string
     * @returns {String} Base 64 encoding of the binary data
     */
    function functionBase64decode(str) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }
        // Use btoa in a browser, or Buffer in Node.js
        var atob = typeof window !== 'undefined' ?
            /* istanbul ignore next */ window.atob :
            function(str) {
                // Simply doing `new Buffer` at this point causes Browserify to pull
                // in the entire Buffer browser library, which is large and unnecessary.
                // Using `global.Buffer` defeats this.
                return new global.Buffer(str, 'base64').toString('binary');
            };
        return atob(str);
    }

    /**
     * Split a string into an array of substrings
     * @param {String} str - string
     * @param {String} separator - the token or regex that splits the string
     * @param {Integer} [limit] - max number of substrings
     * @returns {Array} The array of string
     */
    function functionSplit(str, separator, limit) {
        // undefined inputs always return undefined
        if(typeof str === 'undefined') {
            return undefined;
        }

        // limit, if specified, must be a non-negative number
        if(limit < 0) {
            throw {
                code: "D3020",
                stack: (new Error()).stack,
                value: limit,
                index: 3
            };
        }

        var result = [];

        if(typeof limit === 'undefined' || limit > 0) {
            if (typeof separator === 'string') {
                result = str.split(separator, limit);
            } else {
                var count = 0;
                var matches = separator(str);
                if (typeof matches !== 'undefined') {
                    var start = 0;
                    while (typeof matches !== 'undefined' && (typeof limit === 'undefined' || count < limit)) {
                        result.push(str.substring(start, matches.start));
                        start = matches.end;
                        matches = matches.next();
                        count++;
                    }
                    if(typeof limit === 'undefined' || count < limit) {
                        result.push(str.substring(start));
                    }
                } else {
                    result = [str];
                }
            }
        }

        return result;
    }

    /**
     * Join an array of strings
     * @param {Array} strs - array of string
     * @param {String} [separator] - the token that splits the string
     * @returns {String} The concatenated string
     */
    function functionJoin(strs, separator) {
        // undefined inputs always return undefined
        if(typeof strs === 'undefined') {
            return undefined;
        }

        // if separator is not specified, default to empty string
        if(typeof separator === 'undefined') {
            separator = "";
        }

        return strs.join(separator);
    }

    /**
     * Formats a number into a decimal string representation using XPath 3.1 F&O fn:format-number spec
     * @param {number} value - number to format
     * @param {String} picture - picture string definition
     * @param {Object} [options] - override locale defaults
     * @returns {String} The formatted string
     */
    function functionFormatNumber(value, picture, options) {
        var defaults = {
            "decimal-separator": ".",
            "grouping-separator": ",",
            "exponent-separator": "e",
            "infinity": "Infinity",
            "minus-sign": "-",
            "NaN": "NaN",
            "percent": "%",
            "per-mille": "\u2030",
            "zero-digit": "0",
            "digit": "#",
            "pattern-separator": ";"
        };

        // if `options` is specified, then its entries override defaults
        var properties = defaults;
        if(typeof options !== 'undefined') {
            Object.keys(options).forEach(function (key) {
                properties[key] = options[key];
            });
        }

        var decimalDigitFamily = [];
        var zeroCharCode = properties['zero-digit'].charCodeAt(0);
        for(var ii = zeroCharCode; ii < zeroCharCode + 10; ii++) {
            decimalDigitFamily.push(String.fromCharCode(ii));
        }

        var activeChars = decimalDigitFamily.concat([properties['decimal-separator'], properties['exponent-separator'], properties['grouping-separator'], properties.digit, properties['pattern-separator']]);

        var subPictures = picture.split(properties['pattern-separator']);

        if(subPictures.length > 2) {
            throw {
                code: 'D3080',
                stack: (new Error()).stack
            };
        }

        var splitParts = function(subpicture) {
            var prefix = (function() {
                var ch;
                for(var ii = 0; ii < subpicture.length; ii++) {
                    ch = subpicture.charAt(ii);
                    if(activeChars.indexOf(ch) !== -1 && ch !== properties['exponent-separator']) {
                        return subpicture.substring(0, ii);
                    }
                }
            })();
            var suffix = (function() {
                var ch;
                for(var ii = subpicture.length - 1; ii >= 0; ii--) {
                    ch = subpicture.charAt(ii);
                    if(activeChars.indexOf(ch) !== -1 && ch !== properties['exponent-separator']) {
                        return subpicture.substring(ii + 1);
                    }
                }
            })();
            var activePart = subpicture.substring(prefix.length, subpicture.length - suffix.length);
            var mantissaPart, exponentPart, integerPart, fractionalPart;
            var exponentPosition = subpicture.indexOf(properties['exponent-separator'], prefix.length);
            if(exponentPosition === -1 || exponentPosition > subpicture.length - suffix.length) {
                mantissaPart = activePart;
                exponentPart = undefined;
            } else {
                mantissaPart = activePart.substring(0, exponentPosition);
                exponentPart = activePart.substring(exponentPosition + 1);
            }
            var decimalPosition = mantissaPart.indexOf(properties['decimal-separator']);
            if(decimalPosition === -1) {
                integerPart = mantissaPart;
                fractionalPart = suffix;
            } else {
                integerPart = mantissaPart.substring(0, decimalPosition);
                fractionalPart = mantissaPart.substring(decimalPosition + 1);
            }
            return {
                prefix: prefix,
                suffix: suffix,
                activePart: activePart,
                mantissaPart: mantissaPart,
                exponentPart: exponentPart,
                integerPart: integerPart,
                fractionalPart: fractionalPart,
                subpicture: subpicture
            };
        };

        // validate the picture string, F&O 4.7.3
        var validate = function(parts) {
            var error;
            var ii;
            var subpicture = parts.subpicture;
            var decimalPos = subpicture.indexOf(properties['decimal-separator']);
            if(decimalPos !== subpicture.lastIndexOf(properties['decimal-separator'])) {
                error = 'D3081';
            }
            if(subpicture.indexOf(properties.percent) !== subpicture.lastIndexOf(properties.percent)) {
                error = 'D3082';
            }
            if(subpicture.indexOf(properties['per-mille']) !== subpicture.lastIndexOf(properties['per-mille'])) {
                error = 'D3083';
            }
            if(subpicture.indexOf(properties.percent) !== -1 && subpicture.indexOf(properties['per-mille']) !== -1) {
                error = 'D3084';
            }
            var valid = false;
            for(ii = 0; ii < parts.mantissaPart.length; ii++) {
                var ch = parts.mantissaPart.charAt(ii);
                if(decimalDigitFamily.indexOf(ch) !== -1 || ch === properties.digit) {
                    valid = true;
                    break;
                }
            }
            if(!valid) {
                error = 'D3085';
            }
            var charTypes = parts.activePart.split('').map(function(char) {
                return activeChars.indexOf(char) === -1 ? 'p' : 'a';
            }).join('');
            if(charTypes.indexOf('p') !== -1) {
                error = 'D3086';
            }
            if(decimalPos !== -1) {
                if(subpicture.charAt(decimalPos - 1) === properties['grouping-separator'] || subpicture.charAt(decimalPos + 1) === properties['grouping-separator']) {
                    error = 'D3087';
                }
            } else if(parts.integerPart.charAt(parts.integerPart.length - 1) === properties['grouping-separator']) {
                error = 'D3088';
            }
            if(subpicture.indexOf(properties['grouping-separator'] + properties['grouping-separator']) !== -1) {
                error = 'D3089';
            }
            var optionalDigitPos = parts.integerPart.indexOf(properties.digit);
            if(optionalDigitPos !== -1 && parts.integerPart.substring(0, optionalDigitPos).split('').filter(function(char) {
                return decimalDigitFamily.indexOf(char) > -1;
            }).length > 0) {
                error = 'D3090';
            }
            optionalDigitPos = parts.fractionalPart.lastIndexOf(properties.digit);
            if(optionalDigitPos !== -1 && parts.fractionalPart.substring(optionalDigitPos).split('').filter(function(char) {
                return decimalDigitFamily.indexOf(char) > -1;
            }).length > 0) {
                error = 'D3091';
            }
            var exponentExists = (typeof parts.exponentPart === 'string');
            if(exponentExists && parts.exponentPart.length > 0 && (subpicture.indexOf(properties.percent) !== -1 || subpicture.indexOf(properties['per-mille']) !== -1)) {
                error = 'D3092';
            }
            if(exponentExists && (parts.exponentPart.length === 0 || parts.exponentPart.split('').filter(function(char) {
                return decimalDigitFamily.indexOf(char) === -1;
            }).length > 0)) {
                error = 'D3093';
            }
            if(error) {
                throw {
                    code: error,
                    stack: (new Error()).stack
                };
            }
        };

        // analyse the picture string, F&O 4.7.4
        var analyse = function(parts) {
            var getGroupingPositions = function(part, toLeft) {
                var positions = [];
                var groupingPosition = part.indexOf(properties['grouping-separator']);
                while(groupingPosition !== -1) {
                    var charsToTheRight = (toLeft ? part.substring(0, groupingPosition) : part.substring(groupingPosition)).split('').filter(function(char) {
                        return decimalDigitFamily.indexOf(char) !== -1 || char === properties.digit;
                    }).length;
                    positions.push(charsToTheRight);
                    groupingPosition = parts.integerPart.indexOf(properties['grouping-separator'], groupingPosition + 1);
                }
                return positions;
            };
            var integerPartGroupingPositions = getGroupingPositions(parts.integerPart);
            var regular = function(indexes) {
                // are the grouping positions regular? i.e. same interval between each of them
                if(indexes.length === 0) {
                    return 0;
                }
                var gcd = function(a, b) {
                    return b === 0 ? a : gcd(b, a % b);
                };
                // find the greatest common divisor of all the positions
                var factor = indexes.reduce(gcd);
                // is every position separated by this divisor? If so, it's regular
                for(var index = 1; index <= indexes.length; index++) {
                    if(indexes.indexOf(index * factor) === -1) {
                        return 0;
                    }
                }
                return factor;
            };

            var regularGrouping = regular(integerPartGroupingPositions);
            var fractionalPartGroupingPositions = getGroupingPositions(parts.fractionalPart, true);

            var minimumIntegerPartSize = parts.integerPart.split('').filter(function(char) { return decimalDigitFamily.indexOf(char) !== -1; }).length;
            var scalingFactor = minimumIntegerPartSize;

            var fractionalPartArray = parts.fractionalPart.split('');
            var minimumFactionalPartSize = fractionalPartArray.filter(function(char) { return decimalDigitFamily.indexOf(char) !== -1; }).length;
            var maximumFactionalPartSize = fractionalPartArray.filter(function(char) { return decimalDigitFamily.indexOf(char) !== -1 || char === properties.digit; }).length;
            var exponentPresent = typeof parts.exponentPart === 'string';
            if(minimumIntegerPartSize === 0 && maximumFactionalPartSize === 0) {
                if(exponentPresent) {
                    minimumFactionalPartSize = 1;
                    maximumFactionalPartSize = 1;
                } else {
                    minimumIntegerPartSize = 1;
                }
            }
            if(exponentPresent && minimumIntegerPartSize === 0 && parts.integerPart.indexOf(properties.digit) !== -1) {
                minimumIntegerPartSize = 1;
            }
            if(minimumIntegerPartSize === 0 && minimumFactionalPartSize === 0) {
                minimumFactionalPartSize = 1;
            }
            var minimumExponentSize = 0;
            if(exponentPresent) {
                minimumExponentSize = parts.exponentPart.split('').filter(function(char) { return decimalDigitFamily.indexOf(char) !== -1; }).length;
            }

            return {
                integerPartGroupingPositions: integerPartGroupingPositions,
                regularGrouping: regularGrouping,
                minimumIntegerPartSize: minimumIntegerPartSize,
                scalingFactor: scalingFactor,
                prefix: parts.prefix,
                fractionalPartGroupingPositions: fractionalPartGroupingPositions,
                minimumFactionalPartSize: minimumFactionalPartSize,
                maximumFactionalPartSize: maximumFactionalPartSize,
                minimumExponentSize: minimumExponentSize,
                suffix: parts.suffix,
                picture: parts.subpicture
            };
        };

        var parts = subPictures.map(splitParts);
        parts.forEach(validate);

        var variables = parts.map(analyse);

        if(variables.length === 1) {
            variables.push(JSON.parse(JSON.stringify(variables[0])));
            variables[1].prefix = properties['minus-sign'] + variables[1].prefix;
        }

        // TODO cache the result of the analysis

        // format the number
        // bullet 1: TODO: NaN - not sure we'd ever get this in JSON
        var pic;
        // bullet 2:
        if(value >= 0) {
            pic = variables[0];
        } else {
            pic = variables[1];
        }
        var adjustedNumber;
        // bullet 3:
        if(pic.picture.indexOf(properties.percent) !== -1) {
            adjustedNumber = value * 100;
        } else if(pic.picture.indexOf(properties['per-mille']) !== -1) {
            adjustedNumber = value * 1000;
        } else {
            adjustedNumber = value;
        }
        // bullet 4:
        // TODO: infinity - not sure we'd ever get this in JSON
        // bullet 5:
        var mantissa, exponent;
        if(pic.minimumExponentSize === 0) {
            mantissa = adjustedNumber;
        } else {
            // mantissa * 10^exponent = adjustedNumber
            var maxMantissa = Math.pow(10, pic.scalingFactor);
            var minMantissa = Math.pow(10, pic.scalingFactor - 1);
            mantissa = adjustedNumber;
            exponent = 0;
            while(mantissa < minMantissa) {
                mantissa *= 10;
                exponent -= 1;
            }
            while(mantissa > maxMantissa) {
                mantissa /= 10;
                exponent += 1;
            }
        }
        // bullet 6:
        var roundedNumber = functionRound(mantissa, pic.maximumFactionalPartSize);
        // bullet 7:
        var makeString = function(value, dp) {
            var str = Math.abs(value).toFixed(dp);
            if (properties['zero-digit'] !== '0') {
                str = str.split('').map(function (digit) {
                    if(digit >= '0' && digit <='9') {
                        return decimalDigitFamily[digit.charCodeAt(0) - 48];
                    } else {
                        return digit;
                    }
                }).join('');
            }
            return str;
        };
        var stringValue = makeString(roundedNumber, pic.maximumFactionalPartSize);
        var decimalPos = stringValue.indexOf('.');
        if(decimalPos === -1) {
            stringValue = stringValue + properties['decimal-separator'];
        } else {
            stringValue = stringValue.replace('.', properties['decimal-separator']);
        }
        while(stringValue.charAt(0) === properties['zero-digit']) {
            stringValue = stringValue.substring(1);
        }
        while(stringValue.charAt(stringValue.length - 1) === properties['zero-digit']) {
            stringValue = stringValue.substring(0, stringValue.length - 1);
        }
        // bullets 8 & 9:
        decimalPos = stringValue.indexOf(properties['decimal-separator']);
        var padLeft = pic.minimumIntegerPartSize - decimalPos;
        var padRight = pic.minimumFactionalPartSize - (stringValue.length - decimalPos - 1);
        stringValue = (padLeft > 0 ? new Array(padLeft + 1).join('0') : '') + stringValue;
        stringValue = stringValue + (padRight > 0 ? new Array(padRight + 1).join('0') : '');
        decimalPos = stringValue.indexOf(properties['decimal-separator']);
        // bullet 10:
        if(pic.regularGrouping > 0) {
            var groupCount = Math.floor((decimalPos - 1) / pic.regularGrouping);
            for(var group = 1; group <= groupCount; group++) {
                stringValue = [stringValue.slice(0, decimalPos - group * pic.regularGrouping), properties['grouping-separator'], stringValue.slice(decimalPos - group * pic.regularGrouping)].join('');
            }
        } else {
            pic.integerPartGroupingPositions.forEach(function (pos) {
                stringValue = [stringValue.slice(0, decimalPos - pos), properties['grouping-separator'], stringValue.slice(decimalPos - pos)].join('');
                decimalPos++;
            });
        }
        // bullet 11:
        decimalPos = stringValue.indexOf(properties['decimal-separator']);
        pic.fractionalPartGroupingPositions.forEach(function(pos) {
            stringValue = [stringValue.slice(0, pos + decimalPos + 1), properties['grouping-separator'], stringValue.slice(pos + decimalPos + 1)].join('');
        });
        // bullet 12:
        decimalPos = stringValue.indexOf(properties['decimal-separator']);
        if(pic.picture.indexOf(properties['decimal-separator']) === -1 || decimalPos === stringValue.length - 1) {
            stringValue = stringValue.substring(0, stringValue.length - 1);
        }
        // bullet 13:
        if(typeof exponent !== 'undefined') {
            var stringExponent = makeString(exponent, 0);
            padLeft = pic.minimumExponentSize - stringExponent.length;
            if(padLeft > 0) {
                stringExponent = new Array(padLeft + 1).join('0') + stringExponent;
            }
            stringValue = stringValue + properties['exponent-separator'] + (exponent < 0 ? properties['minus-sign'] : '') + stringExponent;
        }
        // bullet 14:
        stringValue = pic.prefix + stringValue + pic.suffix;
        return stringValue;
    }

    /**
     * Converts a number to a string using a specified number base
     * @param {string} value - the number to convert
     * @param {number} [radix] - the number base; must be between 2 and 36. Defaults to 10
     * @returns {string} - the converted string
     */
    function functionFormatBase(value, radix) {
        // undefined inputs always return undefined
        if(typeof value === 'undefined') {
            return undefined;
        }

        value = functionRound(value);

        if(typeof radix === 'undefined') {
            radix = 10;
        } else {
            radix = functionRound(radix);
        }

        if(radix < 2 || radix > 36) {
            throw {
                code: 'D3100',
                stack: (new Error()).stack,
                value: radix
            };

        }

        var result = value.toString(radix);

        return result;
    }

    /**
     * Cast argument to number
     * @param {Object} arg - Argument
     * @returns {Number} numeric value of argument
     */
    function functionNumber(arg) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        if (typeof arg === 'number') {
            // already a number
            result = arg;
        } else if(typeof arg === 'string' && /^-?(0|([1-9][0-9]*))(\.[0-9]+)?([Ee][-+]?[0-9]+)?$/.test(arg) && !isNaN(parseFloat(arg)) && isFinite(arg)) {
            result = parseFloat(arg);
        } else {
            throw {
                code: "D3030",
                value: arg,
                stack: (new Error()).stack,
                index: 1
            };
        }
        return result;
    }

    /**
     * Absolute value of a number
     * @param {Number} arg - Argument
     * @returns {Number} absolute value of argument
     */
    function functionAbs(arg) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        result = Math.abs(arg);
        return result;
    }

    /**
     * Rounds a number down to integer
     * @param {Number} arg - Argument
     * @returns {Number} rounded integer
     */
    function functionFloor(arg) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        result = Math.floor(arg);
        return result;
    }

    /**
     * Rounds a number up to integer
     * @param {Number} arg - Argument
     * @returns {Number} rounded integer
     */
    function functionCeil(arg) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        result = Math.ceil(arg);
        return result;
    }

    /**
     * Round to half even
     * @param {Number} arg - Argument
     * @param {Number} precision - number of decimal places
     * @returns {Number} rounded integer
     */
    function functionRound(arg, precision) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        if(precision) {
            // shift the decimal place - this needs to be done in a string since multiplying
            // by a power of ten can introduce floating point precision errors which mess up
            // this rounding algorithm - See 'Decimal rounding' in
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
            // Shift
            var value = arg.toString().split('e');
            arg = +(value[0] + 'e' + (value[1] ? (+value[1] + precision) : precision));

        }

        // round up to nearest int
        result = Math.round(arg);
        var diff = result - arg;
        if(Math.abs(diff) === 0.5 && Math.abs(result % 2) === 1) {
            // rounded the wrong way - adjust to nearest even number
            result = result - 1;
        }
        if(precision) {
            // Shift back
            value = result.toString().split('e');
            /* istanbul ignore next */
            result = +(value[0] + 'e' + (value[1] ? (+value[1] - precision) : -precision));
        }
        if(Object.is(result, -0)) { // ESLint rule 'no-compare-neg-zero' suggests this way
            // JSON doesn't do -0
            result = 0;
        }
        return result;
    }

    /**
     * Square root of number
     * @param {Number} arg - Argument
     * @returns {Number} square root
     */
    function functionSqrt(arg) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        if(arg < 0) {
            throw {
                stack: (new Error()).stack,
                code: "D3060",
                index: 1,
                value: arg
            };
        }

        result = Math.sqrt(arg);

        return result;
    }

    /**
     * Raises number to the power of the second number
     * @param {Number} arg - the base
     * @param {Number} exp - the exponent
     * @returns {Number} rounded integer
     */
    function functionPower(arg, exp) {
        var result;

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        result = Math.pow(arg, exp);

        if(!isFinite(result)) {
            throw {
                stack: (new Error()).stack,
                code: "D3061",
                index: 1,
                value: arg,
                exp: exp
            };
        }

        return result;
    }

    /**
     * Returns a random number 0 <= n < 1
     * @returns {number} random number
     */
    function functionRandom() {
        return Math.random();
    }

    /**
     * Evaluate an input and return a boolean
     * @param {*} arg - Arguments
     * @returns {boolean} Boolean
     */
    function functionBoolean(arg) {
        // cast arg to its effective boolean value
        // boolean: unchanged
        // string: zero-length -> false; otherwise -> true
        // number: 0 -> false; otherwise -> true
        // null -> false
        // array: empty -> false; length > 1 -> true
        // object: empty -> false; non-empty -> true
        // function -> false

        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        var result = false;
        if (Array.isArray(arg)) {
            if (arg.length === 1) {
                result = functionBoolean(arg[0]);
            } else if (arg.length > 1) {
                var trues = arg.filter(function(val) {return functionBoolean(val);});
                result = trues.length > 0;
            }
        } else if (typeof arg === 'string') {
            if (arg.length > 0) {
                result = true;
            }
        } else if (isNumeric(arg)) {
            if (arg !== 0) {
                result = true;
            }
        } else if (arg !== null && typeof arg === 'object') {
            if (Object.keys(arg).length > 0) {
                // make sure it's not a lambda function
                if (!(isLambda(arg) || arg._jsonata_function)) {
                    result = true;
                }
            }
        } else if (typeof arg === 'boolean' && arg === true) {
            result = true;
        }
        return result;
    }

    /**
     * returns the Boolean NOT of the arg
     * @param {*} arg - argument
     * @returns {boolean} - NOT arg
     */
    function functionNot(arg) {
        return !functionBoolean(arg);
    }

    /**
     * Create a map from an array of arguments
     * @param {Array} [arr] - array to map over
     * @param {Function} func - function to apply
     * @returns {Array} Map array
     */
    function* functionMap(arr, func) {
        // undefined inputs always return undefined
        if(typeof arr === 'undefined') {
            return undefined;
        }

        var result = [];
        // do the map - iterate over the arrays, and invoke func
        for (var i = 0; i < arr.length; i++) {
            var func_args = [arr[i]]; // the first arg (value) is required
            // the other two are optional - only supply it if the function can take it
            var length = typeof func === 'function' ? func.length :
                func._jsonata_function === true ? func.implementation.length : func.arguments.length;
            if(length >= 2) {
                func_args.push(i);
            }
            if(length >= 3) {
                func_args.push(arr);
            }
            // invoke func
            var res = yield * apply(func, func_args, null);
            if(typeof res !== 'undefined') {
                result.push(res);
            }
        }

        return result;
    }

    // This generator function does not have a yield(), presumably to make it
    // consistent with other similar functions.
    /**
     * Create a map from an array of arguments
     * @param {Array} [arr] - array to filter
     * @param {Function} func - predicate function
     * @returns {Array} Map array
     */
    function* functionFilter(arr, func) { // eslint-disable-line require-yield
        // undefined inputs always return undefined
        if(typeof arr === 'undefined') {
            return undefined;
        }

        var result = [];

        var predicate = function (value, index, array) {
            var it = apply(func, [value, index, array], null);
            // returns a generator - so iterate over it
            var res = it.next();
            while (!res.done) {
                res = it.next(res.value);
            }
            return res.value;
        };

        for(var i = 0; i < arr.length; i++) {
            var entry = arr[i];
            if(functionBoolean(predicate(entry, i, arr))) {
                result.push(entry);
            }
        }

        return result;
    }

    /**
     * Convolves (zips) each value from a set of arrays
     * @param {Array} [args] - arrays to zip
     * @returns {Array} Zipped array
     */
    function functionZip() {
        // this can take a variable number of arguments
        var result = [];
        var args = Array.prototype.slice.call(arguments);
        // length of the shortest array
        var length = Math.min.apply(Math, args.map(function(arg) {
            if(Array.isArray(arg)) {
                return arg.length;
            }
            return 0;
        }));
        for(var i = 0; i < length; i++) {
            var tuple = args.map((arg) => {return arg[i];});
            result.push(tuple);
        }
        return result;
    }

    /**
     * Fold left function
     * @param {Array} sequence - Sequence
     * @param {Function} func - Function
     * @param {Object} init - Initial value
     * @returns {*} Result
     */
    function* functionFoldLeft(sequence, func, init) {
        // undefined inputs always return undefined
        if(typeof sequence === 'undefined') {
            return undefined;
        }

        var result;

        if (!(func.length === 2 || (func._jsonata_function === true && func.implementation.length === 2) || func.arguments.length === 2)) {
            throw {
                stack: (new Error()).stack,
                code: "D3050",
                index: 1
            };
        }

        var index;
        if (typeof init === 'undefined' && sequence.length > 0) {
            result = sequence[0];
            index = 1;
        } else {
            result = init;
            index = 0;
        }

        while (index < sequence.length) {
            result = yield * apply(func, [result, sequence[index]], null);
            index++;
        }

        return result;
    }

    /**
     * Return keys for an object
     * @param {Object} arg - Object
     * @returns {Array} Array of keys
     */
    function functionKeys(arg) {
        var result = [];

        if(Array.isArray(arg)) {
            // merge the keys of all of the items in the array
            var merge = {};
            arg.forEach(function(item) {
                var keys = functionKeys(item);
                if(Array.isArray(keys)) {
                    keys.forEach(function(key) {
                        merge[key] = true;
                    });
                }
            });
            result = functionKeys(merge);
        } else if(arg !== null && typeof arg === 'object' && !(isLambda(arg))) {
            result = Object.keys(arg);
            if(result.length === 0) {
                result = undefined;
            }
        } else {
            result = undefined;
        }
        return result;
    }

    /**
     * Return value from an object for a given key
     * @param {Object} object - Object
     * @param {String} key - Key in object
     * @returns {*} Value of key in object
     */
    function functionLookup(object, key) {
        var result = evaluateName({value: key}, object);
        return result;
    }

    /**
     * Append second argument to first
     * @param {Array|Object} arg1 - First argument
     * @param {Array|Object} arg2 - Second argument
     * @returns {*} Appended arguments
     */
    function functionAppend(arg1, arg2) {
        // disregard undefined args
        if (typeof arg1 === 'undefined') {
            return arg2;
        }
        if (typeof arg2 === 'undefined') {
            return arg1;
        }
        // if either argument is not an array, make it so
        if (!Array.isArray(arg1)) {
            arg1 = [arg1];
        }
        if (!Array.isArray(arg2)) {
            arg2 = [arg2];
        }
        Array.prototype.push.apply(arg1, arg2);
        return arg1;
    }

    /**
     * Determines if the argument is undefined
     * @param {*} arg - argument
     * @returns {boolean} False if argument undefined, otherwise true
     */
    function functionExists(arg){
        if (typeof arg === 'undefined') {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Splits an object into an array of object with one property each
     * @param {*} arg - the object to split
     * @returns {*} - the array
     */
    function functionSpread(arg) {
        var result = [];

        if(Array.isArray(arg)) {
            // spread all of the items in the array
            arg.forEach(function(item) {
                result = functionAppend(result, functionSpread(item));
            });
        } else if(arg !== null && typeof arg === 'object' && !isLambda(arg)) {
            for(var key in arg) {
                var obj = {};
                obj[key] = arg[key];
                result.push(obj);
            }
        } else {
            result = arg;
        }
        return result;
    }

    /**
     * Merges an array of objects into a single object.  Duplicate properties are
     * overridden by entries later in the array
     * @param {*} arg - the objects to merge
     * @returns {*} - the object
     */
    function functionMerge(arg) {
        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        var result = {};

        arg.forEach(function(obj) {
            for(var prop in obj) {
                result[prop] = obj[prop];
            }
        });
        return result;
    }

    /**
     * Reverses the order of items in an array
     * @param {Array} arr - the array to reverse
     * @returns {Array} - the reversed array
     */
    function functionReverse(arr) {
        // undefined inputs always return undefined
        if(typeof arr === 'undefined') {
            return undefined;
        }

        if(arr.length <= 1) {
            return arr;
        }

        var length = arr.length;
        var result = new Array(length);
        for(var i = 0; i < length; i++) {
            result[length - i - 1] = arr[i];
        }

        return result;
    }

    /**
     *
     * @param {*} obj - the input object to iterate over
     * @param {*} func - the function to apply to each key/value pair
     * @returns {Array} - the resultant array
     */
    function* functionEach(obj, func) {
        var result = [];

        for(var key in obj) {
            var func_args = [obj[key], key];
            // invoke func
            result.push(yield * apply(func, func_args, null));
        }

        return result;
    }

    /**
     * Implements the merge sort (stable) with optional comparator function
     *
     * @param {Array} arr - the array to sort
     * @param {*} comparator - comparator function
     * @returns {Array} - sorted array
     */
    function functionSort(arr, comparator) {
        // undefined inputs always return undefined
        if(typeof arr === 'undefined') {
            return undefined;
        }

        if(arr.length <= 1) {
            return arr;
        }

        var comp;
        if(typeof comparator === 'undefined') {
            // inject a default comparator - only works for numeric or string arrays
            if (!isArrayOfNumbers(arr) && !isArrayOfStrings(arr)) {
                throw {
                    stack: (new Error()).stack,
                    code: "D3070",
                    index: 1
                };
            }

            comp = function (a, b) {
                return a > b;
            };
        } else if(typeof comparator === 'function') {
            // for internal usage of functionSort (i.e. order-by syntax)
            comp = comparator;
        } else {
            comp = function (a, b) {
                var it = apply(comparator, [a, b], null);
                // returns a generator - so iterate over it
                var comp = it.next();
                while (!comp.done) {
                    comp = it.next(comp.value);
                }
                return comp.value;
            };
        }

        var merge = function(l, r) {
            var merge_iter = function(result, left, right) {
                if (left.length === 0) {
                    Array.prototype.push.apply(result, right);
                } else if (right.length === 0) {
                    Array.prototype.push.apply(result, left);
                } else if (comp(left[0], right[0])) { // invoke the comparator function
                    // if it returns true - swap left and right
                    result.push(right[0]);
                    merge_iter(result, left, right.slice(1));
                } else {
                    // otherwise keep the same order
                    result.push(left[0]);
                    merge_iter(result, left.slice(1), right);
                }
            };
            var merged = [];
            merge_iter(merged, l, r);
            return merged;
        };

        var sort = function(array) {
            if(array.length <= 1) {
                return array;
            } else {
                var middle = Math.floor(array.length / 2);
                var left = array.slice(0, middle);
                var right = array.slice(middle);
                left = sort(left);
                right = sort(right);
                return merge(left, right);
            }
        };

        var result = sort(arr);

        return result;
    }

    /**
     * Randomly shuffles the contents of an array
     * @param {Array} arr - the input array
     * @returns {Array} the shuffled array
     */
    function functionShuffle(arr) {
        // undefined inputs always return undefined
        if(typeof arr === 'undefined') {
            return undefined;
        }

        if(arr.length <= 1) {
            return arr;
        }

        // shuffle using the 'inside-out' variant of the Fisher-Yates algorithm
        var result = new Array(arr.length);
        for(var i = 0; i < arr.length; i++) {
            var j = Math.floor(Math.random() * (i + 1)); // random integer such that 0 ≤ j ≤ i
            if(i !== j) {
                result[i] = result[j];
            }
            result[j] = arr[i];
        }

        return result;
    }

    /**
     * Applies a predicate function to each key/value pair in an object, and returns an object containing
     * only the key/value pairs that passed the predicate
     *
     * @param {object} arg - the object to be sifted
     * @param {object} func - the predicate function (lambda or native)
     * @returns {object} - sifted object
     */
    function functionSift(arg, func) {
        var result = {};

        var predicate = function (value, key, object) {
            var it = apply(func, [value, key, object], null);
            // returns a generator - so iterate over it
            var res = it.next();
            while (!res.done) {
                res = it.next(res.value);
            }
            return res.value;
        };

        for(var item in arg) {
            var entry = arg[item];
            if(functionBoolean(predicate(entry, item, arg))) {
                result[item] = entry;
            }
        }

        // empty objects should be changed to undefined
        if(Object.keys(result).length === 0) {
            result = undefined;
        }

        return result;
    }

    // Regular expression to match an ISO 8601 formatted timestamp
    var iso8601regex = new RegExp('^\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+([+-][0-2]\\d:[0-5]\\d|Z)$');

    /**
     * Converts an ISO 8601 timestamp to milliseconds since the epoch
     *
     * @param {string} timestamp - the ISO 8601 timestamp to be converted
     * @returns {Number} - milliseconds since the epoch
     */
    function functionToMillis(timestamp) {
        // undefined inputs always return undefined
        if(typeof timestamp === 'undefined') {
            return undefined;
        }

        if(!iso8601regex.test(timestamp)) {
            throw {
                stack: (new Error()).stack,
                code: "D3110",
                value: timestamp
            };
        }

        return Date.parse(timestamp);
    }

    /**
     * Converts milliseconds since the epoch to an ISO 8601 timestamp
     * @param {Number} millis - milliseconds since the epoch to be converted
     * @returns {String} - an ISO 8601 formatted timestamp
     */
    function functionFromMillis(millis) {
        // undefined inputs always return undefined
        if(typeof millis === 'undefined') {
            return undefined;
        }

        return new Date(millis).toISOString();
    }

    /**
     * Clones an object
     * @param {Object} arg - object to clone (deep copy)
     * @returns {*} - the cloned object
     */
    function functionClone(arg) {
        // undefined inputs always return undefined
        if(typeof arg === 'undefined') {
            return undefined;
        }

        return JSON.parse(functionString(arg));
    }

    /**
     * Create frame
     * @param {Object} enclosingEnvironment - Enclosing environment
     * @returns {{bind: bind, lookup: lookup}} Created frame
     */
    function createFrame(enclosingEnvironment) {
        var bindings = {};
        return {
            bind: function (name, value) {
                bindings[name] = value;
            },
            lookup: function (name) {
                var value;
                if(bindings.hasOwnProperty(name)) {
                    value = bindings[name];
                } else if (enclosingEnvironment) {
                    value = enclosingEnvironment.lookup(name);
                }
                return value;
            }
        };
    }

    // Function registration
    staticFrame.bind('sum', defineFunction(functionSum, '<a<n>:n>'));
    staticFrame.bind('count', defineFunction(functionCount, '<a:n>'));
    staticFrame.bind('max', defineFunction(functionMax, '<a<n>:n>'));
    staticFrame.bind('min', defineFunction(functionMin, '<a<n>:n>'));
    staticFrame.bind('average', defineFunction(functionAverage, '<a<n>:n>'));
    staticFrame.bind('string', defineFunction(functionString, '<x-:s>'));
    staticFrame.bind('substring', defineFunction(functionSubstring, '<s-nn?:s>'));
    staticFrame.bind('substringBefore', defineFunction(functionSubstringBefore, '<s-s:s>'));
    staticFrame.bind('substringAfter', defineFunction(functionSubstringAfter, '<s-s:s>'));
    staticFrame.bind('lowercase', defineFunction(functionLowercase, '<s-:s>'));
    staticFrame.bind('uppercase', defineFunction(functionUppercase, '<s-:s>'));
    staticFrame.bind('length', defineFunction(functionLength, '<s-:n>'));
    staticFrame.bind('trim', defineFunction(functionTrim, '<s-:s>'));
    staticFrame.bind('pad', defineFunction(functionPad, '<s-ns?:s>'));
    staticFrame.bind('match', defineFunction(functionMatch, '<s-f<s:o>n?:a<o>>'));
    staticFrame.bind('contains', defineFunction(functionContains, '<s-(sf):b>')); // TODO <s-(sf<s:o>):b>
    staticFrame.bind('replace', defineFunction(functionReplace, '<s-(sf)(sf)n?:s>')); // TODO <s-(sf<s:o>)(sf<o:s>)n?:s>
    staticFrame.bind('split', defineFunction(functionSplit, '<s-(sf)n?:a<s>>')); // TODO <s-(sf<s:o>)n?:a<s>>
    staticFrame.bind('join', defineFunction(functionJoin, '<a<s>s?:s>'));
    staticFrame.bind('formatNumber', defineFunction(functionFormatNumber, '<n-so?:s>'));
    staticFrame.bind('formatBase', defineFunction(functionFormatBase, '<n-n?:s>'));
    staticFrame.bind('number', defineFunction(functionNumber, '<(ns)-:n>'));
    staticFrame.bind('floor', defineFunction(functionFloor, '<n-:n>'));
    staticFrame.bind('ceil', defineFunction(functionCeil, '<n-:n>'));
    staticFrame.bind('round', defineFunction(functionRound, '<n-n?:n>'));
    staticFrame.bind('abs', defineFunction(functionAbs, '<n-:n>'));
    staticFrame.bind('sqrt', defineFunction(functionSqrt, '<n-:n>'));
    staticFrame.bind('power', defineFunction(functionPower, '<n-n:n>'));
    staticFrame.bind('random', defineFunction(functionRandom, '<:n>'));
    staticFrame.bind('boolean', defineFunction(functionBoolean, '<x-:b>'));
    staticFrame.bind('not', defineFunction(functionNot, '<x-:b>'));
    staticFrame.bind('map', defineFunction(functionMap, '<af>'));
    staticFrame.bind('zip', defineFunction(functionZip, '<a+>'));
    staticFrame.bind('filter', defineFunction(functionFilter, '<af>'));
    staticFrame.bind('reduce', defineFunction(functionFoldLeft, '<afj?:j>')); // TODO <f<jj:j>a<j>j?:j>
    staticFrame.bind('sift', defineFunction(functionSift, '<o-f?:o>'));
    staticFrame.bind('keys', defineFunction(functionKeys, '<x-:a<s>>'));
    staticFrame.bind('lookup', defineFunction(functionLookup, '<x-s:x>'));
    staticFrame.bind('append', defineFunction(functionAppend, '<xx:a>'));
    staticFrame.bind('exists', defineFunction(functionExists, '<x:b>'));
    staticFrame.bind('spread', defineFunction(functionSpread, '<x-:a<o>>'));
    staticFrame.bind('merge', defineFunction(functionMerge, '<a<o>:o>'));
    staticFrame.bind('reverse', defineFunction(functionReverse, '<a:a>'));
    staticFrame.bind('each', defineFunction(functionEach, '<o-f:a>'));
    staticFrame.bind('sort', defineFunction(functionSort, '<af?:a>'));
    staticFrame.bind('shuffle', defineFunction(functionShuffle, '<a:a>'));
    staticFrame.bind('base64encode', defineFunction(functionBase64encode, '<s-:s>'));
    staticFrame.bind('base64decode', defineFunction(functionBase64decode, '<s-:s>'));
    staticFrame.bind('toMillis', defineFunction(functionToMillis, '<s-:n>'));
    staticFrame.bind('fromMillis', defineFunction(functionFromMillis, '<n-:s>'));
    staticFrame.bind('clone', defineFunction(functionClone, '<(oa)-:o>'));

    /**
     * Error codes
     *
     */
    var errorCodes = {
        "S0101": "String literal must be terminated by a matching quote",
        "S0102": "Number out of range: {{token}}",
        "S0103": "Unsupported escape sequence: \\{{token}}",
        "S0104": "The escape sequence \\u must be followed by 4 hex digits",
        "S0105": "Quoted property name must be terminated with a backquote (`)",
        "S0201": "Syntax error: {{token}}",
        "S0202": "Expected {{value}}, got {{token}}",
        "S0203": "Expected {{value}} before end of expression",
        "S0204": "Unknown operator: {{token}}",
        "S0205": "Unexpected token: {{token}}",
        "S0206": "Unknown expression type: {{token}}",
        "S0207": "Unexpected end of expression",
        "S0208": "Parameter {{value}} of function definition must be a variable name (start with $)",
        "S0209": "A predicate cannot follow a grouping expression in a step",
        "S0210": "Each step can only have one grouping expression",
        "S0211": "The symbol {{token}} cannot be used as a unary operator",
        "S0301": "Empty regular expressions are not allowed",
        "S0302": "No terminating / in regular expression",
        "S0402": "Choice groups containing parameterized types are not supported",
        "S0401": "Type parameters can only be applied to functions and arrays",
        "S0500": "Attempted to evaluate an expression containing syntax error(s)",
        "T0410": "Argument {{index}} of function {{token}} does not match function signature",
        "T0411": "Context value is not a compatible type with argument {{index}} of function {{token}}",
        "T0412": "Argument {{index}} of function {{token}} must be an array of {{type}}",
        "D1001": "Number out of range: {{value}}",
        "D1002": "Cannot negate a non-numeric value: {{value}}",
        "T1003": "Key in object structure must evaluate to a string; got: {{value}}",
        "D1004": "Regular expression matches zero length string",
        "T1005": "Attempted to invoke a non-function. Did you mean ${{{token}}}?",
        "T1006": "Attempted to invoke a non-function",
        "T1007": "Attempted to partially apply a non-function. Did you mean ${{{token}}}?",
        "T1008": "Attempted to partially apply a non-function",
        "T2001": "The left side of the {{token}} operator must evaluate to a number",
        "T2002": "The right side of the {{token}} operator must evaluate to a number",
        "T2003": "The left side of the range operator (..) must evaluate to an integer",
        "T2004": "The right side of the range operator (..) must evaluate to an integer",
        "D2005": "The left side of := must be a variable name (start with $)",
        "T2006": "The right side of the function application operator ~> must be a function",
        "T2007": "Type mismatch when comparing values {{value}} and {{value2}} in order-by clause",
        "T2008": "The expressions within an order-by clause must evaluate to numeric or string values",
        "T2009": "The values {{value}} and {{value2}} either side of operator {{token}} must be of the same data type",
        "T2010": "The expressions either side of operator {{token}} must evaluate to numeric or string values",
        "T2011": "The insert/update clause of the transform expression must evaluate to an object: {{value}}",
        "T2012": "The delete clause of the transform expression must evaluate to a string or array of strings: {{value}}",
        "T2013": "The transform expression clones the input object using the $clone() function.  This has been overridden in the current scope by a non-function.",
        "D3001": "Attempting to invoke string function on Infinity or NaN",
        "D3010": "Second argument of replace function cannot be an empty string",
        "D3011": "Fourth argument of replace function must evaluate to a positive number",
        "D3012": "Attempted to replace a matched string with a non-string value",
        "D3020": "Third argument of split function must evaluate to a positive number",
        "D3030": "Unable to cast value to a number: {{value}}",
        "D3040": "Third argument of match function must evaluate to a positive number",
        "D3050": "First argument of reduce function must be a function with two arguments",
        "D3060": "The sqrt function cannot be applied to a negative number: {{value}}",
        "D3061": "The power function has resulted in a value that cannot be represented as a JSON number: base={{value}}, exponent={{exp}}",
        "D3070": "The single argument form of the sort function can only be applied to an array of strings or an array of numbers.  Use the second argument to specify a comparison function",
        "D3080": "The picture string must only contain a maximum of two sub-pictures",
        "D3081": "The sub-picture must not contain more than one instance of the 'decimal-separator' character",
        "D3082": "The sub-picture must not contain more than one instance of the 'percent' character",
        "D3083": "The sub-picture must not contain more than one instance of the 'per-mille' character",
        "D3084": "The sub-picture must not contain both a 'percent' and a 'per-mille' character",
        "D3085": "The mantissa part of a sub-picture must contain at least one character that is either an 'optional digit character' or a member of the 'decimal digit family'",
        "D3086": "The sub-picture must not contain a passive character that is preceded by an active character and that is followed by another active character",
        "D3087": "The sub-picture must not contain a 'grouping-separator' character that appears adjacent to a 'decimal-separator' character",
        "D3088": "The sub-picture must not contain a 'grouping-separator' at the end of the integer part",
        "D3089": "The sub-picture must not contain two adjacent instances of the 'grouping-separator' character",
        "D3090": "The integer part of the sub-picture must not contain a member of the 'decimal digit family' that is followed by an instance of the 'optional digit character'",
        "D3091": "The fractional part of the sub-picture must not contain an instance of the 'optional digit character' that is followed by a member of the 'decimal digit family'",
        "D3092": "A sub-picture that contains a 'percent' or 'per-mille' character must not contain a character treated as an 'exponent-separator'",
        "D3093": "The exponent part of the sub-picture must comprise only of one or more characters that are members of the 'decimal digit family'",
        "D3100": "The radix of the formatBase function must be between 2 and 36.  It was given {{value}}",
        "D3110": "The argument of the toMillis function must be an ISO 8601 formatted timestamp. Given {{value}}"
    };

    /**
     * lookup a message template from the catalog and substitute the inserts
     * @param {string} err - error code to lookup
     * @returns {string} message
     */
    function lookupMessage(err) {
        var message = 'Unknown error';
        if(typeof err.message !== 'undefined') {
            message = err.message;
        }
        var template = errorCodes[err.code];
        if(typeof template !== 'undefined') {
            // if there are any handlebars, replace them with the field references
            // triple braces - replace with value
            // double braces - replace with json stringified value
            message = template.replace(/\{\{\{([^}]+)}}}/g, function() {
                return err[arguments[1]];
            });
            message = message.replace(/\{\{([^}]+)}}/g, function() {
                return JSON.stringify(err[arguments[1]]);
            });
        }
        return message;
    }

    /**
     * JSONata
     * @param {Object} expr - JSONata expression
     * @param {boolean} options - recover: attempt to recover on parse error
     * @returns {{evaluate: evaluate, assign: assign}} Evaluated expression
     */
    function jsonata(expr, options) {
        var ast;
        var errors;
        try {
            ast = parser(expr, options && options.recover);
            errors = ast.errors;
            delete ast.errors;
        } catch(err) {
            // insert error message into structure
            err.message = lookupMessage(err);
            throw err;
        }
        var environment = createFrame(staticFrame);

        var timestamp = new Date(); // will be overridden on each call to evalute()
        environment.bind('now', defineFunction(function() {
            return timestamp.toJSON();
        }, '<:s>'));
        environment.bind('millis', defineFunction(function() {
            return timestamp.getTime();
        }, '<:n>'));

        return {
            evaluate: function (input, bindings, callback) {
                // throw if the expression compiled with syntax errors
                if(typeof errors !== 'undefined') {
                    var err = {
                        code: 'S0500',
                        position: 0
                    };
                    err.message = lookupMessage(err);
                    throw err;
                }

                if (typeof bindings !== 'undefined') {
                    var exec_env;
                    // the variable bindings have been passed in - create a frame to hold these
                    exec_env = createFrame(environment);
                    for (var v in bindings) {
                        exec_env.bind(v, bindings[v]);
                    }
                } else {
                    exec_env = environment;
                }
                // put the input document into the environment as the root object
                exec_env.bind('$', input);

                // capture the timestamp and put it in the execution environment
                // the $now() and $millis() functions will return this value - whenever it is called
                timestamp = new Date();

                var result, it;
                // if a callback function is supplied, then drive the generator in a promise chain
                if(typeof callback === 'function') {
                    exec_env.bind('__jsonata_async', true);
                    var thenHandler = function (response) {
                        result = it.next(response);
                        if (result.done) {
                            callback(null, result.value);
                        } else {
                            result.value.then(thenHandler)
                                .catch(function (err) {
                                    err.message = lookupMessage(err);
                                    callback(err, null);
                                });
                        }
                    };
                    it = evaluate(ast, input, exec_env);
                    result = it.next();
                    result.value.then(thenHandler);
                } else {
                    // no callback function - drive the generator to completion synchronously
                    try {
                        it = evaluate(ast, input, exec_env);
                        result = it.next();
                        while (!result.done) {
                            result = it.next(result.value);
                        }
                        return result.value;
                    } catch (err) {
                        // insert error message into structure
                        err.message = lookupMessage(err);
                        throw err;
                    }
                }
            },
            assign: function (name, value) {
                environment.bind(name, value);
            },
            registerFunction: function(name, implementation, signature) {
                var func = defineFunction(implementation, signature);
                environment.bind(name, func);
            },
            ast: function() {
                return ast;
            },
            errors: function() {
                return errors;
            }
        };
    }

    jsonata.parser = parser; // TODO remove this in a future release - use ast() instead

    return jsonata;

})();

// node.js only - export the jsonata and parser functions
// istanbul ignore else
if(typeof module !== 'undefined') {
    module.exports = jsonata;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],65:[function(require,module,exports){
(function (process){
'use strict';

var loglevel = require('loglevel');
var chalk = require('chalk');

var loggers = {};

module.exports = getLogger;

function getLogger() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$level = _ref.level,
      level = _ref$level === undefined ? getDefaultLevel() : _ref$level,
      _ref$prefix = _ref.prefix,
      prefix = _ref$prefix === undefined ? '' : _ref$prefix;

  if (loggers[prefix]) {
    return loggers[prefix];
  }
  var coloredPrefix = prefix ? `${chalk.dim(prefix)} ` : '';
  var levelPrefix = {
    TRACE: chalk.dim('[TRACE]'),
    DEBUG: chalk.cyan('[DEBUG]'),
    INFO: chalk.blue('[INFO]'),
    WARN: chalk.yellow('[WARN]'),
    ERROR: chalk.red('[ERROR]')
  };

  var logger = loglevel.getLogger(`${prefix}-logger`);

  // this is the plugin "api"
  var originalFactory = logger.methodFactory;
  logger.methodFactory = methodFactory;

  var originalSetLevel = logger.setLevel;
  logger.setLevel = setLevel;
  logger.setLevel(level);
  loggers[prefix] = logger;
  return logger;

  function methodFactory() {
    for (var _len = arguments.length, factoryArgs = Array(_len), _key = 0; _key < _len; _key++) {
      factoryArgs[_key] = arguments[_key];
    }

    var logLevel = factoryArgs[0];

    var rawMethod = originalFactory.apply(undefined, factoryArgs);
    return function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return rawMethod.apply(undefined, [`${coloredPrefix}${levelPrefix[logLevel.toUpperCase()]}:`].concat(args));
    };
  }

  function setLevel(levelToSetTo) {
    var persist = false; // uses browser localStorage
    return originalSetLevel.call(logger, levelToSetTo, persist);
  }
}

function getDefaultLevel() {
  var logLevel = process.env.LOG_LEVEL;

  if (logLevel === 'undefined' || !logLevel) {
    return 'warn';
  }
  return logLevel;
}
}).call(this,require('_process'))

},{"_process":3,"chalk":56,"loglevel":66}],66:[function(require,module,exports){
/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        define(definition);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = definition();
    } else {
        root.log = definition();
    }
}(this, function () {
    "use strict";

    // Slightly dubious tricks to cut down minimized file size
    var noop = function() {};
    var undefinedType = "undefined";

    var logMethods = [
        "trace",
        "debug",
        "info",
        "warn",
        "error"
    ];

    // Cross-browser bind equivalent that works at least back to IE6
    function bindMethod(obj, methodName) {
        var method = obj[methodName];
        if (typeof method.bind === 'function') {
            return method.bind(obj);
        } else {
            try {
                return Function.prototype.bind.call(method, obj);
            } catch (e) {
                // Missing bind shim or IE8 + Modernizr, fallback to wrapping
                return function() {
                    return Function.prototype.apply.apply(method, [obj, arguments]);
                };
            }
        }
    }

    // Build the best logging method possible for this env
    // Wherever possible we want to bind, not wrap, to preserve stack traces
    function realMethod(methodName) {
        if (methodName === 'debug') {
            methodName = 'log';
        }

        if (typeof console === undefinedType) {
            return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives
        } else if (console[methodName] !== undefined) {
            return bindMethod(console, methodName);
        } else if (console.log !== undefined) {
            return bindMethod(console, 'log');
        } else {
            return noop;
        }
    }

    // These private functions always need `this` to be set properly

    function replaceLoggingMethods(level, loggerName) {
        /*jshint validthis:true */
        for (var i = 0; i < logMethods.length; i++) {
            var methodName = logMethods[i];
            this[methodName] = (i < level) ?
                noop :
                this.methodFactory(methodName, level, loggerName);
        }

        // Define log.log as an alias for log.debug
        this.log = this.debug;
    }

    // In old IE versions, the console isn't present until you first open it.
    // We build realMethod() replacements here that regenerate logging methods
    function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
        return function () {
            if (typeof console !== undefinedType) {
                replaceLoggingMethods.call(this, level, loggerName);
                this[methodName].apply(this, arguments);
            }
        };
    }

    // By default, we use closely bound real methods wherever possible, and
    // otherwise we wait for a console to appear, and then try again.
    function defaultMethodFactory(methodName, level, loggerName) {
        /*jshint validthis:true */
        return realMethod(methodName) ||
               enableLoggingWhenConsoleArrives.apply(this, arguments);
    }

    function Logger(name, defaultLevel, factory) {
      var self = this;
      var currentLevel;
      var storageKey = "loglevel";
      if (name) {
        storageKey += ":" + name;
      }

      function persistLevelIfPossible(levelNum) {
          var levelName = (logMethods[levelNum] || 'silent').toUpperCase();

          if (typeof window === undefinedType) return;

          // Use localStorage if available
          try {
              window.localStorage[storageKey] = levelName;
              return;
          } catch (ignore) {}

          // Use session cookie as fallback
          try {
              window.document.cookie =
                encodeURIComponent(storageKey) + "=" + levelName + ";";
          } catch (ignore) {}
      }

      function getPersistedLevel() {
          var storedLevel;

          if (typeof window === undefinedType) return;

          try {
              storedLevel = window.localStorage[storageKey];
          } catch (ignore) {}

          // Fallback to cookies if local storage gives us nothing
          if (typeof storedLevel === undefinedType) {
              try {
                  var cookie = window.document.cookie;
                  var location = cookie.indexOf(
                      encodeURIComponent(storageKey) + "=");
                  if (location !== -1) {
                      storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
                  }
              } catch (ignore) {}
          }

          // If the stored level is not valid, treat it as if nothing was stored.
          if (self.levels[storedLevel] === undefined) {
              storedLevel = undefined;
          }

          return storedLevel;
      }

      /*
       *
       * Public logger API - see https://github.com/pimterry/loglevel for details
       *
       */

      self.name = name;

      self.levels = { "TRACE": 0, "DEBUG": 1, "INFO": 2, "WARN": 3,
          "ERROR": 4, "SILENT": 5};

      self.methodFactory = factory || defaultMethodFactory;

      self.getLevel = function () {
          return currentLevel;
      };

      self.setLevel = function (level, persist) {
          if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
              level = self.levels[level.toUpperCase()];
          }
          if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
              currentLevel = level;
              if (persist !== false) {  // defaults to true
                  persistLevelIfPossible(level);
              }
              replaceLoggingMethods.call(self, level, name);
              if (typeof console === undefinedType && level < self.levels.SILENT) {
                  return "No console available for logging";
              }
          } else {
              throw "log.setLevel() called with invalid level: " + level;
          }
      };

      self.setDefaultLevel = function (level) {
          if (!getPersistedLevel()) {
              self.setLevel(level, false);
          }
      };

      self.enableAll = function(persist) {
          self.setLevel(self.levels.TRACE, persist);
      };

      self.disableAll = function(persist) {
          self.setLevel(self.levels.SILENT, persist);
      };

      // Initialize with the right level
      var initialLevel = getPersistedLevel();
      if (initialLevel == null) {
          initialLevel = defaultLevel == null ? "WARN" : defaultLevel;
      }
      self.setLevel(initialLevel, false);
    }

    /*
     *
     * Top-level API
     *
     */

    var defaultLogger = new Logger();

    var _loggersByName = {};
    defaultLogger.getLogger = function getLogger(name) {
        if (typeof name !== "string" || name === "") {
          throw new TypeError("You must supply a name when creating a logger.");
        }

        var logger = _loggersByName[name];
        if (!logger) {
          logger = _loggersByName[name] = new Logger(
            name, defaultLogger.getLevel(), defaultLogger.methodFactory);
        }
        return logger;
    };

    // Grab the current global log variable in case of overwrite
    var _log = (typeof window !== undefinedType) ? window.log : undefined;
    defaultLogger.noConflict = function() {
        if (typeof window !== undefinedType &&
               window.log === defaultLogger) {
            window.log = _log;
        }

        return defaultLogger;
    };

    defaultLogger.getLoggers = function getLoggers() {
        return _loggersByName;
    };

    return defaultLogger;
}));

},{}],67:[function(require,module,exports){
(function (global){
var performance = global.performance || {};

var present = (function () {
  var names = ['now', 'webkitNow', 'msNow', 'mozNow', 'oNow'];
  while (names.length) {
    var name = names.shift();
    if (name in performance) {
      return performance[name].bind(performance);
    }
  }

  var dateNow = Date.now || function () { return new Date().getTime(); };
  var navigationStart = (performance.timing || {}).navigationStart || dateNow();
  return function () {
    return dateNow() - navigationStart;
  };
}());

present.performanceNow = performance.now;
present.noConflict = function () {
  performance.now = present.performanceNow;
};
present.conflict = function () {
  performance.now = present;
};
present.conflict();

module.exports = present;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],68:[function(require,module,exports){
// Export ./lib/randgen

module.exports = require("./lib/randgen");

},{"./lib/randgen":69}],69:[function(require,module,exports){
/*jslint indent: 2, plusplus: true, sloppy: true */
// Generate uniformly distributed random numbers
// Gives a random number on the interval [min, max).
// If discrete is true, the number will be an integer.
function runif(min, max, discrete) {
  if (min === undefined) {
    min = 0;
  }
  if (max === undefined) {
    max = 1;
  }
  if (discrete === undefined) {
    discrete = false;
  }
  if (discrete) {
    return Math.floor(runif(min, max, false));
  }
  return Math.random() * (max - min) + min;
}

// Generate normally-distributed random nubmers
// Algorithm adapted from:
// http://c-faq.com/lib/gaussian.html
function rnorm(mean, stdev) {
  var u1, u2, v1, v2, s;
  if (mean === undefined) {
    mean = 0.0;
  }
  if (stdev === undefined) {
    stdev = 1.0;
  }
  if (rnorm.v2 === null) {
    do {
      u1 = Math.random();
      u2 = Math.random();

      v1 = 2 * u1 - 1;
      v2 = 2 * u2 - 1;
      s = v1 * v1 + v2 * v2;
    } while (s === 0 || s >= 1);

    rnorm.v2 = v2 * Math.sqrt(-2 * Math.log(s) / s);
    return stdev * v1 * Math.sqrt(-2 * Math.log(s) / s) + mean;
  }

  v2 = rnorm.v2;
  rnorm.v2 = null;
  return stdev * v2 + mean;
}

rnorm.v2 = null;

// Generate Chi-square distributed random numbers
function rchisq(degreesOfFreedom) {
  if (degreesOfFreedom === undefined) {
    degreesOfFreedom = 1;
  }
  var i, z, sum = 0.0;
  for (i = 0; i < degreesOfFreedom; i++) {
    z = rnorm();
    sum += z * z;
  }

  return sum;
}

// Generate Poisson distributed random numbers
function rpoisson(lambda) {
  if (lambda === undefined) {
    lambda = 1;
  }
  var l = Math.exp(-lambda),
    k = 0,
    p = 1.0;
  do {
    k++;
    p *= Math.random();
  } while (p > l);

  return k - 1;
}

// Generate Cauchy distributed random numbers
function rcauchy(loc, scale) {
  if (loc === undefined) {
    loc = 0.0;
  }
  if (scale === undefined) {
    scale = 1.0;
  }
  var n2, n1 = rnorm();
  do {
    n2 = rnorm();
  } while (n2 === 0.0);

  return loc + scale * n1 / n2;
}

// Bernoulli distribution: gives 1 with probability p
function rbernoulli(p) {
  return Math.random() < p ? 1 : 0;
}

// Vectorize a random generator
function vectorize(generator) {
  return function () {
    var n, result, i, args;
    args = [].slice.call(arguments)
    n = args.shift();
    result = [];
    for (i = 0; i < n; i++) {
      result.push(generator.apply(this, args));
    }
    return result;
  };
}

// Generate a histogram from a list of numbers
function histogram(data, binCount) {
  binCount = binCount || 10;

  var bins, i, scaled,
    max = Math.max.apply(this, data),
    min = Math.min.apply(this, data);

  // edge case: max == min
  if (max === min) {
    return [data.length];
  }

  bins = [];

  // zero each bin
  for (i = 0; i < binCount; i++) {
    bins.push(0);
  }

  for (i = 0; i < data.length; i++) {
    // scale it to be between 0 and 1
    scaled = (data[i] - min) / (max - min);

    // scale it up to the histogram size
    scaled *= binCount;

    // drop it in a bin
    scaled = Math.floor(scaled);

    // edge case: the max
    if (scaled === binCount) { scaled--; }

    bins[scaled]++;
  }

  return bins;
}

/**
 * Get a random element from a list
 */
function rlist(list) {
  return list[runif(0, list.length, true)];
}

exports.runif = runif;
exports.rnorm = rnorm;
exports.rchisq = rchisq;
exports.rpoisson = rpoisson;
exports.rcauchy = rcauchy;
exports.rbernoulli = rbernoulli;
exports.rlist = rlist;

exports.rvunif = vectorize(runif);
exports.rvnorm = vectorize(rnorm);
exports.rvchisq = vectorize(rchisq);
exports.rvpoisson = vectorize(rpoisson);
exports.rvcauchy = vectorize(rcauchy);
exports.rvbernoulli = vectorize(rbernoulli);
exports.rvlist = vectorize(rlist);

exports.histogram = histogram;

},{}],70:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":53}],71:[function(require,module,exports){
/* jshint node: true */
"use strict";
function makeArrayFrom(obj) {
  return Array.prototype.slice.apply(obj);
}
var
  PENDING = "pending",
  RESOLVED = "resolved",
  REJECTED = "rejected";

function SynchronousPromise(handler) {
  this.status = PENDING;
  this._continuations = [];
  this._parent = null;
  this._paused = false;
  if (handler) {
    handler.call(
      this,
      this._continueWith.bind(this),
      this._failWith.bind(this)
    );
  }
}

function looksLikeAPromise(obj) {
  return obj && typeof (obj.then) === "function";
}

SynchronousPromise.prototype = {
  then: function (nextFn, catchFn) {
    var next = SynchronousPromise.unresolved()._setParent(this);
    if (this._isRejected()) {
      if (this._paused) {
        this._continuations.push({
          promise: next,
          nextFn: nextFn,
          catchFn: catchFn
        });
        return next;
      }
      if (catchFn) {
        try {
          var catchResult = catchFn(this._error);
          if (looksLikeAPromise(catchResult)) {
            this._chainPromiseData(catchResult, next);
            return next;
          } else {
            return SynchronousPromise.resolve(catchResult)._setParent(this);
          }
        } catch (e) {
          return SynchronousPromise.reject(e)._setParent(this);
        }
      }
      return SynchronousPromise.reject(this._error)._setParent(this);
    }
    this._continuations.push({
      promise: next,
      nextFn: nextFn,
      catchFn: catchFn
    });
    this._runResolutions();
    return next;
  },
  catch: function (handler) {
    if (this._isResolved()) {
      return SynchronousPromise.resolve(this._data)._setParent(this);
    }
    var next = SynchronousPromise.unresolved()._setParent(this);
    this._continuations.push({
      promise: next,
      catchFn: handler
    });
    this._runRejections();
    return next;
  },
  pause: function () {
    this._paused = true;
    return this;
  },
  resume: function () {
    var firstPaused = this._findFirstPaused();
    if (firstPaused) {
      firstPaused._paused = false;
      firstPaused._runResolutions();
      firstPaused._runRejections();
    }
    return this;
  },
  _findAncestry: function () {
    return this._continuations.reduce(function (acc, cur) {
      if (cur.promise) {
        var node = {
          promise: cur.promise,
          children: cur.promise._findAncestry()
        };
        acc.push(node);
      }
      return acc;
    }, []);
  },
  _setParent: function (parent) {
    if (this._parent) {
      throw new Error("parent already set");
    }
    this._parent = parent;
    return this;
  },
  _continueWith: function (data) {
    var firstPending = this._findFirstPending();
    if (firstPending) {
      firstPending._data = data;
      firstPending._setResolved();
    }
  },
  _findFirstPending: function () {
    return this._findFirstAncestor(function (test) {
      return test._isPending && test._isPending();
    });
  },
  _findFirstPaused: function () {
    return this._findFirstAncestor(function (test) {
      return test._paused;
    });
  },
  _findFirstAncestor: function (matching) {
    var test = this;
    var result;
    while (test) {
      if (matching(test)) {
        result = test;
      }
      test = test._parent;
    }
    return result;
  },
  _failWith: function (error) {
    var firstRejected = this._findFirstPending();
    if (firstRejected) {
      firstRejected._error = error;
      firstRejected._setRejected();
    }
  },
  _takeContinuations: function () {
    return this._continuations.splice(0, this._continuations.length);
  },
  _runRejections: function () {
    if (this._paused || !this._isRejected()) {
      return;
    }
    var
      error = this._error,
      continuations = this._takeContinuations(),
      self = this;
    continuations.forEach(function (cont) {
      if (cont.catchFn) {
        var catchResult = cont.catchFn(error);
        self._handleUserFunctionResult(catchResult, cont.promise);
      } else {
        cont.promise.reject(error);
      }
    });
  },
  _runResolutions: function () {
    if (this._paused || !this._isResolved()) {
      return;
    }
    var continuations = this._takeContinuations();
    if (looksLikeAPromise(this._data)) {
      return this._handleWhenResolvedDataIsPromise(this._data);
    }
    var data = this._data;
    var self = this;
    continuations.forEach(function (cont) {
      if (cont.nextFn) {
        try {
          var result = cont.nextFn(data);
          self._handleUserFunctionResult(result, cont.promise);
        } catch (e) {
          self._handleResolutionError(e, cont);
        }
      } else if (cont.promise) {
        cont.promise.resolve(data);
      }
    });
  },
  _handleResolutionError: function (e, continuation) {
    this._setRejected();
    if (continuation.catchFn) {
      try {
        continuation.catchFn(e);
        return;
      } catch (e2) {
        e = e2;
      }
    }
    if (continuation.promise) {
      continuation.promise.reject(e);
    }
  },
  _handleWhenResolvedDataIsPromise: function (data) {
    var self = this;
    return data.then(function (result) {
      self._data = result;
      self._runResolutions();
    }).catch(function (error) {
      self._error = error;
      self._setRejected();
      self._runRejections();
    });
  },
  _handleUserFunctionResult: function (data, nextSynchronousPromise) {
    if (looksLikeAPromise(data)) {
      this._chainPromiseData(data, nextSynchronousPromise);
    } else {
      nextSynchronousPromise.resolve(data);
    }
  },
  _chainPromiseData: function (promiseData, nextSynchronousPromise) {
    promiseData.then(function (newData) {
      nextSynchronousPromise.resolve(newData);
    }).catch(function (newError) {
      nextSynchronousPromise.reject(newError);
    });
  },
  _setResolved: function () {
    this.status = RESOLVED;
    if (!this._paused) {
      this._runResolutions();
    }
  },
  _setRejected: function () {
    this.status = REJECTED;
    if (!this._paused) {
      this._runRejections();
    }
  },
  _isPending: function () {
    return this.status === PENDING;
  },
  _isResolved: function () {
    return this.status === RESOLVED;
  },
  _isRejected: function () {
    return this.status === REJECTED;
  }
};

SynchronousPromise.resolve = function (result) {
  return new SynchronousPromise(function (resolve, reject) {
    if (looksLikeAPromise(result)) {
      result.then(function (newResult) {
        resolve(newResult);
      }).catch(function (error) {
        reject(error);
      });
    } else {
      resolve(result);
    }
  });
};

SynchronousPromise.reject = function (result) {
  return new SynchronousPromise(function (resolve, reject) {
    reject(result);
  });
};

SynchronousPromise.unresolved = function () {
  return new SynchronousPromise(function (resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
  });
};

SynchronousPromise.all = function () {
  var args = makeArrayFrom(arguments);
  if (Array.isArray(args[0])) {
    args = args[0];
  }
  if (!args.length) {
    return SynchronousPromise.resolve([]);
  }
  return new SynchronousPromise(function (resolve, reject) {
    var
      allData = [],
      numResolved = 0,
      doResolve = function () {
        if (numResolved === args.length) {
          resolve(allData);
        }
      },
      rejected = false,
      doReject = function (err) {
        if (rejected) {
          return;
        }
        rejected = true;
        reject(err);
      };
    args.forEach(function (arg, idx) {
      SynchronousPromise.resolve(arg).then(function (thisResult) {
        allData[idx] = thisResult;
        numResolved += 1;
        doResolve();
      }).catch(function (err) {
        doReject(err);
      });
    });
  });
};

/* jshint ignore:start */
if (Promise === SynchronousPromise) {
  throw new Error("Please use SynchronousPromise.installGlobally() to install globally");
}
var RealPromise = Promise;
SynchronousPromise.installGlobally = function(__awaiter) {
  if (Promise === SynchronousPromise) {
    return __awaiter;
  } 
  var result = patchAwaiterIfRequired(__awaiter);
  Promise = SynchronousPromise;
  return result;
};

SynchronousPromise.uninstallGlobally = function() {
  if (Promise === SynchronousPromise) {
    Promise = RealPromise;
  }
};

function patchAwaiterIfRequired(__awaiter) {
  if (typeof(__awaiter) === "undefined" || __awaiter.__patched) {
    return __awaiter;
  }
  var originalAwaiter = __awaiter;
  __awaiter = function() {
    var Promise = RealPromise;
    originalAwaiter.apply(this, makeArrayFrom(arguments));
  };
  __awaiter.__patched = true;
  return __awaiter;
}
/* jshint ignore:end */

module.exports = {
  SynchronousPromise: SynchronousPromise
};
},{}],72:[function(require,module,exports){
"use strict";

// Plugin to add 'property' (as in personal property) property to Players when they are initialized. Meant to be used for
// simulations involving personal posessions, for instance economic simulations.

// NashJS engine components
var Engine = require("../lib/engine")

// Game state
var { registry, gamePopulation } = Engine.Backend.State;

// Let's add some PlayerList functionality
var { PlayerList } = Engine.Backend.Classes;


var BalanceSheet = function() {

	// Variables to store settings, and defaults
	var settings = {
		addBalanceSheetOnClaim: true,
		cleanZeros: true,
		negativeAssets: false
	}
	//TODO make negativeAssets (and negativeLiabilities) work


	// Assets Classes

	// Claim parent class
	var Claim = function(claimant, amount) {
		// Add balance sheet if necessary and permitted
		if (!claimant.balanceSheet) {
			if (settings.addBalanceSheetOnClaim) addEntries(registry.players[claimant.id()])
			// Fail if not permitted to add necessary balance sheet.
			else return false;
		}

		this.amount = amount;
		this.claimant = claimant
		claimant.endow(this)
		return true;
	}

	// End ownership claim
	Claim.prototype.erase = function() {
		this.claimant.revoke(this)
		this.claimant = null;
		this.amount = 0
	}

	// Merge claims if they're the same family but different amounts
	Claim.prototype.merge = function(otherClaim) {
		if (this.claimant !== otherClaim.claimant) return false
		// Add amounts
		this.amount = this.amount + otherClaim.amount

		// Remove from balance sheet
		otherClaim.erase();
	}

	// Split this into two separate claims, with different amounts
	Claim.prototype.split = function(newAmount) {
		var clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
		clone.amount = newAmount;
		this.amount = this.amount - newAmount;
		this.claimant.endow(clone, false)
		return clone;
	}

	// Transfer to new owner
	Claim.prototype.transfer = function(newClaimant, amount = "all") {
		// Add balance sheet if necessary and permitted
		if (!newClaimant.balanceSheet) {
			if (settings.addBalanceSheetOnClaim) addEntries(registry.players[newClaimant.id()])
			// Fail if not permitted to add necessary balance sheet.
			else return false;
		}

		// Transfer all of it
		if (amount == "all" || amount == this.amount) {
			var oldClaimant = this.claimant;
			this.claimant.revoke(this);
			this.claimant = newClaimant;
			newClaimant.endow(this);

		}
		// or only a portion
		else {
			var newClaim = this.split(amount);
			newClaim.transfer(newClaimant, "all")
			cleanAsset(this)
		}

	}



	// Claims on real things (like cars, houses, gold)
	var RealClaim = function(claimant, good, amount) {
		if (!Claim.call(this, claimant, amount)) return false;
		this.good = good;
	}
	RealClaim.prototype = Object.create(Claim.prototype)
	RealClaim.prototype.constructor = RealClaim

	// Lose value by percentage
	RealClaim.prototype.depreciate = function(rate = .1) {
		this.amount = this.amount * (1 - rate)
	}

	// Add good enforcement to merge
	RealClaim.prototype.merge = function(otherClaim) {
		if (this.good === otherClaim.good) return Claim.prototype.merge.call(this, otherClaim);
	}

	// Replace player object with id when stringifying
	RealClaim.prototype.toJSON = function() {
		return {
			claimant: this.claimant.id(),
			good: this.good,
			amount: this.amount
		}
	}

	// Claims on other entities with balance sheets
	var FinancialClaim = function(claimant, claimed, amount, instrument = "Debt") {
		// Add balance sheet if necessary and permitted
		if (!claimed.balanceSheet) {
			if (settings.addBalanceSheetOnClaim) addEntries(registry.players[claimed.id()])
			// Fail if not permitted to add necessary balance sheet.
			else return false;
		}
		this.claimed = claimed;
		this.instrument = instrument;

		if (!Claim.call(this, claimant, amount)) return false;

		claimed.indebt(this)
	}
	FinancialClaim.prototype = Object.create(Claim.prototype)
	FinancialClaim.prototype.constructor = FinancialClaim

	// Add to erase function, to erase from claimed's balance sheet too
	FinancialClaim.prototype.erase = function() {
		var bs = registry.players[this.claimed.id()].balanceSheet.liabilities
		bs.splice(bs.indexOf(this), 1)
		this.claimed = null;

		return Claim.prototype.erase.call(this)
	}

	// Add claimed enforcement to merge
	FinancialClaim.prototype.merge = function(otherClaim) {
		if (this.claimed === otherClaim.claimed) return Claim.prototype.merge.call(this, otherClaim);
	}


	// Add to split function, to split on claimed's balance sheet too
	FinancialClaim.prototype.split = function(newAmount) {
		var clone = Claim.prototype.split.call(this, newAmount);
		clone.claimed.indebt(clone, false);
		return clone;
	}

	// Replace player object with id when stringifying
	FinancialClaim.prototype.toJSON = function() {
		return {
			claimant: this.claimant.id(),
			claimed: this.claimed.id(),
			instrument: this.instrument,
			amount: this.amount
		}
	}


	// Clean the similar claims on the claimant supplied
	var cleanAsset = function(claim) {
		var bs = registry.players[claim.claimant.id()].balanceSheet.assets;

		var dirty = bs.filter(function(entry) {
			return (entry !== claim && entry.good === claim.good && entry.instrument === claim.instrument);
		})

		dirty.forEach(function(dirt) {
			claim.merge(dirt)
		})

		if (settings.cleanZeros && claim.amount == 0) claim.erase()
	}

	var cleanLiability = function(claim) {
		var bs = registry.players[claim.claimed.id()].balanceSheet.liabilities;

		var dirty = bs.filter(function(entry) {
			return (entry !== claim && entry.claimant === claim.claimant && entry.instrument === claim.instrument);
		})

		dirty.forEach(function(dirt) {
			claim.merge(dirt)
		})

		if (settings.cleanZeros && claim.amount == 0) claim.erase
	}



	// Add balance sheet object and methods to player.
	var addEntries = function(player) {

		//_player properties/methods
		player.balanceSheet = { assets: [], liabilities: [] }

		/*
		var lookup = function(type) {
			this.reduce(function(accumulator, value) {
				if (type === value.good) accumulator += value.amount
				else if (type instanceof Object && type.instrument == value.instrument && (type.claimed === value.claimed))
					accumulator += value.amount
				return accumulator;
			}, 0)
		}
		player.balanceSheet.assets.lookup = lookup;
		player.balanceSheet.liabilities.lookup = lookup;
		*/

		player.netWorth = function() {

			var assets = this.balanceSheet.assets.reduce(function(accumulator, currentValue) {
				return accumulator + currentValue.amount
			}, 0);

			var liabilities = this.balanceSheet.liabilities.reduce(function(accumulator,
				currentValue) {
				return accumulator + currentValue.amount
			}, 0);

			return assets - liabilities;
		}

		// User interface
		player.interface.balanceSheet = function() {
			return JSON.parse(JSON.stringify(registry.players[player.id].balanceSheet));
		}

		player.interface.netWorth = function() {
			return registry.players[player.id].netWorth();
		}

		// TODO validate object.
		player.interface.endow = function(asset, clean = true) {
			if (asset instanceof Claim) {
				registry.players[player.id].balanceSheet.assets.push(asset);
				if (clean) cleanAsset(asset);
			}
		}

		player.interface.indebt = function(liability, clean = true) {
			if (liability instanceof FinancialClaim) {
				registry.players[player.id].balanceSheet.liabilities.push(
					liability);
				if (clean) cleanLiability(liability);
			}
		}

		player.interface.revoke = function(asset) {
			if (asset instanceof Claim) {
				var bs = registry.players[player.id].balanceSheet.assets
				bs.splice(bs.indexOf(asset), 1)
			}
		}

		// TODO convert this over
		player.interface.lend = function(borrower, amount, instrument = "Debt") {
			return new FinancialClaim(player.interface, borrower, amount, instrument)
		}
	}



	// The plugin object.
	var Plugin = {
		name: "balance-sheet-complex",

		settings: function(parameters = {}) {
			Object.assign(settings, parameters)
		},

		// Option to initialize by creating 'property' for a group of players.
		init(players = []) {
			// Add some playerlist functionality
			PlayerList.prototype.balanceSheets = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet();
					else return null;
				})
			};

			PlayerList.prototype.assets = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet().assets;
					else return null;
				})
			};

			PlayerList.prototype.liabilities = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet().liabilities;
					else return null;
				})
			};

			PlayerList.prototype.netWorth = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.netWorth();
					else return null;
				})
			};

			PlayerList.prototype.zeroBalanceSheets = function() {
				this.forEach(function(player) {
					addEntries(player)
				});
				return this;
			}

			// Add bs for specified players
			players.forEach(function(player) {
				addEntries(registry.players[player.id()]);
			})
		},

		// If we've init-ed alredy, just add bs's to the current player list if they don't have already
		require(players = []) {
			players.forEach(function(player) {
				if (!player.balanceSheet) addEntries(registry.players[player.id()]);
			});
		},

		stop() {
			// remove prototype addEntries
			delete PlayerList.prototype.balanceSheets;
			delete PlayerList.prototype.assets;
			delete PlayerList.prototype.liabilities;
			delete PlayerList.prototype.netWorth;

			// delete balance sheet properties from every player and interface.
			gamePopulation().forEach(function(player) {
				delete player.balanceSheet;
				delete player.netWorth;
				delete player.interface.balanceSheet;
				delete player.interface.netWorth;
				delete player.interface.endowAssets;
				delete player.interface.lend;
			})
		},

		// Public classes for asset/liability
		publicIfActive: {
			RealClaim,
			FinancialClaim
		},

		// create property and interface function when player is created
		'player-create': addEntries,

		// Blank property when player is re-initialized
		"player-reinitialize" (player) {
			player.balanceSheet = { assets: [], liabilities: [] }
		}
	}

	return Plugin;
}



module.exports = BalanceSheet;

},{"../lib/engine":6}],73:[function(require,module,exports){
"use strict";

// Plugin to add 'property' (as in personal property) property to Players when they are initialized. Meant to be used for
// simulations involving personal posessions, for instance economic simulations.

// NashJS engine components
var Engine = require("../lib/engine")

// Game state
var { registry, gamePopulation } = Engine.Backend.State;

// Let's add some PlayerList functionality
var { PlayerList } = Engine.Backend.Classes;


var BalanceSheet = function() {

	var addEntries = function(player) {
		//_player properties/methods
		player.balanceSheet = { assets: {}, liabilities: {} }

		player.netWorth = function() {

			var assets = Object.entries(this.balanceSheet.assets).reduce(function(accumulator, currentValue) {
				return accumulator + currentValue[1]
			}, 0);

			var liabilities = Object.entries(this.balanceSheet.liabilities).reduce(function(accumulator,
				currentValue) {
				return accumulator + currentValue[1]
			}, 0);

			return assets - liabilities;
		}

		// User interface
		player.interface.balanceSheet = function() {
			return JSON.parse(JSON.stringify(registry.players[player.id].balanceSheet));
		}

		player.interface.netWorth = function() {
			return registry.players[player.id].netWorth();
		}

		// TODO validate object. Should be of form {apples:2, dogs:1}
		player.interface.endowAssets = function(assetObject) {

			Object.assign(registry.players[player.id].balanceSheet.assets, assetObject)
		}

		player.interface.lend = function(loanObject) {
			//TODO validate object. Should be of form {player1:{mortgage:10}}
			var lender = registry.players[player.id].balanceSheet.assets
			Object.entries(loanObject).forEach(function(loanTo) {
				var debts;
				lender[loanTo[0]] ?
					debts = lender[loanTo[0]] : debts = lender[loanTo[0]] = {};

				Object.entries(loanTo[1]).forEach(function(newLoan) {
					debts[newLoan[0]] ? debts[newLoan[0]] += newLoan[1] : debts[newLoan[0]] = newLoan[1]
					registry.players[loanTo[0]].balanceSheet.liabilities[newLoan[0]] ? registry.players[loanTo[0]].balanceSheet
						.liabilities[newLoan[0]] += newLoan[1] : registry.players[loanTo[0]].balanceSheet.liabilities[
							newLoan[0]] = newLoan[1];
				});
			});
		}
	}



	// The plugin object.
	var Plugin = {
		name: "balance-sheet",

		// Option to initialize by creating 'property' for a group of players.
		init(players = []) {
			// Add some playerlist functionality
			PlayerList.prototype.balanceSheets = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet();
					else return null;
				})
			};

			PlayerList.prototype.assets = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet().assets;
					else return null;
				})
			};

			PlayerList.prototype.liabilities = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet().liabilities;
					else return null;
				})
			};

			PlayerList.prototype.netWorth = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.netWorth();
					else return null;
				})
			};

			PlayerList.prototype.zeroBalanceSheets = function() {
				this.forEach(function(player) {
					addEntries(player)
				});
				return this;
			}

			// Add bs for specified players
			players.forEach(function(player) {
				addEntries(registry.players[player.id()]);
			})
		},

		// If we've init-ed alredy, just add bs's to the current player list if they don't have already
		require(players = []) {
			players.forEach(function(player) {
				if (!player.balanceSheet) addEntries(registry.players[player.id()]);
			});
		},

		stop() {
			// remove prototype addEntries
			delete PlayerList.prototype.balanceSheets;
			delete PlayerList.prototype.assets;
			delete PlayerList.prototype.liabilities;
			delete PlayerList.prototype.netWorth;

			// delete balance sheet properties from every player and interface.
			gamePopulation().forEach(function(player) {
				delete player.balanceSheet;
				delete player.netWorth;
				delete player.interface.balanceSheet;
				delete player.interface.netWorth;
				delete player.interface.endowAssets;
				delete player.interface.lend;
			})
		},

		// create property and interface function when player is created
		'player-create': addEntries,

		// Blank property when player is re-initialized
		"player-reinitialize" (player) {
			player.balanceSheet = { assets: [], liabilities: [] }
		}
	}

	return Plugin;
}


module.exports = BalanceSheet;

},{"../lib/engine":6}],74:[function(require,module,exports){
"use strict";

// game pieces
var prisonerDilemma = require("./iterated-prisoner-dilemma").createGenerator;
var roundRobin = require("./round-robin");

// NashJS engine components
var Engine = require("../lib/engine")

var { Loop } = Engine.Frontend.Playables;

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")
var { generatePopulation } = Engine.Backend.HelperFunctions("tournament");

// Population interfaces
var { Population } = Engine.Frontend.Population;


var AxelrodTournament = gameWrapper(function(players, parameters = {}) {
	var { generatePlayers = true, repeats = 5, gameLength = 200 } = parameters;

	// Either create an entire population
	if (generatePlayers) {
		// Get two sets of players. The second is so players can play themselves
		players = generatePopulation();
		var copies = generatePopulation();
		parameters.copies = copies;
	}

	// or use the supplied players
	else if (players) {
		// do nothing
	} else {
		// or use the players already present
		players = Population().onlyAlive().onlyAvailable();
	}

	// assign parameters and generate the game
	parameters.initializePlayers = players;
	var iteration = roundRobin(players, prisonerDilemma(gameLength), parameters);

	return Loop(iteration, repeats, { id: "Axelrod-Tournament" });
});



module.exports = AxelrodTournament;

},{"../lib/engine":6,"./iterated-prisoner-dilemma":78,"./round-robin":84}],75:[function(require,module,exports){
"use strict";

// NashJS engine components
var Engine = require("../lib/engine")

// User data
var { Population } = Engine.Frontend

// Playables
var { Lambda, Simultaneous, Sequence, Loop } = Engine.Frontend.Playables;

// Helper functions
var { isFunction } = Engine.Backend.HelperFunctions("general");


//Cultural evolution
//
// TODO: add instructions here
function CulturalEvolution(gameGenerator, numLoops = 1, {
	id = "CulturalEvolution",
	gameProbability = .25,
	pairProbability = .25,
	generatePopulation = null,
	loop = true
} = {}) {

	if (loop && isNaN(numLoops)) throw new Error("CulturalEvolution argument 'numLoops must be a number");
	if (!isFunction(gameGenerator)) throw new Error(
		"CulturalEvolution argument 'gameGenerator' must be a function");
	if (isNaN(gameProbability) || gameProbability < 0 || gameProbability > 1) throw new Error(
		"CulturalEvolution argument 'gameProbability' must be between 0 and 1");
	if (isNaN(pairProbability) || pairProbability < 0 || pairProbability > 1) throw new Error(
		"CulturalEvolution argument 'pairProbability' must be between 0 and 1");

	// Generate population if user wants us to.
	if (isFunction(generatePopulation)) generatePopulation();

	//Reset the scores each round.
	var ResetScores = Lambda(function() {
		Population().onlyAlive().resetScores();
	});

	// Calculate number of matches
	var n = Math.floor(Population().onlyAlive().length * gameProbability);

	// Create matches.
	var matches = [...Array(n)]
	for (var i = 0; i < n; i++) {
		matches[i] = gameGenerator();
		if (!matches[i].play) throw new Error("CulturalEvolution argument 'gameGenerator' must return a Playable");
	}

	//Run all matches simultaneously
	var Round = Simultaneous(matches);

	//Calculate number of pairings
	var n = Math.floor(Population().onlyAlive().length * pairProbability)

	//Create pairings
	var pairings = [...Array(n)];
	for (i = 0; i < n; i++) {

		pairings[i] = Lambda(function() {

			//Find some available players
			var pool = Population().onlyAlive().onlyAvailable();
			var p1 = pool[Math.floor(Math.random() * pool.length)];
			var p2 = pool[Math.floor(Math.random() * pool.length)];

			//Mark them busy
			p1.busy();
			p2.busy();

			// Assign strategy of player with higher score
			if (p1.score() > p2.score()) p2.assign(p1.strategy());
			else if (p1.score() == p2.score()) null;
			else p1.assign(p2.strategy());

			//Return value of player ids, so the log makes some sense.
			return [p1.id(), p2.id()];
		});
	}

	// Run pairings simultaneously
	var Pairing = Simultaneous(pairings);

	// After pairings, mark all players as available.
	var ReleasePlayers = Lambda(function() {
		Population().onlyAlive().release();
	});

	// Define the game.
	Round(ResetScores);
	Pairing(Round);
	ReleasePlayers(Pairing);
	var Iteration = Sequence(ResetScores, ReleasePlayers);

	// User can set loop parameter to false, to avoid wrapping this in a loop.
	if (loop)
		var CE = Loop(Iteration, numLoops, { playableParameters: { initializePlayers: true } });
	else
		var CE = Iteration;

	return CE;
}


module.exports = CulturalEvolution;

},{"../lib/engine":6}],76:[function(require,module,exports){
"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

// NashJS engine components
var Engine = require("../lib/engine")

// Nash engine components
var { Sequence, Lambda } = Engine.Frontend.Playables;

// Game state
var { registry } = Engine.Backend.State

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// We'll need the 'balance-sheet' plugin
var PluginManager = Engine.Backend.PluginManager;

function invertTerms(termsOfTrade) {
	var inverse = {}
	Object.entries(termsOfTrade).forEach(function(term) {
		if (term[0] == "borrow") {
			inverse.lend = term[1]
		} else if (term[0] == "lend") {
			inverse.borrow = term[1]
		} else {
			inverse[term[0]] = term[1] * -1
		}
	});
	return inverse;
}

// termsOfTrade should be an object reflecting the outcomes for player 1.
// Example {apple:2, orange:-2}. To borrow or lend, create a sub-object describing the loan terms.
// eg {apple:2, borrow:{IOU:5}}, or {couch:-10, lend:{'credit card':50}}
var Exchange = gameWrapper(function(players, termsOfTrade = {}, parameters = {}) {
	var { utilityFunctions, utilityMode = "absolute", initialEndowment = [{}, {}] } = parameters //utilityFunctions should be an array of 2 functions, which take a results object and return a change in utility
	parameters.id = "Exchange" || parameters.id;




	// To play this game, players will need a balance sheet. This plugin will add balance sheets to the players,
	// as well as ensure that new players are created with one, and that they are re-initialized properly.
	var balanceSheet = PluginManager.package("balance-sheet-complex").require(players);
	balanceSheet.settings({ cleanZeros: false })

	var p1 = registry.players[players[0].id()];
	var p2 = registry.players[players[1].id()];

	// Do initial endowments if there are any. Format same as for terms of trade.
	initialEndowment.forEach(function(endowment, index) {
		var player = players[index]
		var invertPlayer = players[Number(!index)]
		Object.entries(endowment).forEach(function(term) {
			if (term[0] == "borrow") {
				var loanTerms = Object.entries(term[1])[0]
				new balanceSheet.FinancialClaim(invertPlayer, player, loanTerms[1], loanTerms[0])
			} else if (term[0] == "lend") {
				var loanTerms = Object.entries(term[1])[0]
				new balanceSheet.FinancialClaim(player, invertPlayer, loanTerms[1], loanTerms[0])
			} else {
				new balanceSheet.RealClaim(player, term[0], term[1])
			}
		})
	})

	// The actual playable
	var Decision = TwoPlayerNormal(players, [
		["Accept", "Reject"],
		["Accept", "Reject"]
	], null, {
		id: "Decision",
		informationFilter: function(info) { //TODO might need to wrap user-supplied informationFilter?
			info.termsOfTrade = {
				[p1.id]: termsOfTrade,
				[p2.id]: invertTerms(termsOfTrade)
			}
			return info;
		}
	})

	// Distribute the goods
	var Distribute = Lambda(function() {

		var results = [];

		Object.entries(termsOfTrade).forEach(function(term) {
			if (term[0] == "borrow") {
				var loanTerms = Object.entries(term[1])[0]
				var loan = new balanceSheet.FinancialClaim(p2.interface, p1.interface, loanTerms[1], loanTerms[0])

				results.push({
					player: p1.id,
					borrow: {
						[loanTerms[0]]: loanTerms[1]
					}
				});

				results.push({
					player: p2.id,
					lend: {
						[p1.id]: {
							[loanTerms[0]]: loanTerms[1]
						}
					}
				});

			} else if (term[0] == "lend") {
				var loanTerms = Object.entries(term[1])[0]
				var loan = new balanceSheet.FinancialClaim(p1.interface, p2.interface, loanTerms[1], loanTerms[0])

				results.push({
					player: p2.id,
					borrow: {
						[loanTerms[0]]: loanTerms[1]
					}
				});

				results.push({
					player: p1.id,
					lend: {
						[p2.id]: {
							[loanTerms[0]]: loanTerms[1]
						}
					}
				});

			} else {
				var good = new balanceSheet.RealClaim(p1.interface, term[0], 0)
				good.transfer(p2.interface, term[1] * -1)

				results.push({ player: p1.id, [term[0]]: term[1] });
				results.push({ player: p2.id, [term[0]]: -1 * term[1] });
			}
		});


		if (utilityFunctions) {

			p1.score = utilityMode.toLowerCase() == "relative" ? p1.score + utilityFunctions[0](results) :
				utilityFunctions[0](results)
			p2.score = utilityMode.toLowerCase() == "relative" ? p2.score + utilityFunctions[1](results) :
				utilityFunctions[1](results)
		}

		return results;
	}, { id: "Distribution" });

	//But only do it if the trade goes through.
	Distribute(Decision.Accept.Accept())



	return Sequence(Decision, Distribute, parameters);
}, {
	argumentValidator(players, termsOfTrade) {
		// TODO: validate parameters
		return true;
	}

});

module.exports = Exchange;

},{"../lib/engine":6,"./simple-normal":85}],77:[function(require,module,exports){
var StockGames = {
	//Game skeletons
	"Two-Player Normal": require("./simple-normal").TwoPlayerNormal,
	"Normal": require("./simple-normal").Normal,
	"Simple Zero-Sum": require("./simple-zero-sum"),

	// Classic games
	"Matching Pennies": require("./matching-pennies"),
	"Prisoner's Dilemma": require("./prisoner-dilemma"),
	"Rock-Paper-Scissors": require("./rock-paper-scissors"),

	// Iterated games
	"Iterated": require("./iterated"),
	"Iterated Prisoner's Dilemma": require("./iterated-prisoner-dilemma"),

	// Evolutionary games
	"Cultural Evolution": require("./cultural-evolution"),

	//Tournaments
	"Round Robin": require("./round-robin"),
	"Axelrod Tournament": require("./axelrod-tournament"),

	// Probability Theory
	"Monty Hall": require("./monty-hall"),

	//Neoclassical economics
	"Exchange": require("./exchange-complex")
};

module.exports = StockGames;

},{"./axelrod-tournament":74,"./cultural-evolution":75,"./exchange-complex":76,"./iterated":79,"./iterated-prisoner-dilemma":78,"./matching-pennies":80,"./monty-hall":81,"./prisoner-dilemma":82,"./rock-paper-scissors":83,"./round-robin":84,"./simple-normal":85,"./simple-zero-sum":86}],78:[function(require,module,exports){
"use strict";

// Base game
var prisonerDilemma = require("./prisoner-dilemma").createGenerator();

// NashJS engine components
var Engine = require("../lib/engine")

// game engine
var { Loop } = Engine.Frontend.Playables;

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Game utility
var Iterated = require("./iterated")



var IteratedPrisonerDilemma = gameWrapper(function(players, numberIterations = 50, parameters = {}) {
	return Iterated(players, prisonerDilemma, "Prisoner-Dilemma", numberIterations, parameters)
}, {
	strategyLoader() {
		return [{
			strategy: function titForTat() {
				this.choose = function(choices, information) {
					if (information.opponent.history.length) return information.opponent.history[information.opponent
							.history.length - 1]
						.result
					else return "Cooperate";
				}
			},
			name: "Tit-For-Tat"
		}]
	}
});
// TODO validate arguments

module.exports = IteratedPrisonerDilemma

},{"../lib/engine":6,"./iterated":79,"./prisoner-dilemma":82}],79:[function(require,module,exports){
"use strict";

// NashJS engine components
var Engine = require("../lib/engine")

// game engine
var { Loop } = Engine.Frontend.Playables;

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")


var Iterated = gameWrapper(function(players, gameGenerator, gameName, numberIterations = 50, parameters = {}) {

	var { parameters: gameParameters = {} } = parameters

	gameParameters.id = gameParameters.id || gameName
	parameters.id = parameters.id || "Iterated-" + gameName;

	return Loop(gameGenerator(players, gameParameters), numberIterations, parameters);
})

// TODO validate arguments

module.exports = Iterated;

},{"../lib/engine":6}],80:[function(require,module,exports){
"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

// NashJS engine components
var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Play-time logic
var { Expression } = Engine.Frontend


var MatchingPennies = gameWrapper(function(players, payoff = 1, parameters = {}) {
	parameters.id = parameters.id || "Matching-Pennies";

	var win = payoff;
	var lose = Expression(function() {
		return -payoff;
	});

	var choices = [
		["Heads", "Tails"],
		["Heads", "Tails"]
	];

	var payoffs = [
		[win, lose],
		[lose, win]
	];

	return SimpleZeroSum(players, choices, payoffs, parameters);
});

// Matching Pennies
module.exports = MatchingPennies;

},{"../lib/engine":6,"./simple-zero-sum":86}],81:[function(require,module,exports){
"use strict"

// NashJS engine components
var Engine = require("../lib/engine");

// Playables
var { Choice, Lambda } = Engine.Frontend.Playables;

// logic
var { Variable, ComplexVariable } = Engine.Frontend

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");


var MontyHall = gameWrapper(function(player, parameters = {}) {
	parameters.id = parameters.id || "Monty-Hall"
	var numDoors = parameters.numDoors || 3;
	var numPrizes = parameters.numPrizes || 1;
	var numReveals = parameters.numReveals || 1;
	var prize = parameters.prize || 5;

	// Allow array or single player
	if (Array.isArray(player)) player = player[0]

	//Generate list of doors
	var doors = [];
	for (var i = 0; i < numDoors; i++) {
		doors.push("Door " + i.toString())
	}

	var Choose = Choice(player, doors, { id: "Choose" });


	var prizes
	var scores = Array.apply(null, Array(doors.length)).map(function() {
		return Variable(0)
	})

	//Need to set this here in order for scoring to work
	var doors2 = ComplexVariable(doors.slice());

	var Reveal = Lambda(function({ history }) {

		// Re-initialize payoffs.
		prizes = []
		for (var i = 0; i < scores.length; i++) {
			scores[i].set(0)
		}

		// What door did the player open?
		var playerChoice = history.log.query("$[choice='" + Choose.id() + "'][-1]").result // TODO does this work?

		// Select which doors have prizes
		var revealFrom = doors.slice(); // Copy the doors list
		for (var i = 0; i < numPrizes; i++) {
			var prizeIndex = Math.floor(Math.random() * revealFrom.length) // Select a door from the doors copy
			prizes.push(revealFrom[prizeIndex]) // Add the prize to the lists
			scores[prizeIndex].set(prize) // Set payoffs appropriately
			revealFrom.splice(prizeIndex, 1) // Remove the prized door from the doors copy, so that we don't select it more than once
		}

		//Remove player choice from doors copy
		var playerChoiceIndex = revealFrom.indexOf(playerChoice)
		if (playerChoiceIndex > -1) revealFrom.splice(playerChoiceIndex, 1)

		// Choose doors to reveal
		var reveal = [];
		for (var i = 0; i < numReveals; i++) {
			reveal.push(revealFrom[Math.floor(Math.random()) * revealFrom.length])
		}

		// Copy doors list to send onward, then remove the revealed doors from list
		doors2.set(doors.slice()); // Need to set this here so revealing to work
		for (var i = 0; i < reveal.length; i++) {
			let index = doors2.indexOf(reveal[i])
			doors2().splice(index, 1)
		}

		return reveal.length == 1 ? reveal[0] : reveal;
	}, { id: "Reveal" })

	var SecondChoice = Choice(player, doors2, { id: "Stay-or-Switch", usePayoffs: true });
	SecondChoice.setAllPayoffs(scores)

	Reveal(Choose)
	SecondChoice(Reveal)

	return Sequence(Choose, SecondChoice, parameters);
}, {

	strategyLoader() {
		return [{
				name: "alwaysSwitch",

				strategy: function alwaysSwitch() {

					this.door = null;

					this.choose = function(options, information) {
						var choice
						if (this.door) {
							options.splice(options.indexOf(this.door), 1)
							this.door = null;
							choice = options[Math.floor(Math.random() * options.length)]
						} else {
							choice = options[Math.floor(Math.random() * options.length)]
							this.door = choice
						}

						return choice
					}
				}
			},
			{
				name: "alwaysStay",
				strategy: function alwaysStay() {
					this.door = null;

					//TODO add strategy description feature
					this.choose = function(options, information) {
						var choice
						if (this.door) {
							choice = this.door
							this.door = null;

						} else {
							choice = options[Math.floor(Math.random() * options.length)]
							this.door = choice
						}

						return choice
					}
				}
			}
		]
	}
})

module.exports = MontyHall

},{"../lib/engine":6}],82:[function(require,module,exports){
"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

//NashJS engine components
var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");

// play-time logic
var { Variable, Expression } = Engine.Frontend;


var prisonerDilemma = gameWrapper(function(players, {
	id = "Prisoner-Dilemma",
	payoffScale = Variable(1),
	payoffSpread = Variable(4)
} = {}) {
	//TODO: fix the case of negative scale.

	var lowerMiddle = Expression(function() {
		return payoffScale * (1 + (payoffSpread - 1) * 1 / 3);
	});
	var upperMiddle = Expression(function() {
		return payoffScale * (1 + (payoffSpread - 1) * 2 / 3);
	});
	var upper = Expression(function() {
		return payoffScale * payoffSpread;
	});

	// Pass along parameters, be sure to include id.
	var parameters = arguments[1] || {};
	parameters.id = parameters.id || id;

	var choices = [
		["Cooperate", "Defect"],
		["Cooperate", "Defect"]
	];
	var payoffs = [
		[
			[upperMiddle, upperMiddle],
			[payoffScale, upper]
		],
		[
			[upper, payoffScale],
			[lowerMiddle, lowerMiddle]
		]
	];

	return TwoPlayerNormal(players, choices, payoffs, parameters);
});


module.exports = prisonerDilemma;

},{"../lib/engine":6,"./simple-normal":85}],83:[function(require,module,exports){
"use strict";

// base game
var SimpleZeroSum = require("./simple-zero-sum");

var Engine = require("../lib/engine")

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Play-time logic
var { Expression } = Engine.Frontend


// Rock-Paper-Scissors
var RockPaperScissors = gameWrapper(function(players, payoff = 1, parameters = {}) {
	parameters.id = parameters.id || "Rock-Paper-Scissors";

	var win = payoff;
	var lose = Expression(function() {
		return -payoff;
	});

	var choices = [
		["Rock", "Paper", "Scissors"],
		["Rock", "Paper", "Scissors"]
	];
	var payoffs = [
		[0, lose, win],
		[win, 0, lose],
		[lose, win, 0]
	];

	return SimpleZeroSum(players, choices, payoffs, parameters);
});

module.exports = RockPaperScissors

},{"../lib/engine":6,"./simple-zero-sum":86}],84:[function(require,module,exports){
"use strict";

//NashJS Engine
var Engine = require("../lib/engine")

// helper function
var { shuffle } = Engine.Backend.HelperFunctions("general");
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// nashJS engine component
var { Sequence, Simultaneous } = Engine.Frontend.Playables;

//for information mechanics
var { Information, History, PlayerList } = Engine.Backend.Classes;


// gameGenerator should be a function whose first argument is an array of players
var RoundRobin = gameWrapper(function(players, gameGenerator, parameters = {}) {
	parameters.id = parameters.id || "Round-Robin";
	parameters.initializePlayers = parameters.initializePlayers && true;

	// Create array of each combination of players
	var matches = [];

	players.forEach(function(player1, index1) {
		for (var index2 = 0; index2 < index1; index2++) {
			matches.push([players[index2], player1]);
		}

		// optional parameter 'copies.' Pass an extra copy of each player, to play themselves
		if (parameters.copies) matches.push([parameters.copies[index1], player1]);
	});

	//randomize the order
	shuffle(matches);

	// Track scores
	var scoresRecord = [];

	//
	var addRound = function(players, parameters = {}) {
		// information mechanics and other parameters
		var population = new PlayerList(players).generator
		parameters.compartmentalize = { population }
		parameters.initializePlayers = population;

		// generate round
		var round = gameGenerator(players, parameters);

		// track the scores
		var recordScores = Lambda(function() {
			var score = {}
			for (let [strategy, scores] of Object.entries(population().scoresByStrategy())) {
				if (Array.isArray(scores)) {
					if (scores.length == 1) scores = scores[0]
					score[strategy] = scores;
				}
			}
			scoresRecord.push(score);
			console.log("recording scores")
			//return score for history
			return score;
		}, { id: "Record-Scores" });

		//Chain together
		recordScores(round);

		// return both
		return [round, recordScores
			// ,Sequence(round, recordScores) // Uncomment for Simultaneous implementation
		];
	};



	// Sequential implementation
	// load the first match manually
	var [firstRound, firstRecord] = addRound(
		matches.shift(),
		parameters.parameters
	);

	//then load subsequent matches
	var record = firstRecord;
	var lastRecord, lastRound;

	matches.forEach(function(match) {
		[lastRound, lastRecord] = addRound(match, parameters.parameters);

		lastRound(record);
		record = lastRecord;
	});


	return Sequence(firstRound, lastRecord, parameters);

	/* // Simultaneous implementation
	var rounds = [];
	matches.forEach(function(match) {
	  rounds.push(addRound(match, parameters.gameParameters)[2]);
	});

	return Simultaneous(rounds, parameters); */
});

module.exports = RoundRobin;

},{"../lib/engine":6}],85:[function(require,module,exports){
"use strict";

//Game engine
var Engine = require("../lib/engine")

//Helper functions
var { isFunction } = Engine.Backend.HelperFunctions("general")
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// Playables
var { Choice, Turn } = Engine.Frontend.Playables;

//Play-time Logic
var { RandomVariable } = Engine.Frontend

var Normal = gameWrapper(function(players, choiceLists, payoffs = null, parameters = {}) {

		//propogate the information filter
		parameters.parameters ? parameters.parameters.informationFilter = parameters.informationFilter :
			parameters.parameters = { informationFilter: parameters.informationFilter }

		// construct the choices
		var choices = choiceLists.map(function(list, index) {
			return Choice(players[index], list, parameters.parameters);
		});

		var game = Turn(choices, parameters);

		if (payoffs) game.setAllPayoffs(payoffs);

		return game;
	}, {
		strategyLoader: function() {
			return [{
					strategy: function chooseFirst() {
						this.choose = function(choices, information) {
							return choices[0]
						}
					},
					name: "chooseFirst"
				},

				{
					strategy: function chooseSecond() {
						this.choose = function(choices, information) {
							return choices[1]
						}
					},
					name: "chooseSecond"
				},

				{
					strategy: function randomize(choices = [0, 1]) {
						// Creating a map will make picking a random value easier
						choices = choices.map(function(item, index) {
							return [index, item]
						});
						var choiceMap = new Map(choices)

						this.choose = function(choices, information) {
							return choices[choiceMap.get(Math.floor(Math.random() * choiceMap.size))];
						}
					},
					name: "randomize"
				}
			];
		}
	} // 										TODO: validate all arguments
);


var TwoPlayerNormal = gameWrapper(function(players, choices, payoffs = null, parameters = {}) {

	// Information mechanics.. There are only two players, so we can have a 'me' and 'opponent' entry.
	// If user supplied an information filter, wrap that filter in ours.
	var { informationFilter } = parameters;
	if (!isFunction(informationFilter)) informationFilter = null;

	// Wrap the user's filter
	var wrappedFilter = function(information) {
		// Figure out who I am and who the opponent is
		var me = information.me.id
		var players = [information.turn.choices[0].choice.player, information.turn.choices[1].choice.player]
		var opponent = players.splice(players.indexOf(me), 1) && players[0];

		// add entry for opponent
		var opponentDetail = information.population.filter(function(player) {
			return (player.id == opponent)
		})[0];
		information.opponent = opponentDetail;

		// run the user's information filter
		if (informationFilter) information = informationFilter(information);

		return information;
	}

	// Pass the information filter
	parameters.informationFilter = wrappedFilter

	return Normal(players, choices, payoffs, parameters)
}); //				 																												TODO: may want to validate arguments here too



module.exports = { TwoPlayerNormal, Normal };

},{"../lib/engine":6}],86:[function(require,module,exports){
"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

// NashJS components
var Engine = require("../lib/engine")

// Game state controller
var { registry } = Engine.Backend.State
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games");

// Play-time logic
var { Variable, Expression } = Engine.Frontend;

/* beautify preserve:start */
var SimpleZeroSum = gameWrapper(function(players, choices, payoffs = [[0, 0],	[0, 0]], parameters={}) {
/* beautify preserve:end */

	var game = TwoPlayerNormal(players, choices, null, parameters)

	var e;

	choices[0].forEach(function(choice0, index0) {
		choices[1].forEach(function(choice1, index1) {

			// Set expression
			e = Expression(function() {
				//Return the negative payoff, or zero
				return (0 - registry.turns[game.id()].payoffsImplicit[choice0][choice1][0] || 0);
			});

			//Set payoffs
			game[choice0][choice1]([payoffs[index0][index1], e]);
		});
	});

	return game;
}); //					TODO: validate arguments



module.exports = SimpleZeroSum;

},{"../lib/engine":6,"./simple-normal":85}]},{},[5])