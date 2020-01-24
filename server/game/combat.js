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
} = require('./../../common/utilities.js');
let pool = require("../db/pool.js");


let {
	getEquipmentStatistics,
	isAttacking,
	logActivity
} = require('./../utilities.js');
let {
	captureTheFlag
} = require('./badges.js');

const attackRequest = (req, res) => {
	let attacker = req.session.user;

		//verify that the defender's profile exists
		let query = 'SELECT accountId FROM profiles WHERE accountId IN (SELECT id FROM accounts WHERE username = ?);';
		pool.query(query, [req.body.defender], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid defender credentials', req.body.id, req.body.attacker, req.body.defender, req.body.token));
				res.end();
				return;
			}

			let defenderId = results[0].accountId;

			//verify that the attacker has enough soldiers
			let query = 'SELECT soldiers FROM profiles WHERE accountId = ?;';
			pool.query(query, [req.body.id], (err, results) => {
				if (err) throw err;

				if (results[0].soldiers <= 0) {
					res.status(400).write(log('Not enough soldiers', req.body.attacker, req.body.defender, results[0].soldiers));
					res.end();
					return;
				}

				let attackingUnits = results[0].soldiers;

				//verify that the attacker is not already attacking someone
				isAttacking(req.body.attacker, (err, attacking) => {
					if (err) throw err;

					if (attacking) {
						res.status(400).write(log('You are already attacking someone', req.body.id, req.body.attacker, req.body.token));
						res.end();
						return;
					}

					//create the pending attack record
					let query = 'INSERT INTO pendingCombat (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 60 * ? SECOND), ?, ?, ?);';
					pool.query(query, [attackingUnits, req.body.id, defenderId, attackingUnits], (err) => {
						if (err) throw err;

						res.status(200).json({
							status: 'attacking',
							attacker: req.body.attacker,
							defender: req.body.defender,
							msg: log('Attacking', req.body.attacker, req.body.defender)
						});
						res.end();

						logActivity(req.body.id);
					});
				});
			});
		});
};

const attackStatusRequest = (connection) => (req, res) => {
	//verify the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	pool.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid attack status request credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		isAttacking(connection, req.body.id, (err, attacking, defender) => {
			if (err) throw err;

			res.status(200).json({
				status: attacking ? 'attacking' : 'idle',
				defender: defender
			});

			res.end();
		});
	});
};

const combatLogRequest = (connection) => (req, res) => {
	//verify the user's credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	pool.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid combat log credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		//grab the username based on the ID
		let query = 'SELECT username FROM accounts WHERE id = ?;';
		pool.query(query, [req.body.id], (err, results) => {
			if (err) throw err;

			let cachedName = results[0].username; //HOTFIX

			let query = 'SELECT pastCombat.*, atk.username AS attacker, def.username AS defender FROM pastCombat JOIN accounts AS atk ON pastCombat.attackerId = atk.id JOIN accounts AS def ON pastCombat.defenderId = def.id WHERE atk.username = ? OR def.username = ? ORDER BY eventTime DESC LIMIT ?, ?;';
			pool.query(query, [results[0].username, results[0].username, req.body.start, req.body.length], (err, results) => {
				if (err) throw err;

				res.status(200).json(results);
				log('Combat log sent', cachedName, req.body.id, req.body.token, req.body.start, req.body.length);
			});
		});
	});
};

const runCombatTick = (connection) => {
	//once per second
	let combatTick = new CronJob('* * * * * *', async () => {
		//find each pending combat
		let pendingCombatList = (await pool.promise().query('SELECT * FROM pendingCombat WHERE eventTime < CURRENT_TIMESTAMP();'))[0]

		// Execute all of them
		pendingCombatList.forEach(async (pendingCombat) => {
			// Attack script 

			// Check that the attacker still has enough soliders
			let attackerSoldiers = (await pool.query('SELECT soldiers FROM profiles WHERE accountId = ?;', [pendingCombat.attackerId]))[0]

			// If there's no soldiers then delete the combat
			if (results[0].soldiers < pendingCombat.attackingUnits) {
				//delete the failed combat
				await pool.promise().query('DELETE FROM pendingCombat WHERE id = ?;', [pendingCombat.id])
				
				// Log
				log('Not enough soldiers for attack', pendingCombat.attackerId, results[0].soldiers, pendingCombat.attackingUnits);
				return;
			}

			//get the defender's undefended status
			let undefended = await isAttacking(pendingCombat.defenderId)

			//get the defending unit count, gold
			let defenderUnitsGold = (await pool.query('SELECT soldiers, recruits, gold FROM profiles WHERE accountId = ?;', [pendingCombat.defenderId]))[0]

			// If the other party is attacking it means trained soldiers are away
			let defendingUnits;
			if (!undefended && defenderUnitsGold[0].soldiers > 0) {
				defendingUnits = defenderUnitsGold[0].soldiers;
			} else {
				defendingUnits = defenderUnitsGold[0].recruits;
				undefended = true; //recruits only
			}

			// For now no performance optimisations
			// TODO: Make the requests in parallel
			let equipmentQuery = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Weapon";';
			let consumableQuery = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Consumable";';

			let attackerEquipment = (await pool.promise().query(equipmentQuery, [pendingCombat.attackerId]))[0]
			let attackerConsumables = (await pool.promise().query(consumableQuery, [pendingCombat.attackerId]))[0]
			let defenderEquipment = (await pool.promise().query(equipmentQuery, [pendingCombat.defenderId]))[0]
			let defenderConsumables = (await pool.promise().query(consumableQuery, [pendingCombat.defenderId]))[0]

			// Get equipment parameters
			let equipmentStats = getEquipmentStatistics();

			//get the combat boosts from equipment, from highest to lowest
			attackerEquipment.sort((a, b) => equipmentStats[a.type][a.name].combatBoost < equipmentStats[b.type][b.name].combatBoost);
			let attackerEquipmentBoost = 0;
			for (let i = 0; i < pendingCombat.attackingUnits; i++) {
				attackerEquipmentBoost += attackerEquipment[i] ? equipmentStats[attackerEquipment[i].type][attackerEquipment[i].name].combatBoost : 0;
			}

			defenderEquipment.sort((a, b) => equipmentStats[a.type][a.name].combatBoost < equipmentStats[b.type][b.name].combatBoost);
			let defenderEquipmentBoost = 0;
			for (let i = 0; i < defendingUnits; i++) {
				defenderEquipmentBoost += defenderEquipment[i] ? equipmentStats[defenderEquipment[i].type][defenderEquipment[i].name].combatBoost : 0;
			}

			//get the boosts from consumables
			attackerConsumables.sort((a, b) => equipmentStats[a.type][a.name].combatBoost < equipmentStats[b.type][b.name].combatBoost);
			let attackerConsumablesBoost = 0;
			for (let i = 0; i < pendingCombat.attackingUnits; i++) {
				attackerConsumablesBoost += attackerConsumables[i] ? equipmentStats[attackerConsumables[i].type][attackerConsumables[i].name].combatBoost : 0;
			}

			defenderConsumables.sort((a, b) => {
				equipmentStats[a.type][a.name].combatBoost < equipmentStats[b.type][b.name].combatBoost
			});
			let defenderConsumablesBoost = 0;
			for (let i = 0; i < defendingUnits; i++) {
				defenderConsumablesBoost += defenderConsumables[i] ? equipmentStats[defenderConsumables[i].type][defenderConsumables[i].name].combatBoost : 0;
			}

			//determine the victor (defender wants high rand, attacker wants low rand)
			let rand = Math.random() * (pendingCombat.attackingUnits + defenderEquipmentBoost + defenderConsumablesBoost + defendingUnits * (undefended ? 0.25 : 1));
			let victor = rand <= attackerEquipmentBoost + attackerConsumablesBoost + pendingCombat.attackingUnits ? 'attacker' : 'defender';

			//determine the spoils and casualties
			let spoilsGold = Math.floor(results[0].gold * (victor === 'attacker' ? 0.1 : 0.02));
			let attackerCasualties = Math.floor((pendingCombat.attackingUnits >= 10 ? pendingCombat.attackingUnits : 0) * (victor === 'attacker' ? 0 : Math.random() / 5));

			//capture the flag logic
			let flagCaptured = await captureTheFlag(pendingCombat.attackerId, pendingCombat.defenderId, victor !== 'attacker')

			//save the combat
			let query = 'INSERT INTO pastCombat (eventTime, attackerId, defenderId, attackingUnits, defendingUnits, undefended, victor, spoilsGold, attackerCasualties, flagCaptured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
			(await pool.promise().query(query,
				[
					pendingCombat.eventTime,
					pendingCombat.attackerId,
					pendingCombat.defenderId,
					pendingCombat.attackingUnits,
					defendingUnits,
					undefended,
					victor,
					spoilsGold,
					attackerCasualties,
					flagCaptured
				]))

			//update the attacker profile
			let updateAttackerQuery = 'UPDATE profiles SET gold = gold + ?, soldiers = soldiers - ? WHERE accountId = ?;';
			await pool.promise().query(updateAttackerQuery,
				[spoilsGold, attackerCasualties, pendingCombat.attackerId]
			)

			//update the defender profile
			await pool.promise().query('UPDATE profiles SET gold = gold - ? WHERE accountId = ?;',
				[spoilsGold, pendingCombat.defenderId]
			)

			// remove used consumables (moved because callback hell is rediculous)
			removeConsumables(attackerConsumables, pendingCombat.attackingUnits);
			removeConsumables(defenderConsumables, defendingUnits);

			//delete the pending combat
			await pool.promise().query(
				'DELETE FROM pendingCombat WHERE id = ?;',
				[pendingCombat.id]
			);

			log('Combat executed', pendingCombat.attackerId, pendingCombat.defenderId, victor, spoilsGold);
			logDiagnostics(connection, 'death', attackerCasualties);

			//clean the database
			pool.promise().query(
				'DELETE FROM equipment WHERE quantity <= 0;'
			)
			// Log 
			log('Cleaned database', 'Combat consumables');

		});
	});

	combatTick.start();
};

//Part of runCombatTick
let removeConsumables = (consumables, number) => {
	if (number > 0 && consumables.length > 0) {
		//if not rolling to the next stack after this
		if (number - consumables[0].quantity <= 0) {
			let query = 'UPDATE equipment SET quantity = quantity - ? WHERE id = ?;';
			pool.query(query, [number, consumables[0].id], (err) => {
				if (err) throw err;
			});

			return;
		} else { //will be rolling to the next stack after this
			let query = 'UPDATE equipment SET quantity = 0 WHERE id = ?;';

			pool.query(query, [consumables[0].id], (err) => {
				if (err) throw err;

				//tick
				number -= consumables[0].quantity;
				consumables.shift();

				//it took me two hours to write this line; you can't make functions inside loops	
				return removeConsumables(consumables, number);
			});
		}
	}
};

module.exports = {
	attackRequest: attackRequest,
	attackStatusRequest: attackStatusRequest,
	combatLogRequest: combatLogRequest,
	runCombatTick: runCombatTick
};