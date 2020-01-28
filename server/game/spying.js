//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let {
	logDiagnostics
} = require('./../diagnostics.js');
let {
	log
} = require('../../common/utilities.js');

let {
	getEquipmentStatistics,
	isSpying,
	isAttacking,
	logActivity
} = require('./../utilities.js');

const pool = require('./../db/pool.js');

function spyRequest(req, res) {
	let user = req.session.user;

	//verify that the defender's profile exists
	pool.query('SELECT accountId FROM profiles WHERE accountId IN (SELECT id FROM accounts WHERE username = ?);', [req.body.defender], (err, results) => {
		if (err) throw err;

		if (results.length !== 1) {
			res.status(400).write(log('Invalid defender spying credentials', user.id, user.username, req.body.defender));
			res.end();
			return;
		}

		let defenderId = results[0].accountId;

		//verify that the attacker has enough spies
		pool.query('SELECT spies FROM profiles WHERE accountId = ?;', [user.id], async (err, results) => {
			if (err) throw err;

			if (results[0].spies <= 0) {
				res.status(400).write(log('Not enough spies', user.username, req.body.defender, results[0].spies));
				res.end();
				return;
			}

			let attackingUnits = results[0].spies;

			//verify that the attacker is not already spying on someone
			let spying = await isSpying(user.username)
			if (spying) {
				res.status(400).write(log('You are already spying on someone', user.id, user.username));
				res.end();
				return;
			}

			//create the pending spy record
			await pool.promise().query('INSERT INTO pendingSpying (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 10 * ? MINUTE), ?, ?, ?);', [attackingUnits, user.id, defenderId, attackingUnits])

			res.status(200).json({
				status: 'spying',
				attacker: user.username,
				defender: req.body.defender,
				msg: log('Spying', user.username, req.body.defender) //TODO: am I using this msg parameter anywhere?
			});
			res.end();

			logActivity(user.id);
		});

	});
};

/**
 * Check if someone is spying // Limit it to preserve secrecy?
 * @param {*} req 
 * @param {*} res 
 */
const spyStatusRequest = async (req, res) => {
	let user = req.session.user;
	let spying = await isSpying(user.id)

	res.status(200).json({
		status: spying ? 'spying' : 'idle',
		defender: spying
	});

	res.end();
};

// TODO: Fix it
function spyLogRequest(req, res) {
	let user = req.session.user;
	//grab the spying log and equipment stolen based on the id
	pool.query('SELECT pastSpying.id AS id, pastSpying.eventTime AS eventTime, pastSpying.attackerId AS attackerId, pastSpying.defenderId AS defenderId, atk.username AS attackerUsername, def.username AS defenderUsername, pastSpying.attackingUnits AS attackingUnits, pastSpying.success AS success, pastSpying.spoilsGold AS spoilsGold, equipmentStolen.name AS equipmentStolenName, equipmentStolen.type AS equipmentStolenType, equipmentStolen.quantity AS equipmentStolenQuantity FROM pastSpying LEFT JOIN equipmentStolen ON pastSpying.id = equipmentStolen.pastSpyingId LEFT JOIN accounts AS atk ON pastSpying.attackerId = atk.id LEFT JOIN accounts AS def ON pastSpying.defenderId = def.id WHERE pastSpying.attackerId = ? OR pastSpying.defenderId = ? ORDER BY eventTime DESC LIMIT ?, ?;', [user.id, user.id, req.body.start, req.body.length], (err, results) => {
		if (err) throw err;

		//build the sendable data structure (delete names from successful events when you're the losing defender, etc.)
		let ret = [];

		results.forEach((result) => {
			//appending equipment stolen
			if (ret[result.id]) {
				ret[result.id].equipmentStolen.push({
					name: result.equipmentStolenName,
					type: result.equipmentStolenType,
					quantity: result.equipmentStolenQuantity
				});
				return;
			}

			let hideData = user.id === result.defenderId && (result.success === 'success' || result.success === 'ineffective');

			//creating a new entry
			ret[result.id] = {
				eventTime: result.eventTime,
				attacker: hideData ? null : result.attackerUsername,
				defender: result.defenderUsername,
				attackingUnits: hideData ? null : result.attackingUnits,
				success: result.success,
				spoilsGold: result.spoilsGold,
				equipmentStolen: result.equipmentStolenName ? [{
					name: result.equipmentStolenName,
					type: result.equipmentStolenType,
					quantity: result.equipmentStolenQuantity
				}] : []
			};
		});

		//remove null fields
		ret = ret.filter(x => x);

		//send the build structure
		res.status(200).json(ret);
		res.end();

		log('Spy log sent', JSON.stringify(ret));
	});
};

async function runSpyTick() {
	//find each pending spy event
	let spyTick = new CronJob('0 * * * * *', async () => {
		// Get list of spying requests
		let pendingSpyingList = (await pool.promise().query(
			'SELECT * FROM pendingSpying WHERE eventTime < CURRENT_TIMESTAMP();'
		))[0]

		// Execute every single one 
		pendingSpyingList.forEach(async (pendingSpying) => {
			//check that the attacker still has enough spies
			let attackerSpies = (await pool.promise().query('SELECT spies FROM profiles WHERE accountId = ?;', [pendingSpying.attackerId]))[0]

			if (attackerSpies[0].spies < pendingSpying.attackingUnits) {
				//delete the failed spying
				await pool.promise().query('DELETE FROM pendingSpying WHERE id = ?;', [pendingSpying.id])
				log('Not enough spies for spying', pendingSpying.attackerId, attackerSpies[0].spies, pendingSpying.attackingUnits);

				return;
			}

			//spy gameplay logic
			spyGameplayLogic(pendingSpying);
		});
	});


	spyTick.start();
};

const spyGameplayLogic = async (pendingSpying) => {
	// determine how many pairs of defender eyes are available to spot the spies
	let defenderIsAttacking = await isAttacking(pendingSpying.defenderId);
	let defenderIsSpying = await isSpying(pendingSpying.defenderId);

	// Get defender profile
	let defenderProfile = (await pool.promise().query('SELECT * FROM profiles WHERE accountId = ?;', [pendingSpying.defenderId]))[0][0]

	let totalEyes = defenderProfile.recruits + defenderProfile.soldiers * !defenderIsAttacking + defenderProfile.spies * !defenderIsSpying + defenderProfile.scientists;

	//more spies reduces the chances of being seen? Counter intuitive
	let chanceSeen = totalEyes / (pendingSpying.attackingUnits * 10); //it takes 10 eyes to guarantee the capture of 1 spy, 50% chance to capture 2 spies, etc.

	//if seen (failure)
	if (Math.random() <= chanceSeen) {
		// Write fail to the spying log
		await pool.promise().query(
			'INSERT INTO pastSpying (eventTime, attackerId, defenderId, attackingUnits, success, spoilsGold) VALUES (?, ?, ?, ?, "failure", 0);',
			[pendingSpying.eventTime, pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits]
		)

		// Kill the spies on failure
		await pool.promise().query('UPDATE profiles SET spies = spies - ? WHERE accountId = ?;', [pendingSpying.attackingUnits, pendingSpying.attackerId])

		//delete from pending
		await pool.promise().query('DELETE FROM pendingSpying WHERE id = ?;', [pendingSpying.id]);
		log('Spy failed', pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits, totalEyes);
		logDiagnostics('death', pendingSpying.attackingUnits);
	} else {
		//steal this much gold on success
		let spoilsGold = Math.random() >= 0.5 ? Math.floor(defenderProfile.gold * 0.2) : 0; //50% chance of stealing gold
		await pool.promise().query(
			'INSERT INTO pastSpying (eventTime, attackerId, defenderId, attackingUnits, success, spoilsGold) VALUES (?, ?, ?, ?, ?, ?);', [pendingSpying.eventTime, pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits, spoilsGold ? 'success' : 'ineffective', spoilsGold])

		// Give gold to the attacker
		await pool.promise().query('UPDATE profiles SET gold = gold + ? WHERE accountId = ?;', [spoilsGold, pendingSpying.attackerId])

		// Remove gold from the defender
		await pool.promise().query('UPDATE profiles SET gold = gold - ? WHERE accountId = ?;', [spoilsGold, pendingSpying.defenderId])

		//delete from pending
		await pool.promise().query('DELETE FROM pendingSpying WHERE id = ?;', [pendingSpying.id])

		log('Spy succeeded', pendingSpying.attackerId, pendingSpying.defenderId, pendingSpying.attackingUnits, totalEyes, spoilsGold);

		spyStealEquipment(pendingSpying, spoilsGold);
	}

};

function spyStealEquipment(pendingSpying, spoilsGold) {
	let query = 'SELECT id FROM pastSpying WHERE eventTime = ? AND attackerId = ? AND defenderId = ? AND spoilsGold = ?;'; //make it VERY hard to grab the wrong one
	pool.query(query, [pendingSpying.eventTime, pendingSpying.attackerId, pendingSpying.defenderId, spoilsGold], (err, results) => {
		if (err) throw err;

		let successfulSpies = 0;

		for (let i = 0; i < pendingSpying.attackingUnits; i++) {
			//50% chance of stealing equipment
			if (Math.random() >= 0.5) {
				successfulSpies += 1;
			}
		}

		spyStealEquipmentInner(pendingSpying.attackerId, pendingSpying.defenderId, successfulSpies, results[0].id);
	});
};

const spyStealEquipmentInner = async (attackerId, defenderId, attackingUnits, pastSpyingId) => {
	//NOTE: steal equipment that isn't being carried by soldiers
	let attacking = await isAttacking(defenderId);
	// Get defenders equipment 
	let defenderEquipment = (await pool.promise().query('SELECT * FROM equipment WHERE accountId = ?;', [defenderId]))[0]

	let equipment = getEquipmentStatistics()

	//don't steal certain items
	defenderEquipment = defenderEquipment.filter(item => equipment[item.type][item.name].stealable);

	//if he's not attacking, skip to the next step
	// if (!attacking) {
	// return spyStealEquipmentSelectItemsToSteal(attackerId, defenderId, attackingUnits, defenderEquipment, pastSpyingId);
	// }

	//count the number of weapons/consumable items to be skipped, from strongest to weakest
	let defenderSoldiers = (await pool.promise().query('SELECT soldiers FROM profiles WHERE accountId = ?;', [defenderId]))[0];
	let soldierCount = defenderSoldiers[0].soldiers;

	// Armour
	let defenderArmour = (await pool.promise().query('SELECT * FROM equipment WHERE accountId = ? AND type = "Armour";', [defenderId]))[0];
	// ArmourResults
	//NOTE: Armour stays at home - it's never carried by soldiers (don't call removeForEachSoldier)

	//weapons
	let defenderWeapons = (await pool.promise().query('SELECT * FROM equipment WHERE accountId = ? AND type = "Weapon";', [defenderId]))[0];
	// Steal weapons
	let weaponResults = await removeForEachSoldier(defenderWeapons, soldierCount);

	// Get defender consumables
	let defenderConsumables = (await pool.promise().query('SELECT * FROM equipment WHERE accountId = ? AND type = "Consumable";', [defenderId]))[0];

	// Steal consumables
	let consumableResults = await removeForEachSoldier(defenderConsumables, soldierCount);

	//splice the two arrays back together
	// TODO: Something is fishy here. Don't understand
	let results = weaponResults.concat(consumableResults, defenderArmour);

	spyStealEquipmentSelectItemsToSteal(attackerId, defenderId, attackingUnits, results, pastSpyingId);
};

async function removeForEachSoldier(results, soldiers) {
	let statistics = getEquipmentStatistics()

	results.sort((a, b) => statistics[a.type][a.name].combatBoost < statistics[b.type][b.name].combatBoost);

	results = results.map((item) => {
		//count downwards
		if (item.quantity > soldiers) {
			item.quantity -= soldiers;
			soldiers = 0;
		} else {
			soldiers -= item.quantity;
			item.quantity = 0;
		}

		return item;
	});

	results = results.filter(item => item.quantity > 0);

	return results
}

/**
 * 
 * @param {*} attackerId 
 * @param {*} defenderId 
 * @param {*} attackingUnits 
 * @param {*} results 
 * @param {*} pastSpyingId 
 */
const spyStealEquipmentSelectItemsToSteal = async (attackerId, defenderId, attackingUnits, results, pastSpyingId) => {
	//count the total items
	let totalItems = 0;
	results.forEach((item) => totalItems += item.quantity);

	let items = [];

	for (let i = 0; i < attackingUnits; i++) {
		//select the specific item to steal
		let selection = Math.floor(Math.random() * totalItems);
		totalItems -= 1;

		//find the exact item that will be stolen (records[0])
		let records = results.filter((item) => {
			selection -= item.quantity;
			return selection < 0;
		});

		//move to items (quantity = 1)
		if (records.length > 0) {
			items.unshift({
				id: records[0].id,
				name: records[0].name,
				type: records[0].type,
				quantity: 1
			});
		}

		//remove it from results (decrement and/or delete)
		for (let i = 0; i < results.length; i++) {
			if (results[i].id === items[0].id) {
				results[i].quantity -= 1;
				if (results[i].quantity <= 0) {
					results.splice(i, 1);
				}
				break;
			}
		}

		//skip the rest
		if (results.length <= 0) {
			break;
		}
	}

	//collapse the {quantity:1} into {quantity:n}
	let collapsedItems = [];

	items.forEach((item) => {
		if (!collapsedItems[item.id]) {
			collapsedItems[item.id] = {
				...item
			};
		} else {
			collapsedItems[item.id].quantity += item.quantity;
		}
	});

	items = []; //clear

	collapsedItems.forEach((record) => {
		items.push(record);
	});

	//next steps
	spyStealEquipmentIncrementItemsToInventory(attackerId, items);
	spyStealEquipmentDecrementItemsFromInventory(defenderId, items);
	recordEquipmentStolen(items, pastSpyingId);
	if (items.length) {
		updateSuccessStatus('success', pastSpyingId); //QOL improvement
	}
};

async function spyStealEquipmentIncrementItemsToInventory(accountId, items) {
	//add the items to the players's inventory
	items.forEach(async (item) => {
		let results = (await pool.query(
			'SELECT * FROM equipment WHERE accountId = ? AND name = ? AND type = ?;',
			[accountId, item.name, item.type]))[0]

		let query;

		//if the player has this item, or not
		if (results.length > 0) {
			query = 'UPDATE equipment SET quantity = quantity + ? WHERE accountId = ? AND name = ? AND type = ?;';
		} else {
			query = 'INSERT INTO equipment (quantity, accountId, name, type) VALUES (?, ?, ?, ?);';
		}

		await pool.promise().query(query, [item.quantity, accountId, item.name, item.type])
	});

	//error checking
	items.forEach((item) => {
		pool.query('SELECT * FROM equipment WHERE accountId = ? AND name = ? AND type = ?;', [accountId, item.name, item.type], (err, results) => {
			if (err) throw err;

			if (results.length > 1) {
				log('WARNING: Duplicate items detected', JSON.stringify(results));
			}
		})
	});
};

async function spyStealEquipmentDecrementItemsFromInventory(accountId, items) {
	//remove these items from the player's inventory
	items.forEach(async (item) => {
		await pool.promise().query('UPDATE equipment SET quantity = quantity - ? WHERE accountId = ? AND id = ?;', [item.quantity, accountId, item.id])
	});

	//check to see if any quantities are negative
	pool.query('SELECT * FROM equipment WHERE quantity < 0;', (err, results) => {
		if (err) throw err;

		if (results.length !== 0) {
			log('WARNING: equipment quantity below zero', JSON.stringify(results));
		}
	});

	//clean the database from quantities of 0
	await pool.promise().query('DELETE FROM equipment WHERE accountId = ? AND quantity = 0;', [accountId])

	log('Cleaned database', 'equipment decrement');

};

function recordEquipmentStolen(items, pastSpyingId) {
	//record in the database
	let query = 'INSERT INTO equipmentStolen (pastSpyingId, name, type, quantity) VALUES (?, ?, ?, ?);';
	items.forEach(async (item) => {
		await pool.promise().query(query, [pastSpyingId, item.name, item.type, item.quantity])

		log('Items stolen', pastSpyingId, JSON.stringify(item));

	});
};

function updateSuccessStatus(status, pastSpyingId) {
	pool.query('UPDATE pastSpying SET success = ? WHERE id = ?;', [status, pastSpyingId])
}

module.exports = {
	spyRequest: spyRequest,
	spyStatusRequest: spyStatusRequest,
	spyLogRequest: spyLogRequest,
	runSpyTick: runSpyTick
};

//TODO: move balance variables to an external file (.env?)