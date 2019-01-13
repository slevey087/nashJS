import test from 'ava';

var NASH = require("../index")

var { History, UserHistory } = require("../lib/history")


// History
test("History exists and subclasses Array", t => {
    t.truthy(History)
    t.true(Object.getPrototypeOf(History) === Array)
})


test("History constructor", t => {
    var i = [{}, {}, {}]
    var h = new History(i)

    // Values should be the same
    t.is(h[0], i[0])
    t.is(h[1], i[1])
    t.is(h[2], i[2])

    // should create log with same entries
    t.true(h.log instanceof History)
    t.is(h.log[0], i[0])
    t.is(h.log[1], i[1])
    t.is(h.log[2], i[2])
    // log cyclic reference
    t.is(h.log.tree, h)

    // should create blank scores history
    t.true(h.scores instanceof History)
    t.is(h.scores.length, 0)
    // scores cyclic reference
    t.is(h.scores.tree, h)

    // should create blank children set
    t.true(h.children instanceof Set)
    t.is(h.children.size, 0)

    //should also work for 
    var h2 = new History(i[0], i[1], i[2])
    t.deepEqual(h, h2)
})


test("History add", t => {
    var i = [{}, {}, {}]
    var h = new History(i)
    var j = {}

    var result = h.add(j)

    //method returns self
    t.is(result, h)

    // entry should be added to history and log
    t.is(h[3], j)
    t.is(h.log[3], j)

    // entries should get added from child to parent histories, so let's child it and do it again
    var k = h.child()
    var l = {}
    k.add(l)

    t.is(k[0], l)
    t.is(k.log[0], l)
    t.is(h.log[4], l) // appends to existing log on parent

    // should also happen from log
    var n = {}
    k.log.add(n)

    t.is(k.log[1], n)
    t.is(h.log[5], n) // appends to existing log on parent

    // should happen all up the cycle, so let's try another layer deep
    var o = k.child()
    var p = {}
    o.add(p)

    t.is(k.log[2], p)
    t.is(h.log[6], p)
})


test("History addNoLog", t => {
    var i = [{}, {}, {}]
    var h = new History(i)
    var j = {}

    var result = h.addNoLog(j)

    // entry should be added to history and NOT log
    t.is(h[3], j)
    t.falsy(h.log[3])
    // method returns self
    t.is(result, h)
})


test("History addScores", t => {
    var i = [{}, {}, {}]
    var h = new History(i)
    var j = {}

    var result = h.addScores(j)

    // method returns self
    t.is(result, h)

    // entry added to scores, but not tree or log
    t.is(h.scores[0], j)
    t.falsy(h.log[3])
    t.falsy(h[3])

    // should cycle up to parents
    var k = h.child()
    var l = {}
    k.addScores(l)

    t.is(k.scores[0], l)
    t.is(h.scores[1], l)

    //let's do one more layer
    var m = k.child()
    var n = {}
    m.addScores(n)

    t.is(m.scores[0], n)
    t.is(k.scores[1], n)
    t.is(h.scores[2], n)
})


test("History child", t => {
    var i = [{}, {}, {}]
    var h = new History(i)

    var j = h.child()

    // creates new blank history, with link to parent
    t.true(j instanceof History)
    t.is(j.parent, h)
    t.true(h.children.has(j))
    t.is(j.length, 0)
    t.is(j.log.length, 0)
    t.is(j.scores.length, 0)

    // for some reason, we allow the argument to be the parent
    var k = new History()
    var l = h.child(k)

    t.is(l.parent, k)
})


test.skip("History childWithContent", t => {

})


test("History clearHistory", t => {
    var i = [{}, {}, {}]
    var h = new History(i)

    h.addScores({})

    h.clearHistory()

    t.is(h.length, 0)
    t.is(h.log.length, 0)
    t.is(h.scores.length, 0)

    // check that it deletes parent reference
    var j = h.child()
    j.clearHistory()

    t.falsy(j.parent)
    t.false(h.children.has(j))
})

test("History end", t => {
    var i = [{}, {}, {}]
    var h = new History(i)

    var child = h.child()
    var grandchild = child.child()

    child.end()

    t.true(h.stop)
    t.true(child.stop)
    t.true(grandchild.stop)
})

test("History orphan", t => {
    var i = [{}, {}, {}]
    var h = new History(i)

    var hHistory = h.child();

    t.is(hHistory.orphan(), hHistory)
    t.falsy(hHistory.parent)
    t.false(h.children.has(hHistory))
    t.falsy(hHistory.log)
    t.falsy(hHistory.scores)
})


test("History print", t => {
    var i = [{ hi: "hey" }, { a: 6 }, { turn: "the" }]
    var h = new History(i)

    var h0 = JSON.parse(JSON.stringify(h))
    h0.query = History.prototype.query

    t.deepEqual(h0, h.print())
})


test("History query", t => {
    var i = [{ turn: "t1" }, { turn: "t2" }]
    var h = new History(i)

    t.snapshot(h.query("turn"))
})

// UserHistory
test("UserHistory exists and subclasses Array", t => {
    t.truthy(UserHistory)
    t.true(Object.getPrototypeOf(UserHistory) === Array)
})


test("UserHistory constructor", t => {
    var i = [{ turn: "t1" }, { turn: "t2" }]
    var h = new History(i)
    var u = new UserHistory(h)

    t.log(u)
})