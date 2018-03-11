"use strict";

var log = require('../logger');

log("debug","helperFunctions-index: Loading helper functions loader.");
  
/*
var general  = require('./general');
var player   = require('./player'); 
var playable = require('./playable'); 
var turn 	 = require('./turn');
var state 	 = require('./state');
*/


function loader(file){
	return require("./" + file +".js")
}

module.exports = loader;
//module.exports = {general, player, playable, turn, state};

// Hack to compile Glob files (in browserify). Don´t call this function!
(function(){
  require('./*.js', { glob: true })
})