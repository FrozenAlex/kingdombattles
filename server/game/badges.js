//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;
const pool = require('./../db/pool.js');
//utilities
let {
	log
} = require('../../common/utilities.js');

let {
	logActivity,
	getBadgesStatistics,
	getBadgesOwned,
	getLadderData
} = require('./../utilities.js');

const ownedRequest = async (req, res) => {
	// get user badges
	let badgesOwned = await getBadgesOwned(req.body.id)

	// Send badges
	res.status(200).json(badgesOwned);
	res.end();

	// Log badges
	log('Badges owned sent', req.body.id);
}


const selectActiveBadge = async (req, res) => {

	let user = req.session.user;

	//check to see if the player owns this badge
	let ownedBadges = await getBadgesOwned(user.id)

	if (req.body.name !== null && !ownedBadges[req.body.name]) {
		res.status(400).write('You don\'t own that badge');
		res.end();
		return;
	}

	//if Capture The Flag is active, don't change the active badge; return badges owned
	if (ownedBadges["Capture The Flag"]) {
		res.status(200).json(ownedBadges);
		res.end();
		return;
	}

	//zero out the user's selection
	await pool.promise().query('UPDATE badges SET active = FALSE WHERE accountId = ?;', [user.id])

	//update the user's selection
	await pool.promise().query('UPDATE badges SET active = TRUE WHERE accountId = ? AND name = ?;', [user.id, req.body.name])

	// Send modified selection to the user
	ownedBadges = await getBadgesOwned(user.id)
	res.status(200).json(ownedBadges);
	res.end();

	log('Updated badge selection', user.id, req.body.name);
	logActivity(user.id);
};

/**
 * Rewards a player with a badge
 * @param {number} id Account ID
 * @param {string} badgeName Badge name
 */
const rewardBadge = async (id, badgeName) => {
	//TODO: constants as badge/equipment names?
		let packet = (await pool.promise().query('INSERT INTO badges (accountId, name) SELECT ?, ? FROM DUAL WHERE NOT EXISTS(SELECT 1 FROM badges WHERE accountId = ? AND name = ?);', [id, badgeName, id, badgeName]))[0]
	if (packet.affectedRows) {
		return true
	} else {
		return false // TODO: Check for failure
	}
};

/**
 * Try to capture the flag. 
 * Returns true when the flag is captured
 * @param {number} attackerId Attacker profile Id
 * @param {number} defenderId Defender profile Id
 * @param {boolean} skip Don't do anything
 */
const captureTheFlag = async (attackerId, defenderId, skip) => {
	//if this is a no-op
	if (skip) {
		return false;
	}

	//check to see if the flag belongs to the defender
	let results = (await pool.promise().query('SELECT * FROM badges WHERE accountId = ? AND name = "Capture The Flag" LIMIT 1;', [defenderId]))[0]

	//does the defender have this badge? If not, return
	if (results.length === 0) {
		return false;
	}

	//move the badge between accounts
		await pool.promise().query('INSERT INTO badges (id, accountId, name, active) VALUES (?, ?, "Capture The Flag", FALSE) ON DUPLICATE KEY UPDATE accountId = VALUES(accountId), active = FALSE;', [results[0].id, attackerId])

	log('Badge moved', attackerId, defenderId);
	return true
};

function runBadgeTicks() {
	//Combat Master
	let combatMasterBadgeTickJob = new CronJob('0 * * * * *', async () => { //once a minute - combats aren't that fast
		//gather the total combats
				let results = (await pool.promise().query('SELECT * FROM (SELECT attackerId, COUNT(attackerId) AS successfulAttacks FROM pastCombat WHERE victor = "attacker" GROUP BY attackerId ORDER BY attackerId) AS t WHERE successfulAttacks >= 100;'))[0]

		for (let i = 0; i < results.length; i++) {
			let result = await rewardBadge(results[i].attackerId, 'Combat Master');
			if (result) {
				log('Badge rewarded', results[i].attackerId, 'Combat Master')
			}
		}
	});

	combatMasterBadgeTickJob.start();

	//King Of The Hill
	let kingOfTheHillBadgeTickJob = new CronJob('0 * * * * *', async () => { //once a minute
		//NOTE: sloppy implementation - people who have the badge may get "rewarded" twice. Thankfully rewardBadge() prevents this.
		getLadderData('parameter not used (yet)', 0, 1, (err, ladderResults) => {
			if (err) throw err; //TODO: pull badge names into variables. Not good.

			//only happens with 0 players, but might as well check
			if (ladderResults.length === 0) {
				log('No players in ladder');
				return;
			}

			//get the current contender for king of the hill
						pool.query('SELECT * FROM badgesTimespan WHERE name = "King Of The Hill";', async (err, results) => {
				if (err) throw err;

				const day = 1000 * 60 * 60 * 24; //milliseconds
				const now = new Date();
				const qualifyTime = results.length > 0 ? new Date(results[0].qualifyTime) : null;

				//if someone qualifies (1 day)
				if (results.length > 0 && now - qualifyTime >= day) {
					rewardBadge(results[0].accountId, results[0].name);
										await pool.promise().query('DELETE FROM badgesTimespan WHERE id = ?;', [results[0].id])
					return;
				}

				//if someone is still a contender for this badge
				if (results.length > 0 && ladderResults[0].id === results[0].accountId) {
					//DO NOTHING
					log('King Of The Hill contender found', ladderResults[0].id, ladderResults[0].username);
				}

				//if the current contender is NOT in first place
				else {

					await pool.promise().query('DELETE FROM badgesTimespan WHERE name = "King Of The Hill";')

					await pool.promise().query('INSERT INTO badgesTimespan (accountId, name) VALUES (?, "King Of The Hill")', [ladderResults[0].id])

					log('King Of The Hill contender updated', ladderResults[0].id, ladderResults[0].username);
				}
			});
		});
	});

	kingOfTheHillBadgeTickJob.start();
}

module.exports = {
	ownedRequest: ownedRequest,
	selectActiveBadge: selectActiveBadge,
	rewardBadge: rewardBadge,
	captureTheFlag: captureTheFlag,
	runBadgeTicks: runBadgeTicks
};