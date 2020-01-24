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
		res.status(200).json(Object.assign({}, statisticsObj, ownedObj));
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
			res.status(200).json(ownedObj);
			res.end();

		default:
			res.status(400).write(log('Unknown field received', user.id, user.username, req.body.field));
			res.end();
	}
};

async function purchaseRequest(req, res) {
	//validate the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	pool.query(query, [req.body.id, req.body.token], (err, credentials) => {
		if (err) throw err;

		if (credentials[0].total !== 1) {
			res.status(400).write(log('Invalid equipment purchase credentials', JSON.stringify(body), body.id, body.token));
			res.end();
			return;
		}

		//no purchasing if you're attacking
		isAttacking(connection, req.body.id, (err, attacking) => {
			if (err) throw err;

			if (attacking) {
				res.status(400).write(log('Can\'t purchase while attacking', req.body.id, req.body.token, req.body.type, req.body.name));
				res.end();
				return;
			}

			isSpying(connection, req.body.id, (err, spying) => {
				if (err) throw err;

				if (spying) {
					res.status(400).write(log('Can\'t purchase while spying', req.body.id, req.body.token, req.body.type, req.body.name));
					res.end();
					return;
				}

				//get the player's gold
				let query = 'SELECT gold, scientists FROM profiles WHERE accountId = ?;';
				pool.query(query, [req.body.id], (err, results) => {
					if (err) throw err;

					//just in case
					if (results.length === 0) {
						res.status(400).write(log('Purchase made on unrecognized account', req.body.id, req.body.token));
						res.end();
						return;
					}

					//get the stats for all objects
					getEquipmentStatistics((err, {
						statistics
					}) => {
						if (err) throw err;

						//valid parameters
						if (!statistics[req.body.type] || !statistics[req.body.type][req.body.name]) {
							res.status(400).write(log('Invalid equipment purchase parameters', req.body.id, req.body.token, req.body.type, req.body.name));
							res.end();
							return;
						}

						//enough gold?
						if (results[0].gold < statistics[req.body.type][req.body.name].cost) {
							res.status(400).write(log('Not enough gold', req.body.id, req.body.token, req.body.type, req.body.name));
							res.end();
							return;
						}

						//for sale?
						if (!statistics[req.body.type][req.body.name].visible || !statistics[req.body.type][req.body.name].purchasable) {
							res.status(400).write(log('Item not for sale', req.body.id, req.body.token, req.body.type, req.body.name));
							res.end();
							return;
						}

						//high enough level?
						if (results[0].scientists < statistics[req.body.type][req.body.name].scientistsRequired) {
							res.status(400).write(log('Not enough scientists', req.body.id, req.body.token, req.body.type, req.body.name));
							res.end();
							return;
						}

						//purchase approved.

						//get the user's current item data (including quantity)
						let query = 'SELECT * FROM equipment WHERE accountId = ? AND name = ?;';
						pool.query(query, [req.body.id, req.body.name], (err, results) => {
							if (err) throw err;

							//add to or update the record
							let query;
							if (results.length > 0) {
								query = 'UPDATE equipment SET quantity = quantity + 1 WHERE accountId = ? AND name = ? AND type = ?;';
							} else {
								query = 'INSERT INTO equipment (accountId, name, type, quantity) VALUES (?, ?, ?, 1);';
							}

							pool.query(query, [req.body.id, req.body.name, req.body.type], (err) => {
								if (err) throw err;

								//remove gold from the user's account
								let query = 'UPDATE profiles SET gold = gold - ? WHERE accountId = ?;';
								pool.query(query, [statistics[req.body.type][req.body.name].cost, req.body.id], (err) => {
									if (err) throw err;

									//return the new owned data
									getEquipmentOwned(connection, req.body.id, (err, results) => {
										if (err) throw err;

										res.status(200).json(Object.assign(results)); //TODO: Why is assign here?
										res.end();

										log('Purchase made', req.body.id, req.body.token, req.body.type, req.body.name);

										logActivity(req.body.id);
									});
								});
							});
						});
					});
				});
			});
		});
	});
}

async function sellRequest(req, res) {
	//validate the credentials
	let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
	pool.query(query, [req.body.id, req.body.token], (err, credentials) => {
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
				let query = 'SELECT * FROM equipment WHERE accountId = ? AND type = ? AND name = ?;';
				pool.query(query, [req.body.id, req.body.type, req.body.name], (err, results) => {
					if (err) throw err;

					if (results.length === 0) {
						res.status(400).write(log('Can\'t sell something you don\'t own', req.body.id, req.body.token, req.body.type, req.body.name));
						res.end();
						return;
					}

					//get the stats for all objects
					getEquipmentStatistics((err, {
						statistics
					}) => {
						if (err) throw err;

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
						let query = 'UPDATE profiles SET gold = gold + ? WHERE accountId = ?;';
						pool.query(query, [Math.floor(statistics[req.body.type][req.body.name].cost / 2), req.body.id], (err) => {
							if (err) throw err;

							//remove the item from the inventory
							let query = 'UPDATE equipment SET quantity = quantity - 1 WHERE id = ?;';
							pool.query(query, [results[0].id], (err) => {
								if (err) throw err;

								//return the new owned data
								getEquipmentOwned(connection, req.body.id, (err, results) => {
									if (err) throw err;

									res.status(200).json(Object.assign(results));
									res.end();

									log('Sale made', req.body.id, req.body.token, req.body.type, req.body.name);

									//Extra: clean the database
									let query = 'DELETE FROM equipment WHERE quantity <= 0;';
									pool.query(query, (err) => {
										if (err) throw err;

										log('Cleaned database', 'equipment sale');

										logActivity(req.body.id);
									});
								});
							});
						});
					});
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