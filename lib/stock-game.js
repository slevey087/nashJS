"use strict";

// Base class, external dependency
var CallableInstance = require('callable-instance');

// utilities
var NASH = require("./engine")
var { isFunction, once, isObject } = NASH.Backend.HelperFunctions("general")
var { registerQueryObject } = NASH.Backend
var { registerStrategyObject } = NASH.Frontend;


class StockGame extends CallableInstance {
    constructor(builder, {
        argumentValidator = function () { return true; },
        combineParameters = true,
        description = "No description given.",
        strategyLoader = null,
        queries = null
    } = {}) {
        super("build")

        this.queries = () => queries;
        this.description = () => description;
        this.argumentValidator = argumentValidator
        this.combineParameters = combineParameters

        // If there's a strategy loader, make sure it only runs once
        var loadStrategies
        if (isFunction(strategyLoader)) this.loadStrategies = once(function () {
            return registerStrategyObject(strategyLoader());
        });
        else this.loadStrategies = function () { }

        // If there's a query loader, make sure it only runs once
        var loadQueries
        if (queries) this.loadQueries = once(function () {
            return registerQueryObject(queries);
        });
        else this.loadQueries = function () { }

        this.build = function (...args) {
            var result = this.argumentValidator(...args)
            if (result === true) {
                this.loadStrategies();
                this.loadQueries();
                return builder(...args);
            } else throw new Error(result);
        }
    }

    build(...args) {
        // this is silly, but CallableInstance pulls its property from the prototype, but I want to define it 
        // in the constructor in order to hide the actual generator from the user.
        return this.build(...args)
    }


    createGenerator(...args) {
        // If the last argument is an object, assume (hope) that it's the optional parameters argument
        var originalParameters;
        if (isObject(args[args.length - 1])) originalParameters = args.pop();

        var combineParameters = this.combineParameters;
        var originalGame = this;

        return new StockGame(function (players, parameters = {}) {

            if (combineParameters && originalParameters) parameters = Object.assign({}, originalParameters,
                parameters)

            return originalGame(players, ...args, parameters)
        }) // ?
    }
}

module.exports = { StockGame }

/* User interface works like this:

somegame = new StockGame(generator, parameters)
somegame(...) // returns playable
somegame.generator(...) // returns a function to generate a playable

*/