"use strict";

var logic = {

	// Check to see if object is Variable/Expression or not. Returns true/false
	isLogic(logic) {

		if (logic instanceof Function && logic == logic * 1) return true
		else return false;
	}
};

module.exports = logic;
