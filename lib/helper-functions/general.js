"use strict";

var general = {
	//Check if variable is an Object
	isObject(a) {
		return !!a && a.constructor === Object;
	},

	//What do you think?
	isFunction(a) {
		return typeof a === "function";
	},


	//Wraps a function to ensure it only gets called one time.
	once(fn, context) {
		var result;

		return function () {
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
