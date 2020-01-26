//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

var express = require('express')


let {
	getBadgesStatistics,
	getBadgesOwned,
	getLadderData,
	getEquipmentOwned,
	getEquipmentStatistics,
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

let training = require('./training.js');

// Set up router
var router = express.Router();

router.post('/ladder', ladderRequest); // Leaderboard

// Require auth for all of the routes below
router.use(require('./../../middleware/auth').requireAuth);

router.post('/', profileRequest);
router.get('/', profileRequest);
router.get('/name/:username', profileRequest);
// router.post('/create', profileCreateRequest);
router.post('/train', trainRequest);
router.post('/untrain', untrainRequest);
router.post('/recruit', recruitRequest);
router.get('/recruit', recruitRequest);



/**
 * Profile creation route
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function profileCreateRequest(req, res) {
	//separate this section so it can be used elsewhere too
	//check ID, username and token match (only the profile's owner can create it)
		pool.query('SELECT accountId FROM sessions WHERE accountId IN (SELECT id FROM accounts WHERE username = ?) AND token = ?;', [body.username, body.token])
};


async function profileRequest(req, res) {
	let user = req.session.user;
	//separate this section so it can be used elsewhere too

	// Check if requesting your own profile
	let requestedUser = req.params.username || req.body.username || user.username;

	let private = (user.username === requestedUser);

	let profile = await ProfileFunctions.getProfile(requestedUser, private)
	if (profile) {
		res.status(200)
		res.json(profile)
		res.end();
	} else {
		res.status(403).end();
	}
};


async function trainRequest(req, res) {
	let user = req.session.user;

	// False = failure
	let result = await training.trainRequest(user.id, req.body.role)

	if (result) {
		res.status(400);
		res.write(result);
		res.end();
	} else {
		let profile = await ProfileFunctions.getProfile(user.username, true)

		let badgesOwned = await getBadgesOwned(user.id)

		let activeBadge = Object.keys(badgesOwned).find(name => badgesOwned[name].active) || null;

		res.status(200).json({
			username: user.username,
			gold: profile.gold,
			recruits: profile.recruits,
			soldiers: profile.soldiers,
			spies: profile.spies,
			scientists: profile.scientists,
			activeBadge: activeBadge
		});
		res.end();

		log('Train executed', user.username, req.body.role, user.id);
		logActivity(user.id);
	}
}

// A total copy of train request
async function untrainRequest(req, res) {
	let user = req.session.user;

	// False = failure
	let result = await training.untrainRequest(user.id, req.body.role)

	if (result) {
		res.status(400);
		res.write(result);
		res.end();
	} else {
		let profile = await ProfileFunctions.getProfile(user.username, true)

		let badgesOwned = await getBadgesOwned(user.id)

		let activeBadge = Object.keys(badgesOwned).find(name => badgesOwned[name].active) || null;

		res.status(200).json({
			username: user.username,
			gold: profile.gold,
			recruits: profile.recruits,
			soldiers: profile.soldiers,
			spies: profile.spies,
			scientists: profile.scientists,
			activeBadge: activeBadge
		});
		res.end();

		log('Untrain executed', user.username, req.body.role, user.id);
		logActivity(user.id);
	}
}

//actual actions to be taken
async function recruitRequest(req, res) {
	//verify enough time has passed since the last successful recruit action
	let user = req.session.user;

	// False = failure
	let result = await training.recruitRequest(user.id);

	if (result) {
		res.status(400);
		res.write(result);
		res.end();
	} else {
		let profile = await ProfileFunctions.getProfile(user.username, true)

		let badgesOwned = await getBadgesOwned(user.id)

		let activeBadge = Object.keys(badgesOwned).find(name => badgesOwned[name].active) || null;

		res.status(200).json({
			username: user.username,
			gold: profile.gold,
			recruits: profile.recruits,
			soldiers: profile.soldiers,
			spies: profile.spies,
			scientists: profile.scientists,
			activeBadge: activeBadge
		});
		res.end();

		log('Recruit executed', user.username, user.id);
		logActivity(user.id);
	}
};



async function ladderRequest(req, res) {
	let users = await getLadderData('ladderRank', req.body.start, req.body.length)

	// Not to crash if nobody is there?
	if (users.length === 0) {
		res.status(200).json([]);
		res.end();
	}

	for (let i = 0; i < users.length; i++) {
		let badgesOwned = await getBadgesOwned(users[i].id);

		users[i].activeBadge = Object.keys(badgesOwned).find(name => badgesOwned[name].active) || null;

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