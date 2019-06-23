//objects
let connection;
let formParams;

//rewire
const rewiremock = require('rewiremock/node');

rewiremock('mysql').with(require('../../helpers/mysql_mock.js'));

rewiremock('formidable').with({
	IncomingForm() {
		return {
			parse(parameters, next) {
				next(undefined, formParams);
			}
		};
	}
});

rewiremock('bcrypt').with({
	hash: async (password, salt) => {
		return 12345; //hell of a hash
	}
});

//the functions to test
rewiremock.enable();

const {
	loginRequest,
	validateFields,
	validatePassword,
	createNewSession,
	logoutRequest
} = require('../../../server/accounts/session.js');

//other stuff to rewire
const connectToDatabase = require('../../../server/utilities/database.js');

rewiremock.disable();

describe('Sessions system', () => {
	beforeAll(() => {
		//put it here to dummy out the extra logging from connectToDatabase()
		spyOn(console, 'log');
		spyOn(global, 'Date').and.callFake(() => 'Tue Jan 1 2019 00:00:00 GMT+1000 (Australian Eastern Standard Time)');

		connection = connectToDatabase();
	});

	beforeEach(() => {
		formParams = {
			email: 'example@example.com',
			username: 'Nobody',
			password: 'helloworld'
		};
	});

	it('validateFields', () => {
		//banned accounts can't login
		connection.unwrap().nextResult = [{total: 1}];

		validateFields(connection)(formParams)
			.then(() => fail('Email should\'ve been banned'), (obj) => expect(obj.msg).toEqual('This email account has been banned!'))
		;

		//not banned
		connection.unwrap().nextResult = [{total: 0}];

		validateFields(connection)(formParams)
			.then((obj) => expect(obj).toEqual(formParams))
		;
	});

	it('validatePassword', () => {
		//account doesn't exist
		connection.unwrap().nextResult = [];

		validatePassword(connection)(formParams)
			.then(() => fail('Account shouldn\'t have existed'), (obj) => expect(obj.extra[1]).toEqual('Did not find this email'))
		;

		//hashes don't match
		connection.unwrap().nextResult = [{ salt: 0, hash: 0 }];
		validatePassword(connection)(formParams)
			.then(() => fail('Hashes shouldn\'t have matched'), (obj) => expect(obj.extra[1]).toEqual('Did not find this password'))
		;

		//all correct
		connection.unwrap().nextResult = [{ salt: 0, hash: 12345 }];
		validatePassword(connection)(formParams)
			.then((obj) => expect(obj).toEqual(connection.unwrap().nextResult[0]))
		;
	});

	it('createNewSession', async () => {
		const accountRecord = {
			id: 0,
			email: 'example@example.com',
			username: 'Nobody'
		};

		const result = await createNewSession(connection)(accountRecord);

		expect(result.id).toEqual(accountRecord.id);
		expect(result.email).toEqual(accountRecord.email);
		expect(result.username).toEqual(accountRecord.username);
	});

	it('logoutRequest', () => {
		logoutRequest(connection)({ body: {id: 0, token: 0} }, { end:() => {
			//weird putting this into end(), but it works!
			expect(console.log).toHaveBeenCalledWith('log Tue Jan 1 2019 00:00:00 GMT+1000: Logged out (0,0)');
		}});
	});
});