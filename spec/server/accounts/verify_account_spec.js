//objects
let connection;

//rewire
const rewiremock = require('rewiremock/node');

rewiremock('../../../server/utilities/throttling.js').with({
	throttle: (email) => email,
	isThrottled: (email) => isThrottledSwitch
});

rewiremock('mysql').with(require('../../helpers/mysql_mock.js'));

//the functions to test
rewiremock.enable();

const {
	verifyAccountRequest,
	getInformationFromSignups,
	verifyToken,
	createAccount
} = require('../../../server/accounts/verify_account.js');

//other stuff to rewire
const connectToDatabase = require('../../../server/utilities/database.js');

rewiremock.disable();

//utility functions
let timeoutPromise = (ms) => new Promise((resolve, reject) => {
	let id = setTimeout(() => {
		clearTimeout(id);
		resolve('Timed out in '+ ms + 'ms.');
	}, ms);
});

describe('Verify system', () => {
	beforeAll(() => {
		//put it here to dummy out the extra logging from connectToDatabase()
		spyOn(console, 'log');
		spyOn(global, 'Date').and.callFake(() => 'Tue Jan 1 2019 00:00:00 GMT+1000 (Australian Eastern Standard Time)');

		connection = connectToDatabase();
	});

	it('getInformationFromSignups', () => {
		//invalid database state
		connection.unwrap().nextResult = [];

		getInformationFromSignups(connection, {query: {email: 'example@example.com'}})
			.then(() => fail('Database should be invalid'), (obj) => expect(obj.msg).toEqual('That account does not exist or this link has already been used.'))
		;

		//valid database state
		connection.unwrap().nextResult = [ {} ];
		getInformationFromSignups(connection, {query: {email: 'example@example.com'}})
			.then((record) => expect(record).toEqual(connection.unwrap().nextResult[0]))
		;
	});

	it('verifyToken', () => { //NOTE: the token's name is 'verify' because of a historical mistake
		//invalid token
		verifyToken({ query: {verify: 12345} })( {verify: 0} ) //req, record
			.then(() => fail('Tokens should not match'), (obj) => expect(obj.msg).toEqual('Verification failed!'))
		;

		//valid token
		verifyToken({ query: {verify: 67890} })( {verify: 67890} ) //req, record
			.then((obj) => expect(obj).toEqual( {verify: 67890} )) //record (same as above)
		;
	});

	it('createAccount', async () => {
		const record = {
			email: 'example@example.com',
			username: 'Nobody',
			salt: 'salt is as mineral...',
			hash: 'has is a drug...?',
			promotion: false
		};

		await createAccount(connection)(record);

		expect(console.log).not.toHaveBeenCalledWith(`log Tue Jan 1 2019 00:00:00 GMT+1000: Trying to create account (${record.email})`);
		expect(console.log).not.toHaveBeenCalledWith(`log Tue Jan 1 2019 00:00:00 GMT+1000: Account created (${record.email})`);

		await timeoutPromise(3500);

		expect(console.log).toHaveBeenCalledWith(`log Tue Jan 1 2019 00:00:00 GMT+1000: Trying to create account (${record.email})`);
		expect(console.log).toHaveBeenCalledWith(`log Tue Jan 1 2019 00:00:00 GMT+1000: Account created (${record.email})`);		
	});

	it('verifyAccountRequest intergration test', () => {
		//set up the connection
		connection.unwrap().nextResult = [{
			email: 'example@example.com',
			username: 'Nobody',
			salt: 'salt is as mineral...',
			hash: 'has is a drug...?',
			promotion: false,
			verify: 12345
		}];

		//req and res
		const req = {
			query: { email: 'example@example.com', verify: 12345}
		};

		const resSuccess = {
			status: (s) => {
				expect(s).toEqual(200);
				return { write: () => null, json: () => null};
			},
			end: () => null
		};

		const resFailure = {
			status: (s) => {
				expect(s).toEqual(400);
				return { write: () => null, json: () => null};
			},
			end: () => null
		};

		//test the rejection (invalid verify)
		verifyAccountRequest(connection)({ query: {...req.query, verify: 0} }, resFailure);

		//victory lap
		verifyAccountRequest(connection)(req, resSuccess);
	});
});

