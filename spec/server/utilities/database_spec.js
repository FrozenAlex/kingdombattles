//rewire
const rewiremock = require('rewiremock/node');
rewiremock('mysql').with(require('../../helpers/mysql_mock.js'));

//libraries
require("jasmine-expect-count");

//the functions to test
rewiremock.enable();

const connectToDatabase = require('../../../server/utilities/database.js');

describe('Database utility', () => {
	beforeAll(() => {
		//put it here to dummy out the extra logging from connectToDatabase()
		spyOn(console, 'log');
		connection = connectToDatabase();
	});

	afterAll(() => {
		//cleanup
		rewiremock.disable();
	});

	it('connect to the database', () => {
		//spies
		spyOn(global, 'Date').and.callFake(() => 'Fri Jan 1 2019 00:00:00 GMT+1000 (Australian Eastern Standard Time)');

		//run the test
		const connection = connectToDatabase();

		//check spies
		expect(console.log).toHaveBeenCalledWith('log Fri Jan 1 2019 00:00:00 GMT+1000: Connected to mysql ()');
	});

	it('Query the database (callback)', () => {
		const query = 'SELECT * FROM accounts;';
		connection.query(query, (err) => {
			if (err) throw err;

			expect(connection.unwrap().lastQuery).toEqual('SELECT * FROM accounts;');
		});
	});

	it('Query the database (promise)', () => {
		const query = 'SELECT * FROM profiles;';
		connection.query(query)
			.then(expect(connection.unwrap().lastQuery).toEqual('SELECT * FROM profiles;'))
			.catch(console.error)
		;
	});

	it('Close the database connection', () => {
		connection.close();

		expect(connection.unwrap().connected).toEqual(false);
	});
});