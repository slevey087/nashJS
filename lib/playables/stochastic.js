"use strict";

// Parent class
var { Branch, _Playable, Playable } = require("./playable");

// Helper classes
var { OutcomeTree } = require("../outcomeTree");
var { Expression } = require("../logic")

// Helper functions
var { idHandler } = require("../helper-functions")("state");

//Game state controllers
var { registry } = require("../state");
var Promise = registry.Promise; // For sync mode

class Probabilities extends Array {
    // this is necessary because otherwise calls to .map and such will add a second residual value
    static get [Symbol.species]() { return Array; }

    constructor(...probabilities) {

        if (probabilities.length > 1) super(...probabilities)
        else {
            // this is some JS BS that I have to do this...
            probabilities.push(0)
            super(...probabilities)
            this.pop()
        }
        var probabilities = this;
        if (!probabilities.checkProbabilities()) throw new Error("Invalid probabilities.")
        // Add residula value (which can be zero, but should not be negative if checkProbabilities just worked)
        probabilities.push(new Expression(function () {
            return 1 - probabilities.sum(false);
        }))
    }

    sum(includeLast = true) {
        var last = this.length - 1
        return this.reduce((sum, num, index) => {
            if (index < last || includeLast) return num + sum;
            return sum;
        }, 0)
    }

    // returns true if acceptable probabilities, else false
    checkProbabilities() {
        // should be numbers and between 0 and 1 inclusive        
        if (this.some(prob => isNaN(prob) || prob < 0 || prob > 1)) return false;
        if (this.sum() > 1) return false;
        return true;
    }
}

class _Stochastic extends _Playable {
    constructor(id, probabilities, parameters = {}) {
        super(id, parameters);

        // If we don't have the right data type, fold it in. 
        if (!(probabilities instanceof Probabilities)) probabilities = new Probabilities(...probabilities)
        this.probabilities = probabilities

        this.next = new OutcomeTree(this.probabilities.map((val, index) => index), null, function () {
            return [];
        });

        parameters.omitHistories === false ? this.omitHistories = false : this.omitHistories = true;
    }

    generateBranches() {
        var _stochastic = this;
        var stochastic = _stochastic.interface;

        _stochastic.probabilities.forEach((proability, index) => {
            stochastic[index] = new Branch(index, stochastic)
        })
    }


    play(parameters = {}, result = {}) {
        // Generate the random number here, so that we can use the default implementation of .findNext
        var probabilities = this.probabilities;

        if (!probabilities.checkProbabilities()) return Promise.reject("Invalid probabilities in " + this.id)

        var value = Math.random()
        var sum = 0;

        for (let i = 0; i < probabilities.length; i++) {
            sum += probabilities[i]
            if (value < sum) {
                result.result = i;
                this.omitHistories ? null : result.historyEntry = { result: i }
                return Promise.resolve(result);
            }
        }
        // Hypothetically we should never get here, but just in case
        result.result = probabilities.length - 1;
        this.omitHistories ? null : result.historyEntry = { result: probabilities.length - 1 }
        return Promise.resolve(result);

    }

    summaryNext(summary) {
        var probabilities = this.probabilities
        summary.tree("next", this.next.map(), this.next, function (item, path, summary) {
            summary("probability", probabilities[path[0]])
            summary.array("action", item, function (playable, summary) {
                return playable.summarize(summary)
            });
            return summary;
        })
    }
}
_Stochastic.registryName = "stochastics";
_Stochastic.counterName = "stochastic";

class Stochastic extends Playable {
    constructor(probabilities, parameters = {}) {
        var id = idHandler(parameters.id, _Stochastic.counterName);

        if (!Array.isArray(probabilities))
            throw new Error("Probabilities must be an array")

        probabilities = new Probabilities(...probabilities);

        var _stochastic = new _Stochastic(id, probabilities, parameters);
        super(_stochastic);

        _stochastic.generateBranches();
    }

    // Create any additional methods here.
}

module.exports = { Probabilities, _Stochastic, Stochastic };