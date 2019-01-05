NASH = require("../index.js")
Object.assign(global, NASH)
Object.assign(global, NASH.Playables)

NASH.Backend = require("../lib/engine.js").Backend