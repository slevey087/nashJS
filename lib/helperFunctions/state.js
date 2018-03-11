var {idCounters} = require('../state');

console.log("now")


var state = {
	
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
};

module.exports = state;