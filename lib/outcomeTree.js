"use strict";


class OutcomeTree {

    // The constructor will create an outcome tree, recursing as necessary. map should be an array of arrays
    // specifying the branches of the tree to build. If val is provided, it will assign val to the ultimate
    // branch value. (If val is a function, it will get wrapped in a function which will call it with the path to the branch as the
    // first argument.) Otherwise, valGenerator will be called, and any return value will be assigned to the branch.
    constructor(map, val, valGenerator = function () { }, path = []) {
        var map = map.map(set => set.slice()) // cut off reference to external object
        this.map = function () { return map.slice() } // send a copy each time

        // Allow for non-nested array if only one dimension
        if (!Array.isArray(map[0])) map = [map]

        // Where the tree will live
        this.tree = {}

        // Build tree
        var tree = this.tree

        // Loop over each choice in the choice set. 
        map[0].forEach(branch => {

            var newPath = path.slice(0).concat(branch)

            // If there's 1 choice set left, then loop over it and write values. Otherwise recurse.
            if (map.length == 1) {
                //If val is a function, wrap it in a function that will get supplied an argument with where we are
                if (typeof val == "function") {
                    tree[branch] = val.bind(null, newPath)
                }
                else tree[branch] = val || valGenerator(newPath);

            }

            // If there's more than one choice set, then we need to create a nested outcomeTree
            else {
                tree[branch] = new OutcomeTree(map.slice(1), val, valGenerator, newPath)
            }
        })
    }



    // Return number of layers
    layers() {
        return this.map().length
    }

    // Return dimensions of map by counting choice set. Eg [["l","c","r"],["l","r"]] -> [3,2]
    mapDimensions() {
        return this.map().map(item => item.length)
    }

    // Returns dimensions of map by counting branches. Eg [["l","c","r"],["l","r"]] -> [3,6]
    branchDimensions() {
        // function to take factorial of arrays
        var reducer = (acc, cur) => acc * cur;
        return this.mapDimensions().map((item, idx, arr) => arr.slice(0, idx + 1).reduce(reducer))
    }



    // takes a selector array that specifies which branch of the tree to fetch (eg. ["l","d","f"]); returns that branch's value.
    // (returnOutcomeTree is internal parameter for recursion)
    getValue(selector, returnOutcomeTree = false) {
        if (!Array.isArray(selector)) selector = [selector] // allow for single length selector to be not array.

        var branch = this.tree[selector[0]]


        if (!this.tree.hasOwnProperty(selector[0])) return undefined;

        else if (branch instanceof OutcomeTree && selector.length > 1)
            return branch.getValue(selector.slice(1)) // Recurse

        else if (branch instanceof OutcomeTree) { // There's a problem here, the selector is shorter than the tree, but return if allowed
            if (returnOutcomeTree) return branch;
            else throw new Error("Cannot get value, Selector is shorter than outcomeTree")
        }

        else if (selector.length > 1) // there's a problem here, the selector is longer than the tree.
            throw new Error("Cannot get value, Selector is longer than outcomeTree")

        else // Everything is great, return the value.
            return this.tree[selector[0]]

    }


    setValue(selector, value) {
        if (!Array.isArray(selector)) selector = [selector] // allow for single length selector to be not array.

        var branch = this.tree[selector[0]]


        if (!this.tree.hasOwnProperty(selector[0])) throw new Error("Cannot set value, branch " + JSON.stringify(selector) + " does not exist.")

        else if (branch instanceof OutcomeTree && selector.length > 1)
            return branch.setValue(selector.slice(1), value) // Recurse

        else if (branch instanceof OutcomeTree) { // There's a problem here, the selector is shorter than the tree
            throw new Error("Cannot set value, Selector is shorter than outcomeTree")
        }
        else if (selector.length > 1) // there's a problem here, the selector is longer than the tree.
            throw new Error("Cannot set value, Selector is longer than outcomeTree")

        else // Everything is great, set the value.
            return this.tree[selector[0]] = value
    }


    // If this is a tree of arrays, this will add the value to every array
    push(value) {
        var tree = this.tree

        for (var branch in tree) {
            var node = tree[branch]
            if (node instanceof OutcomeTree || Array.isArray(node)) node.push(value)
        }
    }

    // Use to create an outcomeTree-like structure of nested objects. Specify an object to add the branches to, or it will create one for you
    collapse(object = {}) {
        var tree = this.tree

        for (var branch in tree) {
            let node = tree[branch]
            if (node instanceof OutcomeTree) object[branch] = node.collapse()
            else object[branch] = node
        }

        return object;
    }
}

module.exports = OutcomeTree