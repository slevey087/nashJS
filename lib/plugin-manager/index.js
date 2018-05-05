// Stolen liberally and brazenly from "polite-plugin-manager".
"use strict";

const pluginDirectoryPath = "../../plugins/"
// Hack to compile Glob files for browserify. Don´t call this function!
function $_DONOTCALL() {
	require('../../plugins/**/*.js', { glob: true })
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
	skipProps = ['module', 'name', 'priority', 'active', 'init', 'require', 'stop'];

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
	return {
		name: function() { return pkg.name },
		priority: function() { return pkg.priority },
		active: function() { return pkg.active },

		init: function(...args) {
			pkg.init(...args);
			pkg.registerHooks();
			pkg.active = true;
			return this;
		},
		require: function(...args) {
			if (pkg.active) pkg.require(...args);
			else pkg.init(...args);
			pkg.active = true;

			return this;
		},
		stop: function(...args) {
			if (pkg.active) pkg.stop(...args);
			pkg.active = false;
		}

	}
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
