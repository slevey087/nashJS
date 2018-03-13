
var general = {
	
	//Check if variable is an Object
	isObject: function(a) {
		return (!!a) && (a.constructor === Object);
	},
	
	//What do you think?
	isFunction: function(a){
		return (typeof a === "function");
	},
	
	//Provide a function, a context ('this'), and an argument array.
	//Returns a function that can be called.
	applyBind: function(func, that, argArray){
		return func.bind.apply(func, [that].concat(argArray));
	},
	
	//Wraps a function to ensure it only gets called one time. 
	once: function(fn, context) { 
		var result;

		return function() { 
			if(fn) {
				result = fn.apply(context || this, arguments);
				fn = null;
			}
	
			return result;
		};
	}
};


module.exports = general;