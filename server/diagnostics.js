//environment variables
require('dotenv').config();

//libraries
let CronJob = require('cron').CronJob;

//utilities
let { log } = require('../common/utilities.js');
const pool = require('./db/pool.js');

function runDailyDiagnostics(){
	let dailyJob = new CronJob('0 0 0 * * *', async () => {
				await pool.promise().query('INSERT INTO diagnostics (playerCount, returnedPlayerCount, totalGold, totalRecruitments, totalDeaths, totalCombats, activity) VALUES ((SELECT COUNT(*) FROM profiles), (SELECT COUNT(*) FROM profiles WHERE (recruits + soldiers + spies + scientists) >= 2), (SELECT SUM(gold) FROM profiles), (IFNULL((SELECT SUM(quantity) FROM diagnosticsEvents WHERE eventName = "recruit"), 0)), (IFNULL((SELECT SUM(quantity) FROM diagnosticsEvents WHERE eventName = "death"), 0)), (SELECT COUNT(*) FROM pastCombat WHERE eventTime >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)), (SELECT COUNT(*) FROM accounts WHERE lastActivityTime >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)));')

						await pool.promise().query('DELETE FROM diagnosticsEvents;')
				log('Daily diagnostics taken');
			});
	
	

	dailyJob.start();
};

//current name parameters: 'recruit', 'death'
async function logDiagnostics(name, quantity){
		await pool.promise().query('INSERT INTO diagnosticsEvents (eventName, quantity) VALUES (?, ?);', [name, quantity])

};

module.exports = {
	runDailyDiagnostics: runDailyDiagnostics,
	logDiagnostics: logDiagnostics
};