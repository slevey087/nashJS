"use strict";

// Plugin to add 'property' (as in personal property) property to Players when they are initialized. Meant to be used for
// simulations involving personal posessions, for instance economic simulations.

// NashJS engine components
var Engine = require("../lib/engine")

// Game state
var { registry, gamePopulation } = Engine.BackEnd.State;

// Let's add some PlayerList functionality
var { PlayerList } = Engine.BackEnd.Classes;


var BalanceSheet = function() {

	var addEntries = function(player) {
		//_player properties/methods
		player.balanceSheet = { assets: {}, liabilities: {} }

		player.netWorth = function() {

			var assets = Object.entries(this.balanceSheet.assets).reduce(function(accumulator, currentValue) {
				return accumulator + currentValue[1]
			}, 0);

			var liabilities = Object.entries(this.balanceSheet.liabilities).reduce(function(accumulator,
				currentValue) {
				return accumulator + currentValue[1]
			}, 0);

			return assets - liabilities;
		}

		// User interface
		player.interface.balanceSheet = function() {
			return JSON.parse(JSON.stringify(registry.players[player.id].balanceSheet));
		}

		player.interface.netWorth = function() {
			return registry.players[player.id].netWorth();
		}

		// TODO validate object. Should be of form {apples:2, dogs:1}
		player.interface.endowAssets = function(assetObject) {

			Object.assign(registry.players[player.id].balanceSheet.assets, assetObject)
		}

		player.interface.lend = function(loanObject) {
			//TODO validate object. Should be of form {player1:{mortgage:10}}
			var lender = registry.players[player.id].balanceSheet.assets
			Object.entries(loanObject).forEach(function(loanTo) {
				var debts;
				lender[loanTo[0]] ?
					debts = lender[loanTo[0]] : debts = lender[loanTo[0]] = {};

				Object.entries(loanTo[1]).forEach(function(newLoan) {
					debts[newLoan[0]] ? debts[newLoan[0]] += newLoan[1] : debts[newLoan[0]] = newLoan[1]
					registry.players[loanTo[0]].balanceSheet.liabilities[newLoan[0]] ? registry.players[loanTo[0]].balanceSheet
						.liabilities[newLoan[0]] += newLoan[1] : registry.players[loanTo[0]].balanceSheet.liabilities[
							newLoan[0]] = newLoan[1];
				});
			});
		}
	}



	// The plugin object.
	var Plugin = {
		name: "balance-sheet",

		// Option to initialize by creating 'property' for a group of players.
		init: function(players = []) {
			// Add some playerlist functionality
			PlayerList.prototype.balanceSheets = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet();
					else return null;
				})
			};

			PlayerList.prototype.assets = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet().assets;
					else return null;
				})
			};

			PlayerList.prototype.liabilities = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.interface.balanceSheet().liabilities;
					else return null;
				})
			};

			PlayerList.prototype.netWorth = function() {
				return this.map(function(player) {
					if (player.balanceSheet) return player.netWorth();
					else return null;
				})
			};

			PlayerList.prototype.zeroBalanceSheets = function() {
				this.forEach(function(player) {
					addEntries(player)
				});
				return this;
			}

			// Add bs for specified players
			players.forEach(function(player) {
				addEntries(registry.players[player.id()]);
			})
		},

		// If we've init-ed alredy, just add bs's to the current player list if they don't have already
		require: function(players = []) {
			players.forEach(function(player) {
				if (!player.balanceSheet) addEntries(registry.players[player.id()]);
			});
		},

		stop: function() {
			// remove prototype addEntries
			delete PlayerList.prototype.balanceSheets;
			delete PlayerList.prototype.assets;
			delete PlayerList.prototype.liabilities;
			delete PlayerList.prototype.netWorth;

			// delete balance sheet properties from every player and interface.
			gamePopulation().forEach(function(player) {
				delete player.balanceSheet;
				delete player.netWorth;
				delete player.interface.balanceSheet;
				delete player.interface.netWorth;
				delete player.interface.endowAssets;
				delete player.interface.lend;
			})
		},

		// create property and interface function when player is created
		'player-create': addEntries,

		// Blank property when player is re-initialized
		"player-reinitialize": function(player) {
			player.balanceSheet = { assets: [], liabilities: [] }
		}
	}

	return Plugin;
}


module.exports = BalanceSheet;
