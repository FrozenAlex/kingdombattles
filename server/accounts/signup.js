//environment variables
require('dotenv').config();

//libraries
const util = require('util');
const bcrypt = require('bcrypt');
const formidable = require('formidable');
const sendmail = require('sendmail')({silent: true});

//utilities
const { log } = require('../utilities/logging.js');
const { throttle, isThrottled } = require('../utilities/throttling.js');
const validateEmail = require('../utilities/validate_email.js');

const signupRequest = (connection) => (req, res) => {
	//formidable handles forms
	const form = formidable.IncomingForm();
	const formParse = util.promisify(form.parse);

	//handle all outcomes
	const handleRejection = (obj) => {
		res.status(400).write(log(obj.msg, obj.extra.toString()));
		res.end();
	}

	const handleSuccess = (obj) => {
		log(obj.msg, obj.extra.toString());
		res.status(200).json(obj);
		res.end();
	}

	return formParse(req)
		.then(validateSignup(connection))
		.then(generateSaltAndHash(connection))
		.then(sendSignupEmail())
		.then(handleSuccess)
		.catch(handleRejection)
	;
};

const validateSignup = (connection) => (fields) => new Promise( async (resolve, reject) => {
	//prevent too many clicks via throttle tool
	if (isThrottled(fields.email)) {
		return reject({msg: 'Signup throttled', extra: fields.email});
	}

	throttle(fields.email);

	//validate email, username and password
	if (!validateEmail(fields.email) || fields.username.length < 4 || fields.username.length > 100 || fields.password.length < 8 || fields.password !== fields.retype) {
		return reject({msg: 'Invalid signup data', extra: [fields.email, fields.username]});
	}

	//check to see if the email has been banned
	const bannedQuery = 'SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;';
	const banned = await connection.query(bannedQuery, [fields.email])
		.then((results) => results[0].total > 0)
	;

	//if the email has been banned
	if (banned) {
		return reject({msg: 'This email account has been banned!', extra: fields.email});
	}

	//check if email, username already exists
	const existsQuery = 'SELECT (SELECT COUNT(*) FROM accounts WHERE email = ?) AS email, (SELECT COUNT(*) FROM accounts WHERE username = ?) AS username;';
	const exists = await connection.query(existsQuery, [fields.email, fields.username])
		.then((results) => new Promise( (resolve, reject) => {
			results[0].email === 0 ? resolve(results) : reject('Email already registered!')
		} ))
		.then((results) => new Promise( (resolve, reject) => {
			results[0].username === 0 ? resolve(results) : reject('Username already registered!')
		} ))
		.catch(e => e)
	;

	if (typeof(exists) === 'string') {
		return reject({msg: exists, extra: [fields.email, fields.username]});
	}

	//all went well
	return resolve(fields);
});

const generateSaltAndHash = (connection) => (fields) => new Promise( async (resolve, reject) => {
	const salt = await bcrypt.genSalt(11);
	const hash = await bcrypt.hash(fields.password, salt);

	//generate a random number as a token
	const rand = Math.floor(Math.random() * 2000000000);

	//save the generated data to the signups table
	const signupQuery = 'REPLACE INTO signups (email, username, salt, hash, promotions, verify) VALUES (?, ?, ?, ?, ?, ?);';
	await connection.query(signupQuery, [fields.email, fields.username, salt, hash, fields.promotions ? true : false, rand]);

	return resolve({rand, fields});
});

const sendSignupEmail = () => ({rand, fields}) => new Promise( async (resolve, reject) => {
	const send = util.promisify(sendmail);

	const addr = `http://${process.env.WEB_ADDRESS}/verifyrequest?email=${fields.email}&verify=${rand}`
	const msg = 'Hello! Please visit the following address to verify your account: ';

	await send({
		from: `signup@${process.env.WEB_ADDRESS}`,
		to: fields.email,
		subject: 'Email Verification',
		text: msg + addr,
	})
		.then(
			() => resolve({msg: 'Verification email sent!', extra: [fields.email, fields.username]}),
			() => reject({msg: 'Something went wrong', extra: [fields.email, fields.username]})
		)
	;
});

module.exports = {
	//public API
	signupRequest: signupRequest,

	//for testing
	validateSignup: validateSignup,
	generateSaltAndHash: generateSaltAndHash,
	sendSignupEmail: sendSignupEmail
};

/*-------------------------


const loginRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate email, username and password
		if (!validateEmail(fields.email) || fields.password.length < 8) {
			res.status(400).write(log('Invalid login data', fields.email)); //WARNING: NEVER LOG PASSWORDS. EVER.
			res.end();
			return;
		}

		//check to see if the email has been banned
		let query = 'SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;';
		connection.query(query, [fields.email], (err, results) => {
			if (err) throw err;

			//if the email has been banned
			if (results[0].total > 0) {
				res.status(400).write(log('This email account has been banned!', 'login', fields.email));
				res.end();
				return;
			}

			//find this email's information
			let query = 'SELECT id, username, salt, hash FROM accounts WHERE email = ?;';
			connection.query(query, [fields.email], (err, results) => {
				if (err) throw err;

				//found this email?
				if (results.length === 0) {
					res.status(400).write(log('Incorrect email or password', fields.email, 'Did not find this email')); //NOTE: deliberately obscure incorrect email or password
					res.end();
					return;
				}

				//gen a new hash from the salt and password
				bcrypt.hash(fields.password, results[0].salt, (err, newHash) => {
					if (err) throw err;

					//compare the passwords
					if (results[0].hash !== newHash) {
						res.status(400).write(log('Incorrect email or password', fields.email, 'Did not find this password'));
						res.end();
						return;
					}

					//create the new session
					let rand = Math.floor(Math.random() * 2000000000);

					let query = 'INSERT INTO sessions (accountId, token) VALUES (?, ?);';
					connection.query(query, [results[0].id, rand], (err) => {
						if (err) throw err;

						//send json containing the account info
						res.status(200).json({
							id: results[0].id,
							email: fields.email,
							username: results[0].username,
							token: rand,
							msg: log('Logged in', fields.email, rand)
						});
						res.end();

						logActivity(connection, results[0].id);
					});
				});
			});
		});
	});
};

const logoutRequest = (connection) => (req, res) => {
	let query = 'DELETE FROM sessions WHERE sessions.accountId = ? AND token = ?;'; //NOTE: The user now loses this access token
	connection.query(query, [req.body.id, req.body.token], (err) => {
		if (err) throw err;
		log('Logged out', req.body.id, req.body.token);
		logActivity(connection, req.body.id);
	});

	res.end(); //NOTE: don't send a response
};

const passwordChangeRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate password, retype
		if (fields.password.length < 8 || fields.password !== fields.retype) {
			res.status(400).write(log('Invalid password change data', fields.id));
			res.end();
			return;
		}

		//validate token
		query = 'SELECT COUNT(*) AS total FROM sessions WHERE sessions.accountId = ? AND sessions.token = ?;';
		connection.query(query, [fields.id, fields.token], (err, results) => {
			if (err) throw err;

			if (results[0].total !== 1) {
				res.status(400).write(log('Invalid password change credentials', fields.id, fields.token));
				res.end();
				return;
			}

			//generate the new salt, hash
			bcrypt.genSalt(11, (err, salt) => {
				if (err) throw err;
				bcrypt.hash(fields.password, salt, (err, hash) => {
					if (err) throw err;

					let query = 'UPDATE accounts SET salt = ?, hash = ? WHERE id = ?;';
					connection.query(query, [salt, hash, fields.id], (err) => {
						if (err) throw err;

						//clear all session data for this user (a 'feature')
						let query = 'DELETE FROM sessions WHERE sessions.accountId = ?;';
						connection.query(query, [fields.id], (err) => {
							if (err) throw err;

							//create the new session
							let rand = Math.floor(Math.random() * 2000000000);

							let query = 'INSERT INTO sessions (accountId, token) VALUES (?, ?);';
							connection.query(query, [fields.id, rand], (err) => {
								if (err) throw err;

								//send json containing the account info
								res.status(200).json({
									token: rand,
									msg: log('Password changed!', fields.id)
								});
								res.end();

								logActivity(connection, fields.id);
							});
						});
					});
				});
			});
		});
	});
};

const passwordRecoverRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

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
		let query = 'SELECT accounts.id FROM accounts WHERE email = ?;';
		connection.query(query, [fields.email], (err, results) => {
			if (err) throw err;

			if (results.length !== 1) {
				res.status(400).write(log('Invalid recover data (did you use a registered email?)', fields.email));
				res.end();
				return;
			}

			//create the new recover record
			let rand = Math.floor(Math.random() * 2000000000);

			let query = 'REPLACE INTO passwordRecover (accountId, token) VALUES (?, ?)';
			connection.query(query, [results[0].id, rand], (err) => {
				if (err) throw err;

				//TODO: prettier recovery email
				//build the recovery email
				let addr = `http://${process.env.WEB_ADDRESS}/passwordreset?email=${fields.email}&token=${rand}`;
				let msg = 'Hello! Please visit the following address to set a new password (if you didn\'t request a password recovery, ignore this email): ';
//				let msgHtml = `<html><body><p>${msg}<a href='${addr}'>${addr}</a></p></body></html>`;

				//BUGFIX: is gmail being cruel?
				let sentinel = false;

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

						res.status(200).json({ msg: msg });
						res.end();
					}

					sentinel = true;
				});
			});
		});
	});
};

const passwordResetRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm();

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate email and password
		if (!validateEmail(fields.email) || fields.password.length < 8 || fields.password !== fields.retype) {
			res.status(400).write(log('Invalid reset data (invalid email/password)', fields.email));
			res.end();
			return;
		}

		//get the account based on this email, token
		let query = 'SELECT * FROM accounts WHERE email = ? AND id IN (SELECT passwordRecover.accountId FROM passwordRecover WHERE token = ?);';
		connection.query(query, [fields.email, fields.token], (err, results) => {
			if (err) throw err;

			//results should be only 1 account
			if (results.length !== 1) {
				res.status(400).write(log('Invalid reset data (incorrect parameters/database state)', fields.email));
				res.end();
				return;
			}

			//generate the new salt, hash
			bcrypt.genSalt(11, (err, salt) => {
				if (err) throw err;
				bcrypt.hash(fields.password, salt, (err, hash) => {
					if (err) throw err;

					//update the salt, hash
					let query = 'UPDATE accounts SET salt = ?, hash = ? WHERE email = ?;';
					connection.query(query, [salt, hash, fields.email], (err) => {
						if (err) throw err;

						//delete the recover request from the database
						let query = 'DELETE FROM passwordRecover WHERE accountId IN (SELECT id FROM accounts WHERE email = ?);';
						connection.query(query, [fields.email], (err) => {
							if (err) throw err;

							res.status(200).json({ msg: log('Password updated!', fields.email) });
							res.end();

							logActivity(connection, results[0].id);
						});
					});
				});
			});
		});
	});
};

const privacySettingsRequest = (connection) => (req, res) => {
	//validate token
	query = 'SELECT COUNT(*) AS total FROM sessions WHERE sessions.accountId = ? AND sessions.token = ?;';
	connection.query(query, [req.body.id, req.body.token], (err, results) => {
		if (err) throw err;

		if (results[0].total !== 1) {
			res.status(400).write(log('Invalid privacy settings credentials', req.body.id, req.body.token));
			res.end();
			return;
		}

		//fetch each privacy setting
		let query = 'SELECT promotions FROM accounts WHERE id = ?;';
		connection.query(query, [req.body.id], (err, results) => {
			if (err) throw err;

			res.status(200).json({
				promotions: results[0].promotions
			});
			res.end();
		});
	});
};

const privacySettingsUpdateRequest = (connection) => (req, res) => {
	//formidable handles forms
	let form = formidable.IncomingForm(); //TODO: get rid of formidable

	//parse form
	form.parse(req, (err, fields) => {
		if (err) throw err;

		//validate token
		query = 'SELECT COUNT(*) AS total FROM sessions WHERE sessions.accountId = ? AND sessions.token = ?;';
		connection.query(query, [fields.id, fields.token], (err, results) => {
			if (err) throw err;

			if (results[0].total !== 1) {
				res.status(400).write(log('Invalid privacy settings update credentials', fields.id, fields.token));
				res.end();
				return;
			}

			//update each privacy setting
			query = 'UPDATE accounts SET promotions = ? WHERE id = ?;';
			connection.query(query, [fields.promotions ? true : false, fields.id], (err) => {
				if (err) throw err;

				res.status(200).json({ msg: log('Privacy settings updated!', fields.id, fields.token) });
				res.end();
			});
		});
	});
};

-------------------------*/