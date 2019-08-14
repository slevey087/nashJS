import test from 'ava';

var { OutcomeTree } = require("../lib/outcomeTree")

test("OutcomeTree exists", t => {
    t.truthy(OutcomeTree)
})

test("Basic constructor (1 layer)", t => {
    var tree = new OutcomeTree([["l", "r"]], 5)
    t.truthy(tree)
    t.true(tree instanceof OutcomeTree)
    t.truthy(tree.tree)
    t.deepEqual(tree.tree, { l: 5, r: 5 })
})

test("Nested constructor (2 layers)", t => {
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], 5)
    t.truthy(tree)
    t.true(tree instanceof OutcomeTree)
    t.truthy(tree.tree)
    t.true(tree.tree.l instanceof OutcomeTree)
    t.true(tree.tree.r instanceof OutcomeTree)
    t.truthy(tree.tree.l.tree)
    t.deepEqual(tree.tree.l.tree, { u: 5, d: 5 })
    t.truthy(tree.tree.r.tree)
    t.deepEqual(tree.tree.r.tree, { u: 5, d: 5 })
})

test("References are linked", t => {
    var a = []
    var tree = new OutcomeTree([["l", "r"]], a)
    t.is(tree.tree.l, a)
    t.is(tree.tree.r, a)
})

test("valGenerator", t => {
    var vG = function () { return [] }
    var tree = new OutcomeTree([["l", "r"]], null, vG)
    t.not(tree.tree.l, tree.tree.r)
    t.deepEqual(tree.tree.l, tree.tree.r)
    t.deepEqual(tree.tree.l, [])
})

test("val as function gets called with path", t => {
    var f = function (path, arg) { if (arg) return path }
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], f)

    t.deepEqual(tree.tree.l.tree.u(1), ["l", "u"])
    t.deepEqual(tree.tree.l.tree.d(1), ["l", "d"])
    t.deepEqual(tree.tree.r.tree.u(1), ["r", "u"])
    t.deepEqual(tree.tree.r.tree.d(1), ["r", "d"])
})


test("layers", t => {
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], 5)
    t.is(tree.layers(), 2)
    var tree = new OutcomeTree([["l", "r"], ["u", "d"], ["f", "b"]], 5)
    t.is(tree.layers(), 3)
})


test("mapDimensions", t => {
    var tree = new OutcomeTree([["l", "c", "r"], ["l", "r"]], 5)
    t.deepEqual(tree.mapDimensions(), [3, 2])
})

test("branchDimensions", t => {
    var tree = new OutcomeTree([["l", "c", "r"], ["l", "r"]], 5)
    t.deepEqual(tree.branchDimensions(), [3, 6])
})


test("getValue", t => {
    // single length selector
    var tree = new OutcomeTree([["l", "r"]], 5)
    t.is(tree.getValue(["l"]), 5)
    t.is(tree.getValue("l"), 5)

    // longer selector
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], 5)
    t.is(tree.getValue(["l", "u"]), 5)
    t.is(tree.getValue(["l", "d"]), 5)
    t.is(tree.getValue(["r", "u"]), 5)
    t.is(tree.getValue(["r", "d"]), 5)

    // Failure modes

    // throws if selector is valid but not long enough
    t.throws(() => tree.getValue(["l"]))

    // returns outcommeTree is selector is valid but not long enough and returnOutcomeTree is true
    t.notThrows(() => tree.getValue(["l"], true))
    t.true(tree.getValue(["l"], true) instanceof OutcomeTree)

    // throws if selector is initially valid but then too long
    t.throws(() => tree.getValue(["l", "d", "f"]))

    // gives undefined if nonexistent branches are sought, even if selector is wrong length
    t.is(tree.getValue(["f"]), undefined)
    t.is(tree.getValue(["f", "r"]), undefined)
    t.is(tree.getValue(["f", "r", "b"]), undefined)
})


test("setValue", t => {
    // single length selector
    var tree = new OutcomeTree([["l", "r"]], 5)
    t.is(tree.setValue(["l"], 6), 6)
    t.is(tree.getValue("l"), 6)
    t.is(tree.getValue("r"), 5) // just to check it didn't do every branch
    t.is(tree.setValue("l", 7), 7)
    t.is(tree.getValue("l"), 7)

    // longer selector
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], 5)
    t.is(tree.setValue(["l", "d"], 8), 8)
    t.is(tree.getValue(["l", "d"]), 8)
    t.is(tree.getValue(["l", "u"]), 5) // just to check it didn't do every branch
    t.is(tree.getValue(["r", "u"]), 5) // just to check it didn't do every branch
    t.is(tree.getValue(["r", "d"]), 5) // just to check it didn't do every branch

    // references don't break
    var a = []
    t.is(tree.setValue(["l", "d"], a), a)
    t.is(tree.getValue(["l", "d"]), a)

    // failure modes

    // throws if branches are invalid
    t.throws(() => tree.setValue(["q", "r"]))
    t.throws(() => tree.setValue(["l", "r"]))

    // throws if selector is too short
    t.throws(() => tree.setValue(["l"]))

    // throws if selector is too long
    t.throws(() => tree.setValue(["l", "d", "f"]))
})

test("push", t => {
    // separate arrays
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], null, () => [])

    tree.push(5)

    // should push to every array
    t.is(tree.getValue(["l", "u"]).length, 1)
    t.deepEqual(tree.getValue(["l", "u"]), [5])
    t.deepEqual(tree.getValue(["l", "d"]), [5])
    t.deepEqual(tree.getValue(["r", "u"]), [5])
    t.deepEqual(tree.getValue(["r", "d"]), [5])

    // But they aren't the same array
    t.not(tree.getValue(["l", "u"]), tree.getValue(["l", "d"]))
    t.not(tree.getValue(["r", "u"]), tree.getValue(["r", "d"]))
    t.not(tree.getValue(["l", "u"]), tree.getValue(["r", "d"]))

    // now the same array
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], [])
    tree.push(5)

    t.is(tree.getValue(["l", "u"]).length, 4)
    t.deepEqual(tree.getValue(["l", "u"]), [5, 5, 5, 5])
    t.is(tree.getValue(["l", "u"]), tree.getValue(["l", "d"]))
    t.is(tree.getValue(["r", "u"]), tree.getValue(["r", "d"]))
    t.is(tree.getValue(["l", "u"]), tree.getValue(["r", "d"]))
})


test("collapse", t => {
    // separate arrays
    var tree = new OutcomeTree([["l", "r"], ["u", "d"]], null, () => [])

    // no given container
    var o = tree.collapse();

    t.is(o.l.u, tree.getValue(["l", "u"]))
    t.is(o.l.d, tree.getValue(["l", "d"]))
    t.is(o.r.u, tree.getValue(["r", "u"]))
    t.is(o.r.d, tree.getValue(["r", "d"]))

    // with given container
    var f = function () { return 5 }

    t.is(tree.collapse(f), f) // returns the container

    t.is(f.l.u, tree.getValue(["l", "u"]))
    t.is(f.l.d, tree.getValue(["l", "d"]))
    t.is(f.r.u, tree.getValue(["r", "u"]))
    t.is(f.r.d, tree.getValue(["r", "d"]))

    t.is(f(), 5) // function still works
})
