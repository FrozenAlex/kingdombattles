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

// Request an attack
async function attackRequest(req, res) {
	let attacker = req.session.user;

	//verify that the defender's profile exists
	let results = (await pool.promise().query(
		'SELECT accountId FROM profiles WHERE accountId IN (SELECT id FROM accounts WHERE username = ?);', [req.body.defender]))[0]

	if (results.length !== 1) {
		res.status(400).write(log('Invalid defender credentials', attacker.id, attacker.username, req.body.defender));
		res.end();
		return;
	}

	let defenderId = results[0].accountId;

	//verify that the attacker has enough soldiers
	let attackerSoldiers = (await pool.promise().query('SELECT soldiers FROM profiles WHERE accountId = ?;', [attacker.id]))[0]
	if (attackerSoldiers[0].soldiers <= 0) {
		res.status(400).write(log('Not enough soldiers', attacker.id, req.body.defender, attackerSoldiers[0].soldiers));
		res.end();
		return;
	}

	let attackingUnits = attackerSoldiers[0].soldiers;

	//verify that the attacker is not already attacking someone
	let attacking = await isAttacking(attacker.id)
	if (attacking) {
		res.status(400).write(log('You are already attacking someone', attacker.id, attacker.username));
		res.end();
		return;
	}

	//create the pending attack record
	await pool.promise().query('INSERT INTO pendingCombat (eventTime, attackerId, defenderId, attackingUnits) VALUES (DATE_ADD(CURRENT_TIMESTAMP(), INTERVAL 60 * ? SECOND), ?, ?, ?);', [attackingUnits, attacker.id, defenderId, attackingUnits])

	res.status(200).json({
		status: 'attacking',
		attacker: attacker.id,
		defender: req.body.defender,
		msg: log('Attacking', attacker.username, req.body.defender)
	});
	res.end();

	logActivity(attacker.id);
};

async function attackStatusRequest(req, res) {
	let user = req.session.user;
	let attacking = await isAttacking(req.body.id || user.id)
	res.status(200).json({
		status: attacking ? 'attacking' : 'idle',
		defender: attacking
	});

	res.end();
};

async function combatLogRequest(req, res) {
	// User contains account id and username
	let user = req.session.user;

	let combatLog = (await pool.promise().query(
		'SELECT pastCombat.*, atk.username AS attacker, def.username AS defender FROM pastCombat JOIN accounts AS atk ON pastCombat.attackerId = atk.id JOIN accounts AS def ON pastCombat.defenderId = def.id WHERE atk.username = ? OR def.username = ? ORDER BY eventTime DESC LIMIT ?, ?;',
		[
			user.username,
			user.username,
			req.body.start,
			req.body.length
		]))[0]

	res.status(200).json(combatLog);
	log('Combat log sent', user.username, user.id, req.body.start, req.body.length);
};

function runCombatTick() {
	//once per second
	let combatTick = new CronJob('0 * * * * *', async () => {
		//find each pending combat
		let pendingCombatList = (await pool.promise().query('SELECT * FROM pendingCombat WHERE eventTime < CURRENT_TIMESTAMP();'))[0]

		// Concurrency issue if doing this every second
		// Execute all of them
		pendingCombatList.forEach(async (pendingCombat) => {
			// Attack script 

			// Check that the attacker still has enough soliders
			let attackerSoldiers = (await pool.promise().query('SELECT soldiers FROM profiles WHERE accountId = ?;', [pendingCombat.attackerId]))[0]

			// If there's no soldiers then delete the combat
			if (attackerSoldiers[0].soldiers < pendingCombat.attackingUnits) {
				//delete the failed combat
				await pool.promise().query('DELETE FROM pendingCombat WHERE id = ?;', [pendingCombat.id])

				// Log
				log('Not enough soldiers for attack', pendingCombat.attackerId, attackerSoldiers[0].soldiers, pendingCombat.attackingUnits);
				return;
			}

			//get the defender's undefended status
			let undefended = await isAttacking(pendingCombat.defenderId)

			//get the defending unit count, gold
			let defenderUnitsGold = (await pool.promise().query('SELECT soldiers, recruits, gold FROM profiles WHERE accountId = ?;', [pendingCombat.defenderId]))[0]

			// If the other party is attacking it means trained soldiers are away
			let defendingUnits;
			if (!undefended && defenderUnitsGold[0].soldiers > 0) {
				defendingUnits = defenderUnitsGold[0].soldiers;
			} else {
				defendingUnits = defenderUnitsGold[0].recruits;
				undefended = true; //recruits only
			}

			let equipmentQuery = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Weapon";';
			let consumableQuery = 'SELECT * FROM equipment WHERE accountId = ? AND type = "Consumable";';


			let battleStats = await Promise.all(
				pool.promise().query(equipmentQuery, [pendingCombat.attackerId]), // Attacker equipment
				pool.promise().query(consumableQuery, [pendingCombat.attackerId]), // Attacker consumables
				pool.promise().query(equipmentQuery, [pendingCombat.defenderId]), // Defender equipment
				pool.promise().query(consumableQuery, [pendingCombat.defenderId]) // Defender consumables
			)

			// 0 in the end gets rows
			let attackerEquipment = battleStats[0][0]
			let attackerConsumables = battleStats[1][0]
			let defenderEquipment = battleStats[2][0]
			let defenderConsumables = battleStats[3][0]

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
			let spoilsGold = Math.floor(defenderUnitsGold[0].gold * (victor === 'attacker' ? 0.1 : 0.02));
			let attackerCasualties = Math.floor((pendingCombat.attackingUnits >= 10 ? pendingCombat.attackingUnits : 0) * (victor === 'attacker' ? 0 : Math.random() / 5));

			//capture the flag logic
			let flagCaptured = await captureTheFlag(pendingCombat.attackerId, pendingCombat.defenderId, victor !== 'attacker')

			//save the combat
			await pool.promise().query('INSERT INTO pastCombat (eventTime, attackerId, defenderId, attackingUnits, defendingUnits, undefended, victor, spoilsGold, attackerCasualties, flagCaptured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
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
				])

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
			logDiagnostics('death', attackerCasualties);

			//clean the database
			await pool.promise().query(
				'DELETE FROM equipment WHERE quantity <= 0;'
			)
			// Log 
			log('Cleaned database', 'Combat consumables');

		});
	});

	combatTick.start();
};

//Part of runCombatTick
let removeConsumables = async (consumables, number) => {
	if (number > 0 && consumables.length > 0) {
		//if not rolling to the next stack after this
		if (number - consumables[0].quantity <= 0) {
			await pool.promise().query('UPDATE equipment SET quantity = quantity - ? WHERE id = ?;', [number, consumables[0].id])

			return;
		} else { //will be rolling to the next stack after this
			await pool.promise().query('UPDATE equipment SET quantity = 0 WHERE id = ?;', [consumables[0].id])

			//tick
			number -= consumables[0].quantity;
			consumables.shift();

			//it took me two hours to write this line; you can't make functions inside loops	
			return removeConsumables(consumables, number);
		}
	}
};

module.exports = {
	attackRequest: attackRequest,
	attackStatusRequest: attackStatusRequest,
	combatLogRequest: combatLogRequest,
	runCombatTick: runCombatTick
};