//libraries
let CronJob = require('cron').CronJob;

//utilities
let {
	logDiagnostics
} = require('./../../diagnostics.js');
let {
	log
} = require('../../../common/utilities.js');

let pool = require('../../db/pool.js')

async function runLadderTick() {
	let ladderTickJob = new CronJob('* * * * * *', async () => {
		//set the ladder rank weight / so much sql
		await pool.promise().query(
			'UPDATE profiles SET ladderRankWeight = (soldiers * 5 + (recruits + scientists + spies) + (SELECT COUNT(*) FROM pastCombat WHERE (attackerId = accountId AND victor = "attacker" AND attackingUnits <= IF(undefended, defendingUnits * 0.25, defendingUnits)) OR (defenderId = accountId AND victor = "defender")) / 10 + gold / 10);'
		);

		// get the profiles ordered by weight descending
		let profiles = (await pool.promise().query('SELECT id FROM profiles ORDER BY ladderRankWeight DESC, soldiers DESC, recruits DESC, gold DESC;'))[0]

		await pool.promise().query(
			`INSERT INTO profiles (id, ladderRank) VALUES ${ profiles.map((record, index) => `(${record.id}, ${index})` ) } ON DUPLICATE KEY UPDATE id = VALUES(id), ladderRank = VALUES(ladderRank);`
		);
		console.log("ranking updated")
		log('runLadderTick completed');
	});


	ladderTickJob.start();
};

module.exports = {
	runLadderTick
}