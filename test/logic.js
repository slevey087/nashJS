import test from 'ava';

// Classes
var { Variable, Expression, RandomVariable, ComplexVariable } = require("../lib/logic")

// External library for base class
var CallableInstance = require("callable-instance")

var { isFunction } = require("../lib/helper-functions")("general");

test("Variable exists and extends CallableInstance", t => {
    t.truthy(Variable)
    t.true(Variable.prototype instanceof CallableInstance)
})

test("Variable instance", t => {
    var v = new Variable(5)
    t.true(v instanceof Variable);
})

test("Variable various accessors", t => {
    var v = new Variable(5)
    t.true(v == 5)
    t.false(v === 5)
    t.true(v() === 5)
    t.true(v.valueOf() === 5)
    t.true(v.toString() === 5)
    t.true(JSON.parse(v) === 5)
    t.true(v.value === 5)
})


test("Variable set", t => {
    var v = new Variable(5)
    t.true(v == 5)
    v.set(6)
    t.true(v == 6)
})


test("Expression exists and extends Variable", t => {
    t.truthy(Expression)
    t.true(Expression.prototype instanceof Variable)
})


test("Expression constructor and caller", t => {
    var a = 7
    var expression = function () { return a }
    var e = new Expression(expression)

    t.true(e instanceof Expression)
    t.is(e.expression, expression)
    t.is(e(), a)
})

test("Expression various accessors", t => {
    var a = 7
    var expression = function () { return a }
    var e = new Expression(expression)

    t.is(e(), a)
    t.true(e == a)
    t.is(e.valueOf(), a)
    t.is(e.toString(), a)
})


test("RandomVariable exists and extends Expression", t => {
    t.truthy(RandomVariable)
    t.true(RandomVariable.prototype instanceof Expression)
})


test("RandomVariable constructor", t => {
    var r = new RandomVariable();
    t.true(r instanceof RandomVariable);

    t.true(isFunction(r.expression))
})

test("RandomVariable default functionality", t => {
    var r = new RandomVariable();

    var results = Array(10)
    results = results.map(r)
    t.true(results.every(item => item >= 0))
    t.true(results.every(item => item <= 10))
    t.not(results[0] == results[1]) // different results each time
    t.not(results[1] == results[2])
    t.not(results[2] == results[3])  // good enough.
})


test("ComplexVariable exists and extends Variable", t => {
    t.truthy(ComplexVariable)
    t.true(ComplexVariable.prototype instanceof Variable)
})

test("ComplexVariable functionality", t => {
    var a = { b: "hi" }
    var c = new ComplexVariable(a)

    // comparisons
    t.is(c.b, a.b)
    t.false(c === a)
    t.false(c == a)
    t.is(c(), a)
    t.notDeepEqual(a, c)

    // change updates object and self
    c.e = "hey"
    t.is(a.e, "hey")
    t.is(c.e, "hey")

    // array
    var a = [1, 4, 7];
    var c = new ComplexVariable(a);

    t.is(c[2], a[2])
    c[3] = 9
    t.is(c[3], 9)
    t.is(a[3], 9)

    // .set?
    var a = [1, 4, 7];
    var c = new ComplexVariable(a);
    c.set([2, 5])
    t.is(c.length, 2)
    t.is(c[0], 2)
    t.is(c[1], 5)
})