//rewire
const rewiremock = require('rewiremock/node');
rewiremock('../../../server/utilities/logging_exclusion_list.json').with(['Mocked message']);
rewiremock('mysql').with(require('../../helpers/mysql_mock.js'));

//the functions to test
rewiremock.enable();

const { log, logActivity } = require('../../../server/utilities/logging.js');
const connectToDatabase = require('../../../server/utilities/database.js');

rewiremock.disable();

let connection;

describe('Server logging', () => {
	beforeAll(() => {
		//put it here to dummy out the extra logging from connectToDatabase()
		spyOn(console, 'log');
		spyOn(global, 'Date').and.callFake(() => 'Tue Jan 1 2019 00:00:00 GMT+1000 (Australian Eastern Standard Time)');

		connection = connectToDatabase();
	});

	it('Log without exclusion', () => {
		//parameters
		const params = [
			'hello world',
			'foo bar',
			123
		];

		//test call
		const result = log(...params);

		const firstParam = params.shift();

		expect(console.log).toHaveBeenCalledWith(`log Tue Jan 1 2019 00:00:00 GMT+1000: ${firstParam} (${params.toString()})`);
		expect(result).toEqual(firstParam);
	});

	it('Log with exclusion', () => {
		//test call
		const result = log('Mocked message');

		expect(console.log).not.toHaveBeenCalledWith('log Tue Jan 1 2019 00:00:00 GMT+1000: Mocked message ()');
		expect(result).toEqual('Mocked message');
	});

	it('Log activity', () => {
		logActivity(connection, 123);

		expect(connection.unwrap().lastQuery).toEqual('UPDATE accounts SET lastActivityTime = CURRENT_TIMESTAMP() WHERE id = 123;');
	});
});