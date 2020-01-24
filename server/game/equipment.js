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
	}

	//send specific fields
	switch (req.body.field) {
		case 'statistics':
			let statisticsObj = getEquipmentStatistics()
			res.status(200).json(statisticsObj);
			res.end();

		case 'owned':
			let ownedObj = await getEquipmentOwned(user.id)
			res.status(200).json({
				"owned": ownedObj
			});
			res.end();

		default:
			res.status(400).write(log('Unknown field received', user.id, user.username, req.body.field));
			res.end();
	}
};

async function purchaseRequest(req, res) {
	// User is stored in session
	let user = req.session.user;

	//no purchasing if you're attacking
	let attacking = await isAttacking(user.id);
	if (attacking) {
		res.status(400).write(log('Can\'t purchase while attacking', ruser.id, req.body.token));
		res.end();
		return;
	}
	let spying = isSpying(user.id);
	if (spying) {
		res.status(400).write(log('Can\'t purchase while spying', req.body.id, req.body.token));
		res.end();
		return;
	}

	//get the player's gold
	let playergold = (await pool.promise().query('SELECT gold, scientists FROM profiles WHERE accountId = ?;', [req.body.id]))[0]

	//get the stats for all objects
	let statistics = getEquipmentStatistics()

	//valid parameters
	if (!statistics[req.body.type] || !statistics[req.body.type][req.body.name]) {
		res.status(400).write(log('Invalid equipment purchase parameters', req.body.id, req.body.token, req.body.type, req.body.name));
		res.end();
		return;
	}

	//enough gold?
	if (playergold[0].gold < statistics[req.body.type][req.body.name].cost) {
		res.status(400).write(log('Not enough gold', req.body.id, req.body.token, req.body.type, req.body.name));
		res.end();
		return;
	}

	//for sale?
	if (!statistics[req.body.type][req.body.name].visible || !statistics[req.body.type][req.body.name].purchasable) {
		res.status(400).write(log('Item not for sale', req.body.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//high enough level?
	if (playergold[0].scientists < statistics[req.body.type][req.body.name].scientistsRequired) {
		res.status(400).write(log('Not enough scientists', req.body.id, req.body.type, req.body.name));
		res.end();
		return;
	}

	//purchase approved.

	//get the user's current item data (including quantity)
	let playerItems = (await pool.promise().query(
		'SELECT * FROM equipment WHERE accountId = ? AND name = ?;',
		[req.body.id, req.body.name]))[0]

	//add to or update the record
	let query;
	if (playerItems.length > 0) {
		query = 'UPDATE equipment SET quantity = quantity + 1 WHERE accountId = ? AND name = ? AND type = ?;';
	} else {
		query = 'INSERT INTO equipment (accountId, name, type, quantity) VALUES (?, ?, ?, 1);';
	}

	await pool.promise().query(query, [req.body.id, req.body.name, req.body.type])

	//remove gold from the user's account
	await pool.promise().query('UPDATE profiles SET gold = gold - ? WHERE accountId = ?;', [statistics[req.body.type][req.body.name].cost, req.body.id])

	//return the new owned data
	let ownedEquipment = await getEquipmentOwned(req.body.id)

	res.status(200).json({
		owned: ownedEquipment
	}); //TODO: Why is assign here?
	res.end();

	log('Purchase made', req.body.id, req.body.token, req.body.type, req.body.name);

	logActivity(req.body.id);


}

async function sellRequest(req, res) {
	//validate the credentials
	pool.query('SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;', [req.body.id, req.body.token], (err, credentials) => {
		if (err) throw err;

		if (credentials[0].total !== 1) {
			res.status(400).write(log('Invalid equipment sell credentials', JSON.stringify(body), body.id, body.token));
			res.end();
			return;
		}

		//no selling if you're attacking
		isAttacking(connection, req.body.id, (err, attacking) => {
			if (err) throw err;

			if (attacking) {
				res.status(400).write(log('Can\'t sell while attacking', req.body.id, req.body.token, req.body.type, req.body.name));
				res.end();
				return;
			}

			isSpying(connection, req.body.id, (err, spying) => {
				if (err) throw err;

				if (spying) {
					res.status(400).write(log('Can\'t sell while spying', req.body.id, req.body.token, req.body.type, req.body.name));
					res.end();
					return;
				}

				//get the player's item quantity
				pool.query('SELECT * FROM equipment WHERE accountId = ? AND type = ? AND name = ?;', [req.body.id, req.body.type, req.body.name],async  (err, results) => {
					if (err) throw err;

					if (results.length === 0) {
						res.status(400).write(log('Can\'t sell something you don\'t own', req.body.id, req.body.token, req.body.type, req.body.name));
						res.end();
						return;
					}

					//get the stats for all objects
					let statistics = getEquipmentStatistics()
					//valid parameters
					if (!statistics[req.body.type] || !statistics[req.body.type][req.body.name]) {
						res.status(400).write(log('Invalid equipment sell parameters', req.body.id, req.body.token, req.body.type, req.body.name));
						res.end();
						return;
					}

					//for sale?
					if (!statistics[req.body.type][req.body.name].saleable) {
						res.status(400).write(log('Item can\'t be sold', req.body.id, req.body.token, req.body.type, req.body.name));
						res.end();
						return;
					}

					//sale approved.

					//add gold to the user's account
					await pool.promise().query('UPDATE profiles SET gold = gold + ? WHERE accountId = ?;', [Math.floor(statistics[req.body.type][req.body.name].cost / 2), req.body.id])

					//remove the item from the inventory
					await pool.promise().query('UPDATE equipment SET quantity = quantity - 1 WHERE id = ?;', [results[0].id])

					//return the new owned data
					let ownedEquipment = await getEquipmentOwned(req.body.id)

					res.status(200).json(Object.assign(ownedEquipment));
					res.end();

					log('Sale made', req.body.id, req.body.token, req.body.type, req.body.name);

					//Extra: clean the database
					await pool.promise().query('DELETE FROM equipment WHERE quantity <= 0;')

					log('Cleaned database', 'equipment sale');

					logActivity(req.body.id);
				});
			});
		});
	});

}

module.exports = {
	equipmentRequest: equipmentRequest,
	purchaseRequest: purchaseRequest,
	sellRequest,
	sellRequest
};