"use strict";

var log = require("./logger");

// Base class, external dependency
var CallableInstance = require('callable-instance');

//Helper functions
var { isFunction } = require("./helper-functions")("general");


// Class for dynamic updating of parameters, base class for play-time logic. 
// Stores a number, which will be used whenever a value is requested, but can be changed.
class Variable extends CallableInstance {
	constructor(value, { enforceNumber = true } = {}) {
		super("valueOf")
		var variable = this;
		variable.enforceNumber = enforceNumber
		this.set(value)

		// TODO: ids and registration?
	}

	set(newValue) {
		this.value = this.enforceNumber ? newValue * 1 : newValue
		return this.value;
	}

	valueOf() {
		return this.value;
	}

	toString() {
		return this.valueOf();
	}

	toJSON() {
		return this.valueOf();
	}
}


// Class similar to Variable, but instead of a number the value is a function, which gets called each time the value is requested.
class Expression extends Variable {
	constructor(expression) {
		super(expression)
		delete this.enforceNumber
	}

	set(newExpression) {
		if (!isFunction(newExpression))
			log("error", "Expression must be a function.");

		if (isNaN(newExpression())) log("error", "Expression must return a number"); //TODO: should Expressions/Variables allow strings?

		this.expression = newExpression;

		return newExpression();
	}

	valueOf() {
		return this.expression();
	}
}

// A subclass of  Expression, for generating random numbers
class RandomVariable extends Expression {
	constructor({ lowerbound = 0, upperbound = 10, generator = "uniform" } = {}) {
		var expression;

		if (isFunction(generator)) expression = generator

		else if (generator.toLowerCase() == "uniform")
			expression = () => Math.floor(Math.random() * (upperbound - lowerbound + 1) + lowerbound);

		// TODO: add more distributions here.

		super(expression)
	}
}


class ComplexVariable extends Variable {
	constructor(value) {
		super(value, { enforceNumber: false })

		var excludeList = ["set", "toJSON", "toString", "valueOf"]

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
		return new Proxy(this, handler)
	}
}


module.exports = {
	Variable,
	Expression,
	RandomVariable,
	ComplexVariable
};
