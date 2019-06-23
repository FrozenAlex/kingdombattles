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

module.exports = {
	privacySettingsRequest: privacySettingsRequest,
	privacySettingsUpdateRequest: privacySettingsUpdateRequest
};