"use strict";

//External dependency
var cloneDeepWith = require("lodash.cloneDeepWith");

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

//Help read the history in Chrome with less clutter.
History.prototype.print = function() {
	//return cloneDeepWith(this);
	return JSON.parse(JSON.stringify(this));
};

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
