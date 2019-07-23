"use strict";

var { evaluateQuery } = require("./query")

var { registry } = require("./state")

var { isObject, isFunction } = require("./helper-functions")("general");


class History extends Array {
	static get [Symbol.species]() { return Array }

	constructor(...args) {
		// if user supplies array, use that.
		if (Array.isArray(args[0])) args = args[0];

		super();

		if (args.length > 0) args.forEach(item => this.push(item));

		// Add log branch, make dependence circular (to be able to reverse climb the tree), and make it a History
		this.log = this.slice();
		this.log.tree = this;
		Object.setPrototypeOf(this.log, History.prototype)

		// Add score branch, make dependence circular, and make it a History
		this.scores = [];
		this.scores.tree = this;
		Object.setPrototypeOf(this.scores, History.prototype);

		// add empty child set
		this.children = new Set()
	}

	//To add entry
	add(entry) {
		//Add to history and to log
		this.push(entry);
		if (this.log) this.log.push(entry);

		//Cycle up the parent tree, add to each log
		if (this.parent instanceof History) {
			this.parent.log.add(entry);
		}
		if (this.tree instanceof History && this.tree.parent instanceof History) {
			this.tree.parent.log.add(entry);
		}

		return this;
	};

	//To add entry without logging (for playables that would like the tree history
	//to be structured differently than the log history.
	addNoLog(entry) {
		this.push(entry);
		return this;
	};


	addScores(entry) {
		//Add to history
		this.scores.push(entry);

		//Cycle up the parent tree, add to each log
		if (this.parent instanceof History) {
			this.parent.addScores(entry);
		}

		return this;
	};


	//A temporary History that can be merged back in later. The child and parent are linked until .orphan() is called.
	child(parent = this) {
		var h = new History();
		h.parent = parent;
		this.children.add(h)
		return h;
	};

	//Same as .child except includes prior parent history when .print() is called.
	childWithContent(parent = this) {
		var storedLog = parent.log.slice();
		var storedScores = parent.scores.slice();

		var h = new History();

		h.log.print = function () {
			History.prototype.print.call(storedLog.concat(h.log))
		}
		h.scores.print = function () {
			History.prototype.print.call(storedScores.concat(h.scores))
		}

		this.children.add(h)
		h.parent = parent;
		return h;
	};

	//Clear history
	clearHistory() {
		this.splice(0, this.length);
		if (this.log) this.log.splice(0, this.log.length);
		if (this.scores) this.scores.splice(0, this.scores.length);
		if (this.parent) {
			this.parent.children.delete(this)
			delete this.parent;
		}
	};

	//Send signal to end the game.
	end() {
		// if already stopped, then we're good
		if (!this.stop) {
			this.stop = true;
			// call method on parent and children
			if (this.parent) this.parent.end();
			this.children.forEach(child => child.end())
		}
	};

	fukuyama() {
		this.end() // just being cute
	}


	//This severs the link between the temporary history and its parent. Use this when merging composite entries.
	orphan() {
		this.parent.children.delete(this)
		delete this.parent;
		delete this.log;
		delete this.scores;
		return this;
	};

	//Help read the history in Chrome with less clutter.
	print() {
		var history = JSON.parse(JSON.stringify(this));
		history.query = History.prototype.query
		return history;
	};

	query(queryString, ...args) {
		return evaluateQuery(queryString, this, ...args)
	}
}


class UserHistory extends Array {
	static get [Symbol.species]() { return Array }

	constructor(history) {
		super()

		history.forEach(entry => this.push(JSON.parse(JSON.stringify(entry))));

		if (history.log) this.log = new UserHistory(history.log)
		if (history.scores) this.scores = new UserHistory(history.scores)

		//Attach methods from History, wrapped in a function. If those methods return a history,
		//then the function will convert that to a userHistory.
		Object.getOwnPropertyNames(History.prototype).forEach((method) => {
			if (isFunction(history[method])) {
				if (method != "constructor")
					this[method] = (function (method) {
						return function (...args) {
							var result = history[method](...args);
							if (result instanceof History) return new UserHistory(result);
							else if (isObject(result))
								return JSON.parse(JSON.stringify(result));
							else return result;
						};
					})(method);
			}
		})
	}
}

/*
//Accept a History and return one suitable for the user
function UserHistory(history) {
	var userHistory = history.map(function (entry) {
		return JSON.parse(JSON.stringify(entry));
	});
	if (history.log) {
		userHistory.log = new UserHistory(history.log)
	};
	if (history.scores) {
		userHistory.scores = new UserHistory(history.scores)
	}

	Object.setPrototypeOf(userHistory, UserHistory.prototype);

	//Attach methods from History, wrapped in a function. If those methods return a history,
	//then the function will convert that to a userHistory.
	for (var method in History.prototype) {
		if (isFunction(history[method])) {
			if (method != "constructor")
				userHistory[method] = (function (method) {
					return function () {
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
*/

var gameHistory = new History();

var userGameHistory = function () {
	return new UserHistory(gameHistory)
}

module.exports = { History, UserHistory, gameHistory, userGameHistory };
