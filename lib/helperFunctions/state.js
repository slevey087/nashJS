"use strict";

var log = require('../logger');

// State variables
var {idCounters, registry} = require('../state');

var state = {
	
	//Handle ID setting for all objects that get stored in the registry
	idHandler: function idHandler(id, type, recursing=false){
		//Assign id
		
		idCounters[type]++;
		var counter = idCounters[type];
		
		if (!id) {
			return type + counter.toString();
		}
		else {
			
			// Check that id isn't taken. If it is, construct a new one.
			
			//Construct list of all objects by extracting all registry entries
			var items = []
			Object.keys(registry).forEach(function(reg){items.push.apply(items, Object.keys(registry[reg]))})
			
			// if id is already taken, generate a new one by adding a number at the end.
			if (items.indexOf(id) > -1) {
				
				var match, oldNum, exp, newId;
				var oldId = id;
				
				do {
					// This finds a number at the end, and increments it, or starts with 1 if there wasn't one.
					match = /\d+$/.exec(id);
					oldNum = match ? match[0] : "";
					exp = new RegExp(oldNum + "$");
					id = id.replace(exp, Number(oldNum) + 1)
				
				}	
				while (items.indexOf(id) >-1)
				
				// Log warning
				log("warn", "ID " + oldId + " is taken. Using instead " + id);
			}
			
			return id
		}
	}
};

module.exports = state;