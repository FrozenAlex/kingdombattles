//environment variables
require('dotenv').config();

//utilities
let {
	log
} = require('../../common/utilities.js');

let {
	getEquipmentStatistics,
	getEquipmentOwned,
	isAttacking,
	isSpying,
	logActivity
} = require('./../utilities.js');

const pool = require('./../db/pool.js');

async function equipmentRequest(req, res) {
	// User is stored in session. We can add viewing equipment of others but it can wait
	let user = req.session.user;

	//if no field received, send everything
	if (!req.body.field) {
		//compose the returned objects
		let statisticsObj = getEquipmentStatistics()

		let ownedObj = await getEquipmentOwned(user.id)

		//finally, compose the resulting objects
		res.status(200).json(Object.assign({}, statisticsObj, {
			"owned": ownedObj
		}));
		res.end();
	} else {
		//send specific fields
		switch (req.body.field) {
			case 'statistics':
				let statisticsObj = getEquipmentStatistics()
				res.status(200).json(statisticsObj);
				res.end();
				break;
			case 'owned':
				let ownedObj = await getEquipmentOwned(user.id)
				res.status(200).json({
					"owned": ownedObj
				});
				res.end();
				break;
			default:
				res.status(400).write(log('Unknown field received', user.id, user.username, req.body.field));
				res.end();
				break;
		}
	}


};

async function purchaseRequest(req, res) {
	// User is stored in session
	let user = req.session.user;

	//no purchasing if you're attacking
	let attacking = await isAttacking(user.id);
	if (attacking) {
		res.status(400).write(log('Can\'t purchase while attacking', user.id, req.body.token));
		res.end();
		return;
	}
	let spying = isSpying(user.id);

	if (spying) {
		res.status(400).write(log('Can\'t purchase while spying', user.id, req.body.token));
		res.end();
		return;
	}

	//get the player's gold
	let playergold = (await pool.promise().query('SELECT gold, scientists FROM profiles WHERE accountId = ?;', [user.id]))[0]

	//get the stats for all objects
	let statistics = getEquipmentStatistics()

	//valid parameters
	if (!statistics[req.body.type] || !statistics[req.body.type][req.body.name]) {
		res.status(400).write(log('Invalid equipment purchase parameters', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//enough gold?
	if (playergold[0].gold < statistics[req.body.type][req.body.name].cost) {
		res.status(400).write(log('Not enough gold', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//for sale?
	if (!statistics[req.body.type][req.body.name].visible || !statistics[req.body.type][req.body.name].purchasable) {
		res.status(400).write(log('Item not for sale', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//high enough level?
	if (playergold[0].scientists < statistics[req.body.type][req.body.name].scientistsRequired) {
		res.status(400).write(log('Not enough scientists', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//purchase approved.

	//get the user's current item data (including quantity)
	let playerItems = (await pool.promise().query(
		'SELECT * FROM equipment WHERE accountId = ? AND name = ?;',
		[user.id, req.body.name]))[0]

	//add to or update the record
	let query;
	if (playerItems.length > 0) {
		query = 'UPDATE equipment SET quantity = quantity + 1 WHERE accountId = ? AND name = ? AND type = ?;';
	} else {
		query = 'INSERT INTO equipment (accountId, name, type, quantity) VALUES (?, ?, ?, 1);';
	}

	await pool.promise().query(query, [user.id, req.body.name, req.body.type])

	//remove gold from the user's account
	await pool.promise().query('UPDATE profiles SET gold = gold - ? WHERE accountId = ?;', [statistics[req.body.type][req.body.name].cost, user.id])

	//return the new owned data
	let ownedEquipment = await getEquipmentOwned(user.id)

	res.status(200).json({
		owned: ownedEquipment
	}); //TODO: Why is assign here?
	res.end();

	log('Purchase made', user.id, req.body.token, req.body.type, req.body.name);

	logActivity(user.id);


}

async function sellRequest(req, res) {
	let user = req.session

	let attacking = await isAttacking(user.id)

	if (attacking) {
		res.status(400).write(log('Can\'t sell while attacking', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	let spying = await isSpying(user.id)

	if (spying) {
		res.status(400).write(log('Can\'t sell while spying', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//get the player's item quantity
	let playerItems = await pool.promise().query(
		'SELECT * FROM equipment WHERE accountId = ? AND type = ? AND name = ?;',
		[user.id, req.body.type, req.body.name])

	if (playerItems.length === 0) {
		res.status(400).write(log('Can\'t sell something you don\'t own', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//get the stats for all objects
	let statistics = getEquipmentStatistics()
	//valid parameters
	if (!statistics[req.body.type] || !statistics[req.body.type][req.body.name]) {
		res.status(400).write(log('Invalid equipment sell parameters', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//for sale?
	if (!statistics[req.body.type][req.body.name].saleable) {
		res.status(400).write(log('Item can\'t be sold', user.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//sale approved.

	//add gold to the user's account
	await pool.promise().query('UPDATE profiles SET gold = gold + ? WHERE accountId = ?;', [Math.floor(statistics[req.body.type][req.body.name].cost / 2), req.body.id])

	//remove the item from the inventory
	await pool.promise().query('UPDATE equipment SET quantity = quantity - 1 WHERE id = ?;', [results[0].id])

	//return the new owned data
	let ownedEquipment = await getEquipmentOwned(user.id)

	res.status(200).json(Object.assign(ownedEquipment));
	res.end();

	log('Sale made', user.id, req.body.type, req.body.name);

	//Extra: clean the database
	await pool.promise().query('DELETE FROM equipment WHERE quantity <= 0;')

	log('Cleaned database', 'equipment sale');

	logActivity(user.id);

}

module.exports = {
	equipmentRequest: equipmentRequest,
	purchaseRequest: purchaseRequest,
	sellRequest,
	sellRequest
};