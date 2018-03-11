
var general = {
	
	//Check if variable is an Object
	isObject: function(a) {
		return (!!a) && (a.constructor === Object);
	},
	
	isFunction: function(a){
		return (typeof a === "function");
	},
	
	//Provide a function, a context ('this'), and an argument array.
	//Returns a function that can be called.
	applyBind: function(func, that, argArray){
		return func.bind.apply(func, [that].concat(argArray));
	}

}

module.exports = general;