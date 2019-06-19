//environment variables
require('dotenv').config();

//libraries
let mysql = require('mysql');

//utilities
let { log } = require('../common/utilities.js');

let connection;

let connectionWrapper = { //use a wrapper that will always point to the correct database object
	query: (...args) => connection.query(...args)
};

const handleDisconnect = () => {
	//use the config
	connection = mysql.createConnection({
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB_NAME,
		port: process.env.DB_PORT
	});

	//connect
	connection.connect((err) => {
		if (err) {
			log('Error connecting to mysql: ', err);
			setTimeout(handleDisconnect, 2000);
		} else {
			log('Connected to mysql');
		}
	});

	//prepare for failure
	connection.on('error', (err) => {
		log('mysql error: ', err);

		if (err.code === 'PROTOCOL_CONNECTION_LOST') {
			handleDisconnect();
		} else {
			throw (err);
		}
	});

	//finally
	return connectionWrapper; //TODO: test that this actually bloody works
};

module.exports = {
	connectToDatabase: handleDisconnect
};