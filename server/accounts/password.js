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

module.exports = {
	passwordChangeRequest: passwordChangeRequest,
	passwordRecoverRequest: passwordRecoverRequest,
	passwordResetRequest: passwordResetRequest
};