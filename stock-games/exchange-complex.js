"use strict";

// base game
var TwoPlayerNormal = require("./simple-normal").TwoPlayerNormal;

// NashJS engine components
var Engine = require("../lib/engine")

// Nash engine components
var { Sequence, Lambda } = Engine.Frontend.Playables;

// Game state
var { registry } = Engine.Backend.State

// helper functions
var { gameWrapper } = Engine.Backend.HelperFunctions("stock-games")

// We'll need the 'balance-sheet' plugin
var PluginManager = Engine.Backend.PluginManager;

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



	// To play this game, players will need a balance sheet. This plugin will add balance sheets to the players,
	// as well as ensure that new players are created with one, and that they are re-initialized properly.
	var balanceSheet = PluginManager.package("balance-sheet-complex").require(players);
	balanceSheet.settings({ cleanZeros: false })

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
				var loanTerms = Object.entries(term[1])[0]
				var loan = new balanceSheet.FinancialClaim(p2.interface, p1.interface, loanTerms[1], loanTerms[0])

				results.push({
					player: p1.id,
					borrow: {
						[loanTerms[0]]: loanTerms[1]
					}
				});

				results.push({
					player: p2.id,
					lend: {
						[p1.id]: {
							[loanTerms[0]]: loanTerms[1]
						}
					}
				});

			} else if (term[0] == "lend") {
				var loanTerms = Object.entries(term[1])[0]
				var loan = new balanceSheet.FinancialClaim(p1.interface, p2.interface, loanTerms[1], loanTerms[0])

				results.push({
					player: p2.id,
					borrow: {
						[loanTerms[0]]: loanTerms[1]
					}
				});

				results.push({
					player: p1.id,
					lend: {
						[p2.id]: {
							[loanTerms[0]]: loanTerms[1]
						}
					}
				});

			} else {
				var good = new balanceSheet.RealClaim(p1.interface, term[0], 0)
				good.transfer(p2.interface, term[1] * -1)

				results.push({ player: p1.id, [term[0]]: term[1] });
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
	argumentValidator(players, termsOfTrade) {
		// TODO: validate parameters
		return true;
	}

});

module.exports = Exchange;
