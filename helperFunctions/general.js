var {idCounters} = require('../state');


var general = {
	
	//Check if variable is an Object
	isObject: function(a) {
		return (!!a) && (a.constructor === Object);
	},
	
	isFunction: function(a){
		return (typeof a === "function");
	},
	
	//Handle ID setting for all objects that get stored in the registry
	idHandler: function(id, type){
		//Assign id
		
		idCounters[type]++;
		var counter = idCounters[type];
		
		if (!id) {
			return type + counter.toString();
		}
		else {
			//TODO: validate id and check for uniqueness
			return id
		}
	}

}

module.exports = general;