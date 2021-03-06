/**
 * Gives gold to everyone 
 */

// Libraries
let CronJob = require('cron').CronJob;

// Utilities
let {
	logDiagnostics
} = require('./../../diagnostics.js');
let {
	log
} = require('../../../common/utilities.js');

let pool = require('../../db/pool.js')


// TODO: Refactor later. For now it works.
async function runGoldTick() {
	//gotta love closures
	let goldTickJob;
	let oldTickRate;

	//run outer tick once a minute, 30 seconds after goldTickJob to prevent clashes
	let outerTick = new CronJob('30 * * * * *', async () => {
		log('outerTick');

		let golds = (await pool.promise().query('SELECT SUM(gold) / COUNT(*) AS goldAverage FROM profiles;'))[0]

		//TODO: automatic "drain mode"

		//determine the correct tick rate based on the current gold average
		let tickRate = (() => {
			if (golds[0].goldAverage < 120) return 30;
			if (golds[0].goldAverage < 130) return 60;
			if (golds[0].goldAverage < 140) return 120;
			return -180; //slow it way down
		})();

		//if the tick rate changed (or is undefined), reset (or start) the inner tick job
		if (oldTickRate !== tickRate) {
			if (goldTickJob) goldTickJob.stop();

			//NOTE: negative tickRate means restrict the tick to people with gold < 100
			goldTickJob = new CronJob(`0 */${tickRate > 0 ? tickRate : -tickRate} * * * *`, async () => {
				let query;
				if (tickRate > 0) {
					query = 'UPDATE profiles SET gold = gold + recruits;';
				} else {
					query = 'UPDATE profiles SET gold = gold + recruits WHERE gold < 100;';
				}
				await pool.promise().query(query)

				//re-fetch the new gold average for logging
				pool.query('SELECT SUM(gold) / COUNT(*) AS goldAverage FROM profiles;', (err, results) => {
					if (err) throw err;
					log('goldTickJob', tickRate, results[0].goldAverage);
				});

			});

			goldTickJob.start();

			oldTickRate = tickRate;
		}
	});

	outerTick.start();
};

module.exports = {
	runGoldTick
}