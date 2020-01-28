/**
 * Middleware to check for auth and get the user data 
 */
const pool = require("./../db/pool.js");

let { log } = require('../../common/utilities.js');

/**
 * Check if the user is logged in
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 * @param {*} next 
 */
async function requireAuth(req, res, next) {
	try {
		// If this key exists (user saves username and userid)
		if (req.session.user) {
			next()
		} else {
			res.status(440).write(log('Invalid session please relogin', JSON.stringify(req.body)));
			res.end();
			return;
		}
	} catch (err) {
		next(err)
	}
}

module.exports = {
	requireAuth
}