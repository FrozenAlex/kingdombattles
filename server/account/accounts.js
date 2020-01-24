//environment variables
require('dotenv').config();

let pool = require("./../db/pool");
//libraries
let bcrypt = require('bcryptjs');
let parseForm = require('../util/parseForm');
let sendmail = require('sendmail')({
	silent: true
});

const saltrounds = 10;

//utilities
let {
	log,
	validateEmail
} = require('../../common/utilities.js');
let {
	throttle,
	isThrottled
} = require('../../common/throttle.js');
let {
	logActivity
} = require('../utilities.js');

let gameProfile = require('./../game/profile/profile');

const express = require("express");
const router = express.Router();

// Public routes
router.post('/signup', signupRequest);
router.get('/verify', verifyRequest);
router.post('/login', loginRequest);
router.post('/passwordrecover', passwordRecoverRequest);
router.post('/passwordreset', passwordResetRequest);

// You need to be authorised to perform such things
router.use(require('./../middleware/auth').requireAuth)

router.get('/privacy', privacySettingsRequest);
router.post('/password', passwordChangeRequest);
router.post('/privacy', privacySettingsUpdateRequest);
router.get('/logout', logoutRequest);


async function signupRequest(req, res) {
	// TODO: Move functions to a separate file to keep the route file clean

	// Parse form
	let form = await parseForm(req)

	let fields = form.fields;

	// Prevent too many clicks
	if (isThrottled(fields.email)) {
		res.status(400).write(log('Signup throttled', fields.email));
		res.end();
		return;
	}

	throttle(fields.email);

	//validate email, username and password
	if (!validateEmail(fields.email) || fields.username.length < 4 || fields.username.length > 100 || fields.password.length < 8 || fields.password !== fields.retype) {
		res.status(400).write(log('Invalid signup data', fields));
		res.end();
		return;
	}

	//check to see if the email has been banned
		let results = await pool.promise().query('SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;', [fields.email])

	//if the email has been banned
	if (results[0][0].total > 0) {
		res.status(400).write(log('This email account has been banned!', 'signup', fields.email, fields.username));
		res.end();
		return;
	}

	//check if email, username already exists
	query = 'SELECT (SELECT COUNT(*) FROM accounts WHERE email = ?) AS email, (SELECT COUNT(*) FROM accounts WHERE username = ?) AS username;';
	results = await pool.promise().query(query, [fields.email, fields.username])
	///////
	if (results[0][0].email !== 0) {
		res.status(400).write(log('Email already registered!', fields.email));
		res.end();
		return;
	}

	if (results[0][0].username !== 0) {
		res.status(400).write(log('Username already registered!', fields.username));
		res.end();
		return;
	}

	//generate the hash
	let hash = await bcrypt.hash(fields.password, saltrounds)

	//generate a random number as a token
	let rand = Math.floor(Math.random() * 2000000000);

	//save the generated data to the signups table
	query = 'REPLACE INTO signups (email, username, hash, promotions, verify) VALUES (?, ?, ?, ?, ?);';
	await pool.promise().query(query, [fields.email, fields.username, hash, fields.promotions ? true : false, rand])
	//TODO: make the verification email prettier

	//build the verification email
	let addr = `http://${process.env.WEB_ADDRESS}/api/account/verify?email=${fields.email}&verify=${rand}`;
	let msg = 'Hello! Please visit the following address to verify your account: ';
	// TODO: Don't log adresses to console
	console.log(addr);
	//BUGFIX: is gmail being cruel? Yes, it's bad
	let sentinel = false;

	//send the verification email
	sendmail({
		from: `signup@${process.env.WEB_ADDRESS}`,
		to: fields.email,
		subject: 'Email Verification',
		text: msg + addr,
		//							html: msgHtml
	}, (err, reply) => {
		if (err) { //final check
			let msg = log('It\'s a test version so here ya go '+ addr, err);

			if (!sentinel) {
				res.status(400).write(msg);
				res.end();
			}
		} else {
			let msg = log('Verification email sent!', fields.email, fields.username, rand);

			if (!sentinel) {
				res.status(200).json({
					msg: msg
				});
				res.end();
			}
		}
		sentinel = true;
	});
};

/**
 * Verify email request
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 */
async function verifyRequest(req, res) {
	//get the saved data
		let signupRequests = (await pool.promise().query('SELECT * FROM signups WHERE email = ?;', [req.query.email]))[0]

	//correct number of results
	if (signupRequests.length !== 1) {
		res.status(400).write(log('That account does not exist or this link has already been used.', req.query.email, req.query.verify));
		res.end();
		return;
	}

	//verify the link
	if (req.query.verify != signupRequests[0].verify) {
		res.status(400).write(log('Verification failed!', req.query.email, req.query.verify, signupRequests[0].verify));
		res.end();
		return;
	}

	//BUGFIX: a delay to prevent the fail message appearing to the end user

	console.log('Trying to create account', req.query.email);

	//move the data from signups to accounts
	query = 'INSERT IGNORE INTO accounts (email, username, hash, promotions) VALUES (?, ?, ?, ?);';
	let ask = await pool.promise().query(query, [signupRequests[0].email, signupRequests[0].username, signupRequests[0].hash, signupRequests[0].promotions])
	console.log(ask)

	//delete from signups
	await pool.promise().query('DELETE FROM signups WHERE email = ?;', [signupRequests[0].email])
	console.log('Account created', signupRequests[0].email);

	//TODO: prettier verification page
	res.status(200).write(log('<p>Verification succeeded!</p><p><a href="/">Return Home</a></p>', signupRequests[0].email));
	res.end();

	await pool.promise().query('DELETE FROM signups WHERE email = ?;', [signupRequests[0].email])


	// Create a gaming profile for the user
	gameProfile.createProfile(signupRequests[0].username);
};

async function loginRequest(req, res) {
	//formidable handles forms
	let fields = (await parseForm(req)).fields;

	//validate email, username and password
	if (!validateEmail(fields.email) || fields.password.length < 8) {
		res.status(400).write(log('Invalid login data', fields.email)); //WARNING: NEVER LOG PASSWORDS. EVER.
		res.end();
		return;
	}

	//check to see if the email has been banned
		let results = (await pool.promise().query('SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;', [fields.email]))[0]

	//if the email has been banned
	if (results.total > 0) {
		res.status(400).write(log('This email account has been banned!', 'login', fields.email));
		res.end();
		return;
	}

	//find this email's information
	query = 'SELECT id, username, hash FROM accounts WHERE email = ?;';
	results = (await pool.promise().query(query, [fields.email]))[0]

	//found this email?
	if (results.length === 0) {
		res.status(400).write(log('Incorrect email or password', fields.email, 'Did not find this email')); //NOTE: deliberately obscure incorrect email or password
		res.end();
		return;
	}

	//compare the passwords
	let isValidPassword = await bcrypt.compare(fields.password, results[0].hash)
	if (!isValidPassword) {
		res.status(400).write(log('Incorrect email or password', fields.email, 'Did not find this password'));
		res.end();
		return;
	}

	// //create the new session
	let rand = Math.floor(Math.random() * 2000000000);

	// query = 'INSERT INTO sessions (accountId, token) VALUES (?, ?);';
	// await pool.promise().query(query, [results[0].id, rand])

	req.session.user = {
		id: results[0].id,
		username: results[0].username
	}

	//send json containing the account info
	res.status(200).json({
		id: results[0].id,
		email: fields.email,
		username: results[0].username,
		token: rand, // Not used anymore but we'll leave it here
		msg: log('Logged in', fields.email, rand)
	});
	res.end();

	logActivity(results[0].id);
};

async function logoutRequest(req, res) {
	req.session.destroy(() => {
		res.status(200);
		res.end();
	})
};

async function passwordChangeRequest(req, res) {
	let user = req.session.user;
	//formidable handles forms
	let fields = (await parseForm(req)).fields;

	//validate password
	if (fields.password.length < 8) {
		res.status(400).write(log('Invalid password change data', user.id));
		res.end();
		return;
	}
	// TODO: Verify old password
	//generate the new hash
	let hashedPassword = await bcrypt.hash(fields.password, saltrounds);

	await pool.promise().query('UPDATE accounts SET hash = ? WHERE id = ?;', [hashedPassword, user.id])

	// TODO: clear all session data for this user (a 'feature')
	// await pool.promise().query('DELETE FROM sessions WHERE sessions.accountId = ?;', [fields.id])
	//let rand = Math.floor(Math.random() * 2000000000);


	// await pool.promise().query('INSERT INTO sessions (accountId, token) VALUES (?, ?);', [fields.id, rand])
	// TODO: update session on completion
	//send json containing the account info
	res.status(200).json({
		msg: log('Password changed!', user.id)
	});
	res.end();

	logActivity(user.id);
};

async function passwordRecoverRequest(req, res) {
	//formidable handles forms
	let fields = (await parseForm(req)).fields;

	//prevent too many clicks
	if (isThrottled(fields.email)) {
		res.status(400).write(log('Recover throttled', fields.email));
		res.end();
		return;
	}

	throttle(fields.email);

	//validate email
	if (!validateEmail(fields.email)) {
		res.status(400).write(log('Invalid recover data', fields.email));
		res.end();
		return;
	}

	//ensure that this email is registered to an account
	let results = (await pool.promise().query('SELECT accounts.id FROM accounts WHERE email = ?;', [fields.email]))[0]

	if (results[0].length !== 1) {
		res.status(400).write(log('Invalid recover data (did you use a registered email?)', fields.email));
		res.end();
		return;
	}

	//create the new recover record
	let rand = Math.floor(Math.random() * 2000000000);


	results = (await pool.promise().query('REPLACE INTO passwordRecover (accountId, token) VALUES (?, ?)', [results[0].id, rand]))[0]
	//TODO: prettier recovery email
	//build the recovery email
	let addr = `http://${process.env.WEB_ADDRESS}/passwordreset?email=${fields.email}&token=${rand}`;
	let msg = 'Hello! Please visit the following address to set a new password (if you didn\'t request a password recovery, ignore this email): ';

	//BUGFIX: is gmail being cruel?
	let sentinel = false;
	console.log(addr);
	//send the verification email
	sendmail({
		from: `passwordrecover@${process.env.WEB_ADDRESS}`,
		to: fields.email,
		subject: 'Password Recovery',
		text: msg + addr,
		//					html: msgHtml
	}, (err, reply) => {
		//final check
		if (err) {
			if (!sentinel) {
				let msg = log('Something went wrong (did you use a valid email?)', err);

				res.status(400).write(msg);
				res.end();
			}
		} else {
			let msg = log('Recovery email sent!', fields.email);

			res.status(200).json({
				msg: msg
			});
			res.end();
		}

		sentinel = true;
	});
};

async function passwordResetRequest(req, res) {
	// Parse the form
	let fields = (await parseForm(req)).fields;

	// Validate email
	if (!validateEmail(fields.email) || fields.password.length < 8) {
		res.status(400).write(log('Invalid reset data (invalid email/password)', fields.email));
		res.end();
		return;
	}

	// get the account based on this email, token
	let results = (await pool.promise().query('SELECT * FROM accounts WHERE email = ? AND id IN (SELECT passwordRecover.accountId FROM passwordRecover WHERE token = ?);', [fields.email, fields.token]))[0]

	//results should be only 1 account
	if (results.length !== 1) {
		res.status(400).write(log('Invalid reset data (incorrect parameters/database state)', fields.email));
		res.end();
		return;
	}

	// Generate a new password hash
	let hash = await bcrypt.hash(fields.password, saltrounds)

	// Update the password hash
	await pool.promise().query('UPDATE accounts SET hash = ? WHERE email = ?;', [hash, fields.email])

	// Delete the password recovery request 
	await pool.promise().query('DELETE FROM passwordRecover WHERE accountId IN (SELECT id FROM accounts WHERE email = ?);', [fields.email])

	// Respond with success message
	res.status(200).json({
		msg: log('Password updated!', fields.email)
	});
	res.end();

	// Log user activity
	logActivity(results[0].id);
};

async function privacySettingsRequest(req, res) {
	//fetch each privacy setting
		let promotions = (await pool.promise().query('SELECT promotions FROM accounts WHERE id = ?;', [req.session.user.id]))[0]
	res.status(200).json({
		promotions: promotions[0].promotions
	});
	res.end();
};


async function privacySettingsUpdateRequest(req, res) {
	//formidable handles forms
	let fields = (await parseForm(req)).fields; //TODO: move it to middleware I guess?

	// Update privacy settings
	await pool.promise().query('UPDATE accounts SET promotions = ? WHERE id = ?;', [fields.promotions ? true : false, req.session.user.id])

	res.status(200).json({
		msg: log('Privacy settings updated!', req.session.user.id, req.session.user.username)
	});

	res.end();
};

module.exports = router;