"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;


// NashJS engine components
var Engine = require("../lib/engine")

// Nash engine components
var { Sequence, Lambda } = Engine.FrontEnd.Playables;

// Game state
var { registry } = Engine.BackEnd.State

// helper functions
var { gameWrapper } = Engine.BackEnd.HelperFunctions("stock-games")

// We'll need the 'property' plugin
var PluginManager = Engine.BackEnd.PluginManager;

function invertTerms(termsOfTrade) {
	var inverse = {}
	Object.entries(termsOfTrade).forEach(function(term) {
		if (term[0] == "borrow") {
			inverse.lend = term[1]
		} else if (term[0] == "lend") {
			inverse.borrow = term[1]
		} else {
			inverse[term[0]] = term[1] * -1
		}
	});
	return inverse;
}

// termsOfTrade should
var Exchange = gameWrapper(function(players, termsOfTrade = {}, parameters = {}) {
	var { utilityFunctions, utilityMode = "absolute" } = parameters //utilityFunctions should be an array of 2 functions, which take a results object and return a change in utility
	parameters.id = "Exchange" || parameters.id;
	console.log(termsOfTrade)


	// To play this game, players will need a balance sheet. This plugin will add balance sheets to the players,
	// as well as ensure that new players are created with one, and that they are re-initialized properly.
	PluginManager.package("balance-sheet").require(players);

	var p1 = registry.players[players[0].id()];
	var p2 = registry.players[players[1].id()];


	// The actual playable
	var Decision = TwoPlayerNormal(players, [
		["Accept", "Reject"],
		["Accept", "Reject"]
	], null, {
		id: "Decision",
		informationFilter: function(info) { //TODO might need to wrap user-supplied informationFilter?
			info.termsOfTrade = {
				[p1.id]: termsOfTrade,
				[p2.id]: invertTerms(termsOfTrade)
			}
			return info;
		}
	})

	// Distribute the goods
	var Distribute = Lambda(function() {

		var results = [];

		Object.entries(termsOfTrade).forEach(function(term) {
			if (term[0] == "borrow") {
				var liability = Object.entries(term[1])[0]
				p1.balanceSheet.liabilities[liability[0]] = p1.balanceSheet.liabilities[liability[0]] ? p1.balanceSheet
					.liabilities[liability[0]] + liability[1] : liability[1];
				results.push({
					player: p1.id,
					borrow: {
						[liability[0]]: liability[1]
					}
				});

				var asset = p2.balanceSheet.assets[p1.id] ? p2.balanceSheet.assets[p1.id] : p2.balanceSheet.assets[
					p1.id] = {};
				asset[liability[0]] = asset[liability[0]] ? asset[liability[0]] + liability[1] : liability[1];
				results
					.push({
						player: p2.id,
						lend: {
							[p1.id]: {
								[liability[0]]: liability[1]
							}
						}
					});
			} else if (term[0] == "lend") {
				var liability = Object.entries(term[1])[0]
				p2.balanceSheet.liabilities[liability[0]] = p2.balanceSheet.liabilities[liability[0]] ? p2.balanceSheet
					.liabilities[liability[0]] + liability[1] : liability[1];
				results.push({
					player: p2.id,
					borrow: {
						[liability[0]]: liability[1]
					}
				});

				var asset = p1.balanceSheet.assets[p2.id] ? p1.balanceSheet.assets[p2.id] : p1.balanceSheet.assets[
					p2.id] = {};
				asset[liability[0]] = asset[liability[0]] ? asset[liability[0]] + liability[1] : liability[1];
				results
					.push({
						player: p1.id,
						lend: {
							[p2.id]: {
								[liability[0]]: liability[1]
							}
						}
					});
			} else {
				p1.balanceSheet.assets[term[0]] = p1.balanceSheet.assets[term[0]] ? p1.balanceSheet.assets[
					term[0]] + term[1] : term[1];
				results.push({ player: p1.id, [term[0]]: term[1] });

				p2.balanceSheet.assets[term[0]] = p2.balanceSheet.assets[term[0]] ? p2.balanceSheet.assets[
					term[0]] - term[1] : -1 * term[1];
				results.push({ player: p2.id, [term[0]]: -1 * term[1] });
			}
		});


		if (utilityFunctions) {

			p1.score = utilityMode.toLowerCase() == "relative" ? p1.score + utilityFunctions[0](results) :
				utilityFunctions[0](results)
			p2.score = utilityMode.toLowerCase() == "relative" ? p2.score + utilityFunctions[1](results) :
				utilityFunctions[1](results)
		}

		return results;
	}, { id: "Distribution" });

	//But only do it if the trade goes through.
	Distribute(Decision.Accept.Accept())



	return Sequence(Decision, Distribute, parameters);
}, {
	argumentValidator: function(players, termsOfTrade) {
		// TODO: validate parameters
		return true;
	}

});

module.exports = Exchange;
