/**
 * Middleware to check for auth and get the user data 
 */
const pool = require("./../db/pool.js");

/**
 * Check auth for authorizd requests attaches accountID to req.local or sends unauthorized
 * //LEGACY We need something better, like auth header
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 * @param {*} next 
 */
async function requireAuth(req, res, next) {
	try {
		let query = 'SELECT COUNT(*) AS total FROM sessions WHERE accountId = ? AND token = ?;';
		// Use req.locals to attach variables

		// TODO: Move to cookies
		let UsersWithCredentials = (await pool.promise().query(query, [req.body.id, req.body.token]))[0]

		if (UsersWithCredentials[0].total !== 1) {
			res.status(440).write(log(' Invalid session please relogin', JSON.stringify(req.body), req.body.id, req.body.token));
			res.end();
			return;
		}
		req.locals = {}
		req.locals.accountId = req.body.id;
		req.locals.token = req.body.token;
		console.log('success')
		next()
	} catch (err) {
		next(err)
	}

}

module.exports = {
	requireAuth
}