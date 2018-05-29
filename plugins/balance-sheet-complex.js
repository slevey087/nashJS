"use strict";

// Plugin to add 'property' (as in personal property) property to Players when they are initialized. Meant to be used for
// simulations involving personal posessions, for instance economic simulations.

// NashJS engine components
var Engine = require("../lib/engine")

// Game state
var { registry, gamePopulation } = Engine.Backend.State;

// Let's add some PlayerList functionality
var { PlayerList } = Engine.Backend.Classes;


var BalanceSheet = function() {

	// Variables to store settings, and defaults
	var settings = {
		addBalanceSheetOnClaim: true,
		cleanZeros: true,
		negativeAssets: false
	}
	//TODO make negativeAssets (and negativeLiabilities) work


	// Assets Classes

	// Claim parent class
	var Claim = function(claimant, amount) {
		// Add balance sheet if necessary and permitted
		if (!claimant.balanceSheet) {
			if (settings.addBalanceSheetOnClaim) addEntries(registry.players[claimant.id()])
			// Fail if not permitted to add necessary balance sheet.
			else return false;
		}

		this.amount = amount;
		this.claimant = claimant
		claimant.endow(this)
		return true;
	}

	// End ownership claim
	Claim.prototype.erase = function() {
		this.claimant.revoke(this)
		this.claimant = null;
		this.amount = 0
	}

	// Merge claims if they're the same family but different amounts
	Claim.prototype.merge = function(otherClaim) {
		if (this.claimant !== otherClaim.claimant) return false
		// Add amounts
		this.amount = this.amount + otherClaim.amount

		// Remove from balance sheet
		otherClaim.erase();
	}

	// Split this into two separate claims, with different amounts
	Claim.prototype.split = function(newAmount) {
		var clone = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
		clone.amount = newAmount;
		this.amount = this.amount - newAmount;
		this.claimant.endow(clone, false)
		return clone;
	}

	// Transfer to new owner
	Claim.prototype.transfer = function(newClaimant, amount = "all") {
		// Add balance sheet if necessary and permitted
		if (!newClaimant.balanceSheet) {
			if (settings.addBalanceSheetOnClaim) addEntries(registry.players[newClaimant.id()])
			// Fail if not permitted to add necessary balance sheet.
			else return false;
		}

		// Transfer all of it
		if (amount == "all" || amount == this.amount) {
			var oldClaimant = this.claimant;
			this.claimant.revoke(this);
			this.claimant = newClaimant;
			newClaimant.endow(this);

		}
		// or only a portion
		else {
			var newClaim = this.split(amount);
			newClaim.transfer(newClaimant, "all")
			cleanAsset(this)
		}

	}



	// Claims on real things (like cars, houses, gold)
	var RealClaim = function(claimant, good, amount) {
		if (!Claim.call(this, claimant, amount)) return false;
		this.good = good;
	}
	RealClaim.prototype = Object.create(Claim.prototype)
	RealClaim.prototype.constructor = RealClaim

	// Lose value by percentage
	RealClaim.prototype.depreciate = function(rate = .1) {
		this.amount = this.amount * (1 - rate)
	}

	// Add good enforcement to merge
	RealClaim.prototype.merge = function(otherClaim) {
		if (this.good === otherClaim.good) return Claim.prototype.merge.call(this, otherClaim);
	}

	// Replace player object with id when stringifying
	RealClaim.prototype.toJSON = function() {
		return {
			claimant: this.claimant.id(),
			good: this.good,
			amount: this.amount
		}
	}

	// Claims on other entities with balance sheets
	var FinancialClaim = function(claimant, claimed, amount, instrument = "Debt") {
		// Add balance sheet if necessary and permitted
		if (!claimed.balanceSheet) {
			if (settings.addBalanceSheetOnClaim) addEntries(registry.players[claimed.id()])
			// Fail if not permitted to add necessary balance sheet.
			else return false;
		}
		this.claimed = claimed;
		this.instrument = instrument;

		if (!Claim.call(this, claimant, amount)) return false;

		claimed.indebt(this)
	}
	FinancialClaim.prototype = Object.create(Claim.prototype)
	FinancialClaim.prototype.constructor = FinancialClaim

	// Add to erase function, to erase from claimed's balance sheet too
	FinancialClaim.prototype.erase = function() {
		var bs = registry.players[this.claimed.id()].balanceSheet.liabilities
		bs.splice(bs.indexOf(this), 1)
		this.claimed = null;

		return Claim.prototype.erase.call(this)
	}

	// Add claimed enforcement to merge
	FinancialClaim.prototype.merge = function(otherClaim) {
		if (this.claimed === otherClaim.claimed) return Claim.prototype.merge.call(this, otherClaim);
	}


	// Add to split function, to split on claimed's balance sheet too
	FinancialClaim.prototype.split = function(newAmount) {
		var clone = Claim.prototype.split.call(this, newAmount);
		clone.claimed.indebt(clone, false);
		return clone;
	}

	// Replace player object with id when stringifying
	FinancialClaim.prototype.toJSON = function() {
		return {
			claimant: this.claimant.id(),
			claimed: this.claimed.id(),
			instrument: this.instrument,
			amount: this.amount
		}
	}


	// Clean the similar claims on the claimant supplied
	var cleanAsset = function(claim) {
		var bs = registry.players[claim.claimant.id()].balanceSheet.assets;

		var dirty = bs.filter(function(entry) {
			return (entry !== claim && entry.good === claim.good && entry.instrument === claim.instrument);
		})

		dirty.forEach(function(dirt) {
			claim.merge(dirt)
		})

		if (settings.cleanZeros && claim.amount == 0) claim.erase()
	}

	var cleanLiability = function(claim) {
		var bs = registry.players[claim.claimed.id()].balanceSheet.liabilities;

		var dirty = bs.filter(function(entry) {
			return (entry !== claim && entry.claimant === claim.claimant && entry.instrument === claim.instrument);
		})

		dirty.forEach(function(dirt) {
			claim.merge(dirt)
		})

		if (settings.cleanZeros && claim.amount == 0) claim.erase
	}



	// Add balance sheet object and methods to player.
	var addEntries = function(player) {

		//_player properties/methods
		player.balanceSheet = { assets: [], liabilities: [] }

		/*
		var lookup = function(type) {
			this.reduce(function(accumulator, value) {
				if (type === value.good) accumulator += value.amount
				else if (type instanceof Object && type.instrument == value.instrument && (type.claimed === value.claimed))
					accumulator += value.amount
				return accumulator;
			}, 0)
		}
		player.balanceSheet.assets.lookup = lookup;
		player.balanceSheet.liabilities.lookup = lookup;
		*/

		player.netWorth = function() {

			var assets = this.balanceSheet.assets.reduce(function(accumulator, currentValue) {
				return accumulator + currentValue.amount
			}, 0);

			var liabilities = this.balanceSheet.liabilities.reduce(function(accumulator,
				currentValue) {
				return accumulator + currentValue.amount
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

		// TODO validate object.
		player.interface.endow = function(asset, clean = true) {
			if (asset instanceof Claim) {
				registry.players[player.id].balanceSheet.assets.push(asset);
				if (clean) cleanAsset(asset);
			}
		}

		player.interface.indebt = function(liability, clean = true) {
			if (liability instanceof FinancialClaim) {
				registry.players[player.id].balanceSheet.liabilities.push(
					liability);
				if (clean) cleanLiability(liability);
			}
		}

		player.interface.revoke = function(asset) {
			if (asset instanceof Claim) {
				var bs = registry.players[player.id].balanceSheet.assets
				bs.splice(bs.indexOf(asset), 1)
			}
		}

		// TODO convert this over
		player.interface.lend = function(borrower, amount, instrument = "Debt") {
			return new FinancialClaim(player.interface, borrower, amount, instrument)
		}
	}



	// The plugin object.
	var Plugin = {
		name: "balance-sheet-complex",

		settings: function(parameters = {}) {
			Object.assign(settings, parameters)
		},

		// Option to initialize by creating 'property' for a group of players.
		init(players = []) {
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
		require(players = []) {
			players.forEach(function(player) {
				if (!player.balanceSheet) addEntries(registry.players[player.id()]);
			});
		},

		stop() {
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

		// Public classes for asset/liability
		publicIfActive: {
			RealClaim,
			FinancialClaim
		},

		// create property and interface function when player is created
		'player-create': addEntries,

		// Blank property when player is re-initialized
		"player-reinitialize" (player) {
			player.balanceSheet = { assets: [], liabilities: [] }
		}
	}

	return Plugin;
}



module.exports = BalanceSheet;
