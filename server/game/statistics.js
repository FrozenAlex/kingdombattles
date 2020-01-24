//environment variables
require('dotenv').config();

let pool = require('./../db/pool.js')

const round = (x) => Math.round(x * 100) / 100;

async function statisticsRequest(req, res) {
	let results = (await pool.promise().query('SELECT COUNT(*) AS playerCount, SUM(gold) / COUNT(*) AS goldAverage, SUM(recruits) AS recruitTotal, SUM(soldiers) AS soldierTotal, SUM(scientists) AS scientistTotal, SUM(spies) AS spyTotal FROM profiles;'))[0]

	let playerCount = results[0].playerCount;
	let goldAverage = results[0].goldAverage;
	let recruitTotal = results[0].recruitTotal;
	let soldierTotal = results[0].soldierTotal;
	let scientistTotal = results[0].scientistTotal;
	let spyTotal = results[0].spyTotal;

	//determine the correct tick rate based on the current gold average
	//NOTE: copy/pasted
	let tickRate = (() => {
		if (results[0].goldAverage < 120) return 30;
		if (results[0].goldAverage < 130) return 60;
		if (results[0].goldAverage < 140) return 120;
		return -180; //slow it way down
	})();

	let nextTick = Math.abs(tickRate) - (new Date()).getMinutes() % Math.abs(tickRate);

	// Get active users count
	let activeUsersQuery = 'SELECT COUNT(*) AS activity FROM accounts WHERE lastActivityTime >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY);';
	let activeUsers = (await pool.promise().query(activeUsersQuery))[0]

	let activity = activeUsers[0].activity;
	let activePercentage = round(activity / playerCount * 100);

	let newPlayersQuery = 'SELECT COUNT(*) AS newPlayers FROM profiles WHERE td >= DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 DAY)';
	let newPlayersResults = (await pool.promise().query(newPlayersQuery))[0];

	let newPlayers = newPlayersResults[0].newPlayers;

	res.status(200).json({
		'Player Count': playerCount,
		'Active Players': activity,
		'Active Percentage': {
			string: `${activePercentage}%`,
			color: activePercentage >= 5 ? 'lightgreen' : activePercentage >= 3 ? 'yellow' : 'red'
		},
		'New Players': newPlayers > 0 ? {
			string: `${newPlayers} (Welcome aboard!)`,
			color: 'lightgreen'
		} : {
			string: '0',
			color: 'yellow'
		},
		'Recruits Total': recruitTotal,
		'Soldier Total': soldierTotal,
		'Scientist Total': scientistTotal,
		'Spy Total': {
			string: '[Classified]',
			color: 'red'
		},
		'Gold Average': `${round(goldAverage)}`,
		'Gold Tick Rate': tickRate > 0 ? `${tickRate} minutes` : {
			string: `${Math.abs(tickRate)} minutes (restricted to gold < 100)`,
			color: 'yellow'
		},
		'Gold Next Tick': `${nextTick} minute${nextTick === 1 ? '' : 's'} from now`
	});
	res.end();

};

module.exports = {
	statisticsRequest: statisticsRequest
};