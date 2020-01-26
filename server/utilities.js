//environment variables
require('dotenv').config();

const pool = require("./db/pool.js")

//utilities
let {
	log
} = require('../common/utilities.js');

function getEquipmentStatistics() {
	//TODO: apiVisible field
	return require('./data/equipment_statistics.json')
};

const getEquipmentOwned = async (id) => {
	let results = (await pool.promise().query('SELECT * FROM equipment WHERE accountId = ?;', [id]))[0]

	let ret = {};

	Object.keys(results).map((key) => {
		if (ret[results[key].name] !== undefined) {
			log('WARNING: Invalid database state, equipment owned', id, JSON.stringify(results));
		}
		ret[results[key].name] = results[key].quantity;
	});

	return ret;
};

function getBadgesStatistics() {
	//TODO: apiVisible field
	return {
		'statistics': require('./data/badge_statistics.json')
	};
};

const getBadgesOwned = async (id) => {
	// Get badges
	let badges = (await pool.promise().query('SELECT name, active FROM badges WHERE accountId = ?;', [id]))[0]
	let ret = {}; //names, active

	Object.keys(badges).map((key) => {
		if (ret[badges[key].name] !== undefined) {
			log('WARNING: Invalid database state, badges owned', id, JSON.stringify(badges));
		}
		ret[badges[key].name] = {
			active: badges[key].active
		};
	});

	//NOTE: check for "Capture The Flag" badge, force it to be the active badge
	if ("Capture The Flag" in ret) {
		Object.keys(ret).map((key) => ret[key].active = false);
		ret["Capture The Flag"].active = true;
	}

	return ret;
}

function isNormalInteger(str) {
	let n = Math.floor(Number(str));
	return n !== Infinity && String(n) == str && n >= 0;
};

const isAttacking = async (user) => {
	let query;

	if (isNormalInteger(user)) {
		query = 'SELECT * FROM pendingCombat WHERE attackerId = ?;';
	} else if (typeof (user) === 'string') {
		query = 'SELECT * FROM pendingCombat WHERE attackerId IN (SELECT id FROM accounts WHERE username = ?);';
	} else {
		throw TypeError(`isAttacking: Unknown argument type for user: ${typeof(user)}`);
	}

	let attacking = (await pool.promise().query(query, [user]))[0];
	if (attacking.length === 0) {
		// Don't return anything
		return null
	} else {
		//get the username of the person being attacked
		let results = (await pool.promise().query('SELECT username FROM accounts WHERE id = ?;', [attacking[0].defenderId]))[0]
		return results[0].username;
	}
};

/**
 * Checks if the user is currently spying
 * @param {number|string} user Username or account ID 
 */
const isSpying = async (user) => {
	let query;

	// Check type of the passed value
	if (isNormalInteger(user)) {
		query = 'SELECT * FROM pendingSpying WHERE attackerId = ?;';
	} else if (typeof (user) === 'string') {
		query = 'SELECT * FROM pendingSpying WHERE attackerId IN (SELECT id FROM accounts WHERE username = ?);';
	} else {
		throw TypeError(`isSpying: Unknown argument type for user: ${typeof(user)}`);
	}

	let results = (await pool.promise().query(query, [user]))[0];

	if (results.length === 0) {
		return false;
	} else {
		//get the username of the person being spied on

		let spyingVictim = (await pool.promise().query(
			'SELECT username FROM accounts WHERE id = ?;',
			[results[0].defenderId]))[0];
		return spyingVictim[0].username;
	}
};

/**
 * Get account ranking
 * @param {*} field 
 * @param {*} start 
 * @param {*} length 
 */
const getLadderData = async (field, start, length) => {
	//moved here for reusability
	//TODO: implement the field parameter

	let results = (await pool.promise().query(
		'SELECT accounts.id AS id, username, soldiers, recruits, gold FROM accounts JOIN profiles ON accounts.id = profiles.accountId ORDER BY -ladderRank DESC LIMIT ?, ?;',
		[Math.max(0, start || 0), Math.max(0, length || 0)]))[0]
	return results;
};

/**
 * Updates accounts last activity time
 * @param {number} id Account ID
 */
function logActivity(id) {
	// Don
	pool.promise().query('UPDATE accounts SET lastActivityTime = CURRENT_TIMESTAMP() WHERE id = ?;', [id])
};

module.exports = {
	getEquipmentStatistics: getEquipmentStatistics,
	getEquipmentOwned: getEquipmentOwned,
	getBadgesStatistics: getBadgesStatistics,
	getBadgesOwned: getBadgesOwned,
	isAttacking: isAttacking,
	isSpying: isSpying,
	getLadderData: getLadderData,
	logActivity: logActivity
};