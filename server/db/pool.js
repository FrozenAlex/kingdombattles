//libraries
let mysql = require('mysql2');


let config;
if (process.env.DATABASE_URL) {
	let credentials = new URL(process.env.DATABASE_URL);
	config = {
		host: credentials.host,
		user: credentials.username,
		password: credentials.password,
		database: credentials.pathname.substr(1),
		port: credentials.port || 3306,
		connectionLimit: 10,
		queueLimit: 0,
		enableKeepAlive: true
	};
} else {
	config = {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		password: process.env.DB_PASS,
		database: process.env.DB_NAME,
		port: process.env.DB_PORT,
		connectionLimit: 10,
		queueLimit: 0,
		enableKeepAlive: true
	};
}

// Create a connection pool
const pool = mysql.createPool(config)

pool.on("connection", (connection) => {
	connection.on("error", (err) => {
		console.log(`MySQL connection error ${err}`)
	});
});

module.exports = pool;
