//environment variables
require('dotenv').config();

//switches
let isThrottledSwitch = false;
let sendmailSwitch = false;
let skipBodySwitch = false;

//objects
let connection;
let formParams;

//rewire
const rewiremock = require('rewiremock/node');

rewiremock('../../../server/utilities/throttling.js').with({
	throttle: (email) => email,
	isThrottled: (email) => isThrottledSwitch
});

rewiremock('mysql').with(require('../../helpers/mysql_mock.js'));

rewiremock('sendmail').with((config) => {
	//do nothing with config
	return (parameters, next) => {
		//check the parameters
		expect(parameters.from).toEqual(`signup@${process.env.WEB_ADDRESS}`);
		expect(parameters.to).toEqual('example@example.com');
		expect(parameters.subject).toEqual('Email Verification');

		if (!skipBodySwitch) { //skip this because of non-deterministic results for rand
			expect(parameters.text).toEqual(`Hello! Please visit the following address to verify your account: http://${process.env.WEB_ADDRESS}/verifyrequest?email=${parameters.to}&verify=0`);
		}

		//pass to the next promise
		next(sendmailSwitch); //sendmailSwitch causes an error if true
	};
});

rewiremock('formidable').with({
	IncomingForm() {
		return {
			parse(req, next) {
				next(undefined, formParams.fields, formParams.files);
			}
		};
	}
});

//the functions to test
rewiremock.enable();

const {
	signupRequest,
	validateSignup,
	generateSaltAndHash,
	sendSignupEmail
} = require('../../../server/accounts/signup.js');

//other stuff to rewire
const connectToDatabase = require('../../../server/utilities/database.js');

rewiremock.disable();

describe('Signup system', () => {
	beforeAll(() => {
		//put it here to dummy out the extra logging from connectToDatabase()
		spyOn(console, 'log');

		connection = connectToDatabase();
	});

	beforeEach(() => {
		formParams = {
			fields: {
				email: 'example@example.com',
				username: 'Nobody',
				password: 'helloworld',
				retype: 'helloworld'
			},
			//files: {
			//	name: 'file.png'
			//}
		};
	});

	it ('ValidateSignup throttling', async () => {
		isThrottledSwitch = !isThrottledSwitch;

		await validateSignup(connection)(formParams)
			.then(() => fail('Signup not throttled'), result => expect(result.msg).toEqual('Signup throttled'))
		;

		isThrottledSwitch = !isThrottledSwitch;
	});

	it('validateSignup invalid fields', async () => {
		//email
		await validateSignup(connection)({fields: {...formParams.fields, email: 'invalid email'}})
			.then(() => fail('Email not invalid'), result => expect(result.msg).toEqual('Invalid signup data'))
		;

		//username too long
		await validateSignup(connection)({fields: {...formParams.fields, username: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890x'}})
			.then(() => fail('Username not invalid'), result => expect(result.msg).toEqual('Invalid signup data'))
		;

		//username too short
		await validateSignup(connection)({fields: {...formParams.fields, username: '123'}})
			.then(() => fail('Username not invalid'), result => expect(result.msg).toEqual('Invalid signup data'))
		;

		//password too short
		await validateSignup(connection)({fields: {...formParams.fields, password: '1234567', retype: '1234567'}})
			.then(() => fail('Password not invalid'), result => expect(result.msg).toEqual('Invalid signup data'))
		;

		//retype doesn't match
		await validateSignup(connection)({fields: {...formParams.fields, password: '12345678', retype: '123456789'}})
			.then(() => fail('Retype not invalid'), result => expect(result.msg).toEqual('Invalid signup data'))
		;

		//check banning
		connection.unwrap().nextResult = [{ total: 1, email: 0, username: 0 }]; //result of bannedEmails
		await validateSignup(connection)(formParams)
			.then(() => fail('Banned emails don\'t work'), (result) => expect(result.msg).toEqual('This email account has been banned!'))
		;

		//email exists
		connection.unwrap().nextResult = [{total: 0, email: 1, username: 0 }]; //results for existing emails
		await validateSignup(connection)(formParams)
			.then(() => fail('Existing email check doesn\'t work'), (result) => expect(result.msg).toEqual('Email already registered!'))
		;

		//username exists
		connection.unwrap().nextResult = [{total: 0, email: 0, username: 1}]; //results for existing usernames
		await validateSignup(connection)(formParams)
			.then(() => fail('Existing username check doesn\'t work'), (result) => expect(result.msg).toEqual('Username already registered!'))
		;
	});

	it('validateSignup valid fields', async () => {
		//good results from database
		connection.unwrap().nextResult = [{total: 0, email: 0, username: 0}];

		//username not too long, not too short, password not to short
		await validateSignup(connection)({fields: {...formParams.fields, username: '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'}})
			.then(() => validateSignup(connection)({fields: {...formParams.fields, username: '1234'}}))
			.then(() => validateSignup(connection)({fields: {...formParams.fields, password: '12345678', retype: '12345678'}}))
		;

		//all went well
		await validateSignup(connection)(formParams)
			.then((fields) => expect(fields).toEqual(formParams.fields))
		;
	});

	it('generateSaltAndHash results', async () => {
		return generateSaltAndHash(connection)(formParams.fields);
	});

	it('sendSignupEmail results', async () => {
		//check failure
		sendmailSwitch = !sendmailSwitch;

		const failObj = await sendSignupEmail()({rand: 0, fields: formParams.fields})
			.then(() => fail('send mail succeeded when it should\'ve failed'), e => e)
		;

		expect(failObj.msg).toEqual('Something went wrong');

		//check success
		sendmailSwitch = !sendmailSwitch;

		const successObj = await sendSignupEmail()({rand: 0, fields: formParams.fields})
		;

		expect(successObj.msg).toEqual('Verification email sent!');
	});

	it('signupRequest intergration test', async () => {
		skipBodySwitch = !skipBodySwitch; //skip the body expect() due to non-deterministic results

		sendmailSwitch = !sendmailSwitch; //force an error in the intergration test

		await signupRequest(connection)({}, {status: (s) => { expect(s).toEqual(400); return { write: () => null, json: () => null}}, end: () => null});

		sendmailSwitch = !sendmailSwitch; //switch off the error switch

		//victory lap
		await signupRequest(connection)({}, {status: (s) => { expect(s).toEqual(200); return { write: () => null, json: () => null}}, end: () => null});
	});
});

