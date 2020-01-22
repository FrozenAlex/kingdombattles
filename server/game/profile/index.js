//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

var express = require('express')


let {
	getBadgesStatistics,
	getBadgesOwned,
	getLadderData,
	logActivity
} = require('./../../utilities.js');

// Profile functions
let ProfileFunctions = require('./profile.js')

//utilities
let {
	logDiagnostics
} = require('./../../diagnostics.js');
let {
	log
} = require('../../../common/utilities.js');

let pool = require('../../db/pool.js')

// Import other files


// Set up router
var router = express.Router();

router.post('/ladder', ladderRequest);  // Leaderboard

// Require auth for all of the routes below
router.use(require('./../../middleware/auth').requireAuth);

router.post('/', profileRequest);
// router.post('/create', profileCreateRequest);
// router.post('/train', trainRequest);
// router.post('/untrain', untrainRequest);
router.post('/recruit', recruitRequest);



/**
 * Profile creation route
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function profileCreateRequest(req, res) {
	//separate this section so it can be used elsewhere too
	//check ID, username and token match (only the profile's owner can create it)
	let query = 'SELECT accountId FROM sessions WHERE accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;';
	pool.query(query, [body.username, body.token])
};


async function profileRequest(req, res) {
	//separate this section so it can be used elsewhere too
	let profile  =  await ProfileFunctions.getProfile(req.body.username)
	if (profile) {
		res.json(profile)
		res.end(200);
	}	else {
		res.end(404);
	}
};



//actual actions to be taken
async function recruitRequest(req, res) {
	//verify enough time has passed since the last successful recruit action
	let query = 'SELECT TIMESTAMPDIFF(HOUR, (SELECT lastRecruitTime FROM profiles WHERE accountId = ?), CURRENT_TIMESTAMP());';
	pool.query(query, [req.body.id], (err, results) => {
		if (err) throw err;

		if (results.length !== 1) {
			res.status(400).write(log('Invalid database state', req.body.id, req.body.token));
			res.end();
			return;
		}

		let timespans = results[0][Object.keys(results[0])];

		//not enough time has passed
		if (timespans < 20) {
			res.status(400).write(log('Not enough time has passed', req.body.id, req.body.token));
			res.end();
			return;
		}

		//update the profile with the new data (gaining 1 recruit)
		let query = 'UPDATE profiles SET recruits = recruits + 1, lastRecruitTime = CURRENT_TIMESTAMP() WHERE accountId	= ?;';
		pool.query(query, [req.body.id], (err) => {
			if (err) throw err;

			//send the new profile data as JSON
			let query = 'SELECT username, profiles.* FROM profiles JOIN accounts ON accounts.id = profiles.accountId WHERE accounts.id = ?;';
			pool.query(query, [req.body.id], (err, results) => {
				if (err) throw err;

				//check just in case
				if (results.length !== 1) {
					res.status(400).write(log('Invalid recruit credentials - 2', req.body.id, req.body.token));
					res.end();
					return;
				}

				getBadgesOwned(connection, results[0].accountId, (err, {
					owned
				}) => {
					if (err) throw err;

					getBadgesStatistics((err, {
						statistics
					}) => {
						if (err) throw err;

						let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

						res.status(200).json({
							username: results[0].username,
							gold: results[0].gold,
							recruits: results[0].recruits,
							soldiers: results[0].soldiers,
							spies: results[0].spies,
							scientists: results[0].scientists,
							activeBadge: activeBadge,
							activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
						});
						res.end();

						log('Recruit successful', results[0].username, req.body.id, req.body.token);
						logDiagnostics(connection, 'recruit', 1);
						logActivity(req.body.id);
					});
				});
			});
		});
	});
};



async function ladderRequest(req, res) {
	let users = await getLadderData('ladderRank', req.body.start, req.body.length)

	// Not to crash if nobody is there?
	if (users.length === 0) {
		res.status(200).json([]);
		res.end();
	}

	for (let i = 0; i < users.length; i++) {
		let owned = await getBadgesOwned(users[i].id);

		users[i].activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

		//don't share IDs
		delete users[i].id;
	}

	//weird, because of async
	res.status(200).json(users);
	res.end();
	log('Ladder sent', req.body.start, req.body.length, users);
};

// Export router
module.exports = router;