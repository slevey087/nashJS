"use strict";

var path = require("path");

// fetch folder setting
var Settings = require("../settings");

// initialize plugin manager
module.exports = require("plugin-please")(path.join(__dirname, Settings["plugins-directory"]));;