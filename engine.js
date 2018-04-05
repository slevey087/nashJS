"use strict";

//Replace this with Winston later
function log(level, message) {
	console.log(level, message);
}

log('verbose', 'Starting NashJS');

var registry = {
	'players': {},
	'choices': {},
	'turns': {},
	'strategies': {},
	'playables': {},
	'loops': {},
	'sLoops': {}
}

var idCounters = {
	'player': 0,
	'choice': 0,
	'turn': 0,
	'strategy': 0,
	'loop': 0,
	'stochasticLoop': 0
};

var gameHistory = []; //TODO: make this work

var helperFunctions = {
	turn: {},
	playable: {},
	general: {}
};




//Backend for Player
function _Player(id, parameters) {
	log('debug', 'Creating interal player object.');

	this.id = id
	this.score = 0
	this.name = parameters.name || "";

	registry.players[id] = this;
}

//Assign strategy to player
_Player.prototype.assign = function(strategy) {

	//TODO: very strategy type

	this.strategy = new registry.strategies[strategy];
	this.strategy._id = strategy
};

//Call strategy to make a choice
_Player.prototype.choose = function(options, information = {}) { //TODO: check that there's a strategy assigned before trying to play
	var player = this;
	return new Promise(function(resolve, reject) { resolve(player.strategy.choose(options, information).toString()); });
};



//Frontend for Player
function Player(parameters = {}) {
	var id = idHandler(parameters.id, "player");

	//Create backend player object
	var _player = new _Player(id, parameters);


	//Return this reference object to the user
	var player = function() {}; //Probably add functionality here

	player.id = function() { return id; };

	player.score = function() {
		return registry.players[id].score;
	};

	player.assign = function(strategy) {
		_player.assign(strategy);
	};

	return player
}



//_playable class, superclass for objects which can execute game steps (choice, turn, game)
function _Playable(id) {
	this.id = id;
	this.next = {};
	registry.playables[id] = this;
};

_Playable.prototype.play = function() {

};


// Generates the function that gets returned when a Playable is called, which can then be called to chain playables together.
helperFunctions.playable.chainerGenerator = function(externalObj, internalObj) {
	return function(source) {
		var previousPlayable, path;

		//TODO: verify that source is the right type

		return SynchronousPromise.all([function() {
			if (source instanceof Promise) {
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
				helperFunctions.playable.outcomeTreeGetValue(previousPlayable.next, path).push(internalObj);
			}
			//previousPlayable.next[selected].push(_choice);

			return SynchronousPromise.resolve({
				playable: externalObj,
				path: "all"
			});
		});
	};
};


//Use to set every value of an outcome tree
helperFunctions.playable.outcomeTreeAddAll = function(tree, value) {

	//If it's an array, then we're already done.
	if (Array.isArray(tree)) tree.push(value);

	var recurse = function(obj, val) {
		for (keys in obj) {

			//If no keys left to traverse, then assign value. If not, recurse.
			if (obj[keys].constructor === Array) obj[keys].push(value)
			else recurse(obj[keys], value)

		}
	};
	recurse(tree, value);
};

//Traverse an outcome tree to obtain the value for a desired key-set
//Argument one is a nested object, while argument 2 is an array of keys for the object, 1 layer at a time.
helperFunctions.playable.outcomeTreeGetValue = function(tree, selector) {

	//Find the next item in the chain associated with the resultant outcome
	for (var i = 0, len = selector.length; i < len; i++) {
		tree = tree[selector[i]];
	}

	return tree;
}


//Traverse an outcome tree to set the value for a desired key-set
//Argument one is a nested object, while argument 2 is an array of keys for the object, 1 layer at a time.
helperFunctions.playable.outcomeTreeSetValue = function(tree, selector, value) {

	//Find the next item in the chain associated with the resultant outcome
	for (var i = 0, len = selector.length - 1; i < len; i++) {
		console.log(tree, selector, i);
		tree = tree[selector[i]];
	}

	return tree[selector[i]] = value;
}


_Playable.prototype.addNext = function(nextPlayable) {
	helperFunctions.playable.outcomeTreeAddAll(this.next, nextPlayable);
};


_Playable.prototype.toNext = function() {

};




//Backend function class for Choice
function _Choice(id, player, options, parameters = {}) {
	_Playable.call(this, id);

	this.player = registry.players[player.id()];
	this.options = options;
	this.defaultOption = parameters.defaultOption || options[0]; //TODO: make defaultOption functional
	registry.choices[id] = this;

	var that = this;
	this.options.forEach(function(item) {
		that.next[item] = [];
	});
}

_Choice.prototype = Object.create(_Playable.prototype);


_Choice.prototype.play = function({ initializePlayers = false, usePayoffs = false, shortCircuit = false } = {}) {

	var choice = this;

	return Promise.resolve().then(function() {
		if (initializePlayers) return reinitializePlayers();
		return Promise.resolve();
	}).then(function(result) {
		return choice.player.choose(choice.options);
	}).then(function(result) {

		//This will probably only happen if it's a single-player game, otherwise we'll use playoffs defined in a Turn
		if (usePayoffs) {
			choice.player.score += choice.payoffs[result];
			console.log(choice.id, choice.player.id, result, choice.player.score);
		}

		gameHistory.push({
			player: choice.player.id,
			move: result //TODO: add a 'scores' entry with all the game's current scores
		});

		return Promise.resolve(result) //TODO: add information mechanisms
	}).then(function(result) {

		//Short-circuit parameter used if game is defined by higher-order playables such as Turn. That unit will decide what to do next.
		if (shortCircuit) return Promise.resolve(result)

		//If there is a next branch, play it.
		if (choice.next[result][0] instanceof _Playable) return Promise.all(choice.next[result].map(function(
			item) { return item.play(); }));

		//If no branch, we're done.
		return Promise.resolve(result)
	});
};



function Choice(player, options, parameters = {}) {
	var id = helperFunctions.general.idHandler(parameters.id, "choice")

	//Create backend choice object
	var _choice = new _Choice(id, player, options, parameters);

	//Return this reference object to the user. Run the function to select a source
	var choice = helperFunctions.playable.chainerGenerator(choice, _choice);


	choice.id = function() { return id; };
	choice.path = "all";

	//Interface to specify single-player payoffs in single-player/single-choice games
	_choice.payoffs = {};


	options.forEach(function(option) {
		_choice.payoffs[option] = 0; //Start payoffs at zero

		choice[option] = function(payoff) { //Create functions for user to assign payoffs
			if (!isNaN(payoff)) _choice.payoffs[option] = payoff;
			return Promise.resolve({
				playable: choice,
				path: [option]
			})
		};
	});

	//Function to set all payoffs at once
	choice.setAllPayoffs = function(payoffs) {
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};


	//Way for user to interact with payoffs
	choice.payoffs = function() { return registry.choices[id].payoffs; };

	choice.play = function({ initializePlayers = false, usePayoffs = true, shortCircuit = false } = {}) {
		return Promise.resolve().then(function(result) { return _choice.play(parameters); });
	};

	return choice;
}




//Backend function class for Turn

function _Turn(id, choices, parameters = {}) {
	_Playable.call(this, id);

	this.payoffs = {};
	this.next = {};

	this.choices = choices.map(function(choice) {
		return registry.choices[choice.id()];
	});;

	registry.turns[id] = this;

	var turn = this;

	this.choiceMap = this.choices.map(function(item) {
		return item.options;
	});


	helperFunctions.turn.recurse(turn.choiceMap, turn.payoffs, 0).then(function(result) {
		log("silly", "Added 0 payoffs to turn.");
		return helperFunctions.turn.recurse(turn.choiceMap, turn.next, []);
	}).then(function(result) {
		log("silly", "Added blank next map to turn.");
		return Promise.resolve(result);
	}).catch();
}


//Recurse through the options in the choices.
helperFunctions.turn.recurse = function recurse(input, output, val, path = []) {
	return SynchronousPromise.resolve(path).then(function(path) {

		//Since we slice the array each time, if there are no more entries left then we're done with this branch.
		if (input.length == 0) return SynchronousPromise.resolve(path)


		//Among all values from the array
		console.log(input[0].length)
		return SynchronousPromise.all(input[0].map(function(item) {
			var value;
			var splitPath = path.slice(0).concat(item);
			//console.log(input, item, path);

			//If there are more items to iterate over, include them in the output then recurse.
			//If not, put in the new value.
			if (input.length == 1) {

				//If val is a function, wrap it in a function that will get supplied an argument with where we are
				if (typeof val == "function") {
					value = function() {
						var args = [splitPath].concat(Array.prototype.slice.call(arguments));
						return val.apply(null, args);
					};
				} else value = val;

				output[item] = value;
			} else output[item] = {};

			console.log(input, input.slice(1), item, path, splitPath);
			return recurse(input.slice(1), output[item], val, splitPath);
		}));
	});
};


_Turn.prototype = Object.create(_Playable.prototype);


_Turn.prototype.play = function({ usePayoffs = true, initializePlayers = false, shortCircuit = false } = {}) {

	var turn = this;

	return Promise.all(turn.choices.map(function(choice) {

		return choice.play({ shortCircuit: true }).then(function(result) {

			/*
			//Update game history after each move
			gameHistory.push({
				player:choice.player.id,
				move:result						//TODO: add a 'scores' entry with all the game's current scores
			});
			*/

			return Promise.resolve(result);
		});

	})).then(function(result) {

		if (usePayoffs) {
			var payoffs = helperFunctions.playable.outcomeTreeGetValue(turn.payoffs, result);

			for (var player in payoffs) {
				registry.players[player].score += payoffs[player];
			}
		}


		return Promise.resolve(result) //TODO: add information mechanisms
	}).then(function(result) {

		//Short-circuit logic allows higher-order playable (such as Game or Loop) to figure out what to do next.
		if (shortCircuit) return Promise.resolve(result);

		//Find out where to go next.
		var outcomeValue = helperFunctions.playable.outcomeTreeGetValue(turn.next, result);

		//If there's somewhere to go, then go.
		if (outcomeValue[0] instanceof _Playable) return Promise.all(outcomeValue.map(function(playable) {
			return playable
				.play();
		}));

		return Promise.resolve(result);
	});
};



function Turn(choices, parameters = {}) {
	var id = helperFunctions.general.idHandler(parameters.id, "turn")


	//Create backend choice object
	var _turn = new _Turn(id, choices, parameters);


	//Return this reference object to the user. Run the function to select a source
	var turn = helperFunctions.playable.chainerGenerator(turn, _turn);

	turn.id = function() { return id; };
	turn.path = "all";


	//Create payoff setter/branch router functions
	helperFunctions.turn.recurse(_turn.choiceMap, turn, function(path, payoffs) {
		console.log(_turn.payoffs, path, payoffs);

		//If user supplied payoffs in array form, then translate to object based on which players are involved in the choices
		if (Array.isArray(payoffs)) {

			if (payoffs.length !== _turn.choices.length) { //If array isn't right length, then this is unintelligible.
				log("error", "Payoff array does not match Turn dimensions, cannot assign payoffs.");
				return Promise.reject(new Error("Payoff array is not correct length"))
			}

			var originalPayoffs = payoffs.slice();
			payoffs = {};

			originalPayoffs.forEach(function(payoff, index) {
				payoffs[_turn.choices[index].player.id] = payoff;
			});
		}

		if (helperFunctions.general.isObject(payoffs)) {
			helperFunctions.playable.outcomeTreeSetValue(_turn.payoffs, path, payoffs);
		}


		return Promise.resolve({
			playable: turn,
			'path': path
		});
	});


	//Function to set all payoffs at once
	turn.setAllPayoffs = function(payoffs) {
		//TODO: make this work. Include error handling if array given isn't expected dimensions.
	};


	//Way for user to interact with payoffs
	turn.payoffs = function() { return Object.assign({}, registry.turns[id].payoffs); };

	turn.play = function() {
		return new Promise(function(resolve, reject) { resolve(_turn.play()); });
	};

	return turn;
}




//Backend function class for Loop

function _Loop(id, playable, count, parameters = {}) {
	_Playable.call(this, id);

	this.next = [];
	this.playable = registry.playables[playable.id()];
	this.count = count;

	registry.loops[id] = this;
}


_Loop.prototype = Object.create(_Playable.prototype);


_Loop.prototype.play = function({ initializePlayers = false, shortCircuit = false } = {}) {

	var loop = this;

	var promise = Promise.resolve()

	var action = function(result) {
		return loop.playable.play({ shortCircuit: true }).then(function(result) {

				/*
				//Update game history after each move
				gameHistory.push({
					player:choice.player.id,
					move:result						//TODO: add a 'scores' entry with all the game's current scores
				});
				*/
				return Promise.resolve(result);
			})
			.then(function(result) {

				//TODO: add information mechanisms

				return Promise.resolve(result)
			});
	};

	//Repeat the playable loop.count times, by chaining promises.
	for (var i = 0; i < loop.count; i++) {

		promise = promise.then(action);
	}


	return promise.then(function(result) {

		//Short-circuit logic allows higher-order playable (such as Game) to figure out what to do next.
		if (shortCircuit) return Promise.resolve(result);


		//If there's somewhere to go, then go.
		if (loop.next[0] instanceof _Playable) return Promise.all(loop.next.map(function(playable) {
			return playable
				.play();
		}));

		//Otherwise, we're done here.
		return Promise.resolve(result);
	});
};



function Loop(playable, count = 1, parameters = {}) {
	var id = helperFunctions.general.idHandler(parameters.id, "loop")


	//Create backend loop object
	var _loop = new _Loop(id, playable, count, parameters);


	//Return this reference object to the user. Run the function to select a source
	var loop = helperFunctions.playable.chainerGenerator(loop, _loop);

	loop.id = function() { return id; };
	loop.path = "all";

	loop.play = function() {
		return Promise.resolve().then(function(result) { return _loop.play(); });
	};

	return loop;
}




//Backend function class for StochasticLoop

function _SLoop(id, playable, probability, parameters = {}) {
	_Playable.call(this, id);

	this.next = [];
	this.playable = registry.playables[playable.id()];
	this.probability = probability;
	this.generator = Math.random; //TODO: allow user to specify random number generator

	registry.sLoops[id] = this;
}


_SLoop.prototype = Object.create(_Playable.prototype);


_SLoop.prototype.play = function({ initializePlayers = false, shortCircuit = false } = {}) {

	var sLoop = this;

	var promise = Promise.resolve()

	//Section that will be looped
	var action = function(result) {
		return sLoop.playable.play({ shortCircuit: true }).then(function(result) {

				/*
				//Update game history after each move
				gameHistory.push({
					player:choice.player.id,
					move:result						//TODO: add a 'scores' entry with all the game's current scores
				});
				*/

				return Promise.resolve(result);
			})
			.then(function(result) {

				//TODO: add information mechanisms

				return Promise.resolve(result)
			});
	};


	//Generate random numbers, repeat while number is above halting probability
	while (sLoop.generator() > sLoop.probability) {
		promise = promise.then(action);
	}


	return promise.then(function(result) {

		//Short-circuit logic allows higher-order playable (such as Game) to figure out what to do next.
		if (shortCircuit) return Promise.resolve(result);

		//If there's somewhere to go, then go.
		if (sLoop.next[0] instanceof _Playable) return Promise.all(sLoop.next.map(function(playable) {
			return playable
				.play();
		}));

		//Otherwise, we're done here.
		return Promise.resolve(result);
	});
};



function StochasticLoop(playable, probability = .5, parameters = {}) {
	var id = helperFunctions.general.idHandler(parameters.id, "stochasticLoop")

	if (isNaN(probability) || probability < 0 || probability > 1) throw new Error('Invalid probability');

	//Create backend sLoop object
	var _sLoop = new _SLoop(id, playable, probability, parameters);


	//Return this reference object to the user. Run the function to select a source
	var sLoop = helperFunctions.playable.chainerGenerator(sLoop, _sLoop);

	sLoop.id = function() { return id; };
	sLoop.path = "all";

	sLoop.play = function() {
		return Promise.resolve().then(function(result) { return _sLoop.play(); });
	};

	return sLoop;
}




function reinitializePlayers() {
	return Promise.resolve().then(function() {
		var oldPlayer, strategy, parameters;

		//Redefine each player
		for (var player in registry.players) {

			oldPlayer = registry.players[player]
			strategy = oldPlayer.strategy._id;
			parameters = {}; //TODO: when adding player parameters, be sure they're included here

			registry.players[player] = new _Player(oldPlayer.id, parameters);

			registry.players[player].assign(strategy);
		}

		//For each choice, recreate player references
		for (var choice in registry.choices) {
			registry.choices[choice].player = registry.players[registry.choices[choice].player.id];
		}
	});

}


function registerStrategy(strategy, name, playername = "") {
	var id = helperFunctions.general.idHandler(name, "strategy");
	registry.strategies[id] = strategy;
}




function idHandler(id, type) {
	//Assign id

	var counter = idCounters[type];
	idCounters[type]++;

	if (!id) {
		return type + counter.toString();
	} else {
		//TODO: validate id and check for uniqueness
		return id
	}
}


helperFunctions.general.isObject = function(a) {
	return (!!a) && (a.constructor === Object);
};


function chooseFirstOption() {

	this.choose = function(options) {
		console.log("made it to choosing");
		return options[0];
	};
}
registerStrategy(chooseFirstOption, "chooseFirst");




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
	return obj && typeof(obj.then) === "function";
}

SynchronousPromise.prototype = {
	then: function(nextFn, catchFn) {
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
	catch: function(handler) {
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
	pause: function() {
		this._paused = true;
		return this;
	},
	resume: function() {
		var firstPaused = this._findFirstPaused();
		if (firstPaused) {
			firstPaused._paused = false;
			firstPaused._runResolutions();
			firstPaused._runRejections();
		}
		return this;
	},
	_findAncestry: function() {
		return this._continuations.reduce(function(acc, cur) {
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
	_setParent: function(parent) {
		if (this._parent) {
			throw new Error("parent already set");
		}
		this._parent = parent;
		return this;
	},
	_continueWith: function(data) {
		var firstPending = this._findFirstPending();
		if (firstPending) {
			firstPending._data = data;
			firstPending._setResolved();
		}
	},
	_findFirstPending: function() {
		return this._findFirstAncestor(function(test) {
			return test._isPending && test._isPending();
		});
	},
	_findFirstPaused: function() {
		return this._findFirstAncestor(function(test) {
			return test._paused;
		});
	},
	_findFirstAncestor: function(matching) {
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
	_failWith: function(error) {
		var firstRejected = this._findFirstPending();
		if (firstRejected) {
			firstRejected._error = error;
			firstRejected._setRejected();
		}
	},
	_takeContinuations: function() {
		return this._continuations.splice(0, this._continuations.length);
	},
	_runRejections: function() {
		if (this._paused || !this._isRejected()) {
			return;
		}
		var
			error = this._error,
			continuations = this._takeContinuations(),
			self = this;
		continuations.forEach(function(cont) {
			if (cont.catchFn) {
				var catchResult = cont.catchFn(error);
				self._handleUserFunctionResult(catchResult, cont.promise);
			} else {
				cont.promise.reject(error);
			}
		});
	},
	_runResolutions: function() {
		if (this._paused || !this._isResolved()) {
			return;
		}
		var continuations = this._takeContinuations();
		if (looksLikeAPromise(this._data)) {
			return this._handleWhenResolvedDataIsPromise(this._data);
		}
		var data = this._data;
		var self = this;
		continuations.forEach(function(cont) {
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
	_handleResolutionError: function(e, continuation) {
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
	_handleWhenResolvedDataIsPromise: function(data) {
		var self = this;
		return data.then(function(result) {
			self._data = result;
			self._runResolutions();
		}).catch(function(error) {
			self._error = error;
			self._setRejected();
			self._runRejections();
		});
	},
	_handleUserFunctionResult: function(data, nextSynchronousPromise) {
		if (looksLikeAPromise(data)) {
			this._chainPromiseData(data, nextSynchronousPromise);
		} else {
			nextSynchronousPromise.resolve(data);
		}
	},
	_chainPromiseData: function(promiseData, nextSynchronousPromise) {
		promiseData.then(function(newData) {
			nextSynchronousPromise.resolve(newData);
		}).catch(function(newError) {
			nextSynchronousPromise.reject(newError);
		});
	},
	_setResolved: function() {
		this.status = RESOLVED;
		if (!this._paused) {
			this._runResolutions();
		}
	},
	_setRejected: function() {
		this.status = REJECTED;
		if (!this._paused) {
			this._runRejections();
		}
	},
	_isPending: function() {
		return this.status === PENDING;
	},
	_isResolved: function() {
		return this.status === RESOLVED;
	},
	_isRejected: function() {
		return this.status === REJECTED;
	}
};

SynchronousPromise.resolve = function(result) {
	return new SynchronousPromise(function(resolve, reject) {
		if (looksLikeAPromise(result)) {
			result.then(function(newResult) {
				resolve(newResult);
			}).catch(function(error) {
				reject(error);
			});
		} else {
			resolve(result);
		}
	});
};

SynchronousPromise.reject = function(result) {
	return new SynchronousPromise(function(resolve, reject) {
		reject(result);
	});
};

SynchronousPromise.unresolved = function() {
	return new SynchronousPromise(function(resolve, reject) {
		this.resolve = resolve;
		this.reject = reject;
	});
};

SynchronousPromise.all = function() {
	var args = makeArrayFrom(arguments);
	if (Array.isArray(args[0])) {
		args = args[0];
	}
	if (!args.length) {
		return SynchronousPromise.resolve([]);
	}
	return new SynchronousPromise(function(resolve, reject) {
		var
			allData = [],
			numResolved = 0,
			doResolve = function() {
				if (numResolved === args.length) {
					resolve(allData);
				}
			},
			rejected = false,
			doReject = function(err) {
				if (rejected) {
					return;
				}
				rejected = true;
				reject(err);
			};
		args.forEach(function(arg, idx) {
			SynchronousPromise.resolve(arg).then(function(thisResult) {
				allData[idx] = thisResult;
				numResolved += 1;
				doResolve();
			}).catch(function(err) {
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




var p1 = Player();
var p2 = Player();
p1.assign("chooseFirst");
p2.assign("chooseFirst");
var c1 = Choice(p1, ['cooperate', 'defect']);
//c1['left'](5);
//c1['right'](2);
var c2 = Choice(p2, ['cooperate', 'defect']);
//c2['up'](1);
//c2['down'](7);
c2(c1);
var t1 = Turn([c1, c2])
t1.defect.defect([2, 2])
t1.defect.cooperate([4, 1])
t1.cooperate.defect([1, 4])
t1.cooperate.cooperate([3, 3])