


var variablePrototype = Object.create(Function.prototype);


variablePrototype.constructor = function (value) {
	
	var variable = this;
	variable.value = value;								//TODO: add a way to have a function that automatically generates a value.
	

	this.id = function(){return _playable.id;};			//TODO: work on ids and registration

};



variablePrototype.call = function () {
	return this.value;
};
	
variablePrototype.toString 	= function(){
	return this.call();
}
variablePrototype.valueOf 	= function(){
	return this.call();
};


variablePrototype.set = function(newValue){
	this.value = newValue;
	return this.value;
};




//Produces the function that will produce the end result. This part is reusable if you need to do this again.
var classFactory = function (proto) {
	return function () {
		
		var f = function () {
			return f.call.apply(f, arguments);      
		};
		
		Object.keys(proto).forEach(function (key) {
			f[key] = proto[key];
		});
		
		f.constructor.apply(f, arguments);		
		
		return f;
	}
};


var Variable = classFactory(variablePrototype);
// called as: var instance = Variable();

module.exports = {variablePrototype, Variable};