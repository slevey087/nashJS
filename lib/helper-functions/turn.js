"use strict";

var { SynchronousPromise } = require('synchronous-promise');

var turn = {

	//Recurse through the options in input, and write val to output.
	recurse: function recurse(input, output, val, valGenerator = function() {}, path = []) {


		//Since we slice the array each time, if there are no more entries left then we're done with this branch.
		if (input.length == 0) return path


		//Among all values from the array
		return input[0].map(function(item) {
			var value;
			var splitPath = path.slice(0).concat(item);

			//If there are more items to iterate over, include them in the output then recurse.
			//If not, put in the new value.
			if (input.length == 1) {

				//If val is a function, wrap it in a function that will get supplied an argument with where we are
				if (typeof val == "function") {
					value = function() {
						var args = [splitPath].concat(Array.prototype.slice.call(arguments));
						return val.apply(null, args);
					};
				} else value = val || valGenerator(splitPath);

				output[item] = value;
			} else output[item] = {};


			return recurse(input.slice(1), output[item], val, valGenerator, splitPath);
		});
	}
};


module.exports = turn;
