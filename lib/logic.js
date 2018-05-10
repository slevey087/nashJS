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
