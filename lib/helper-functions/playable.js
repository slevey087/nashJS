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

		// for Maps
		if (tree instanceof Map) return tree.get(selector)

		//Find the next item in the chain associated with the resultant outcome
		for (var i = 0, len = selector.length; i < len; i++) {
			tree = tree[selector[i]];
		}

		return tree;
	},


	//Traverse an outcome tree to set the value for a desired key-set
	//Argument one is a nested object, while argument 2 is an array of keys for the object, 1 layer at a time.
	outcomeTreeSetValue(tree, selector, value) {

		// for Maps
		if (tree instanceof Map) return tree.set(selector, value)

		//Find the next item in the chain associated with the resultant outcome
		for (var i = 0, len = selector.length - 1; i < len; i++) {
			tree = tree[selector[i]];
		}

		return tree[selector[i]] = value;
	}
}



module.exports = playable;
