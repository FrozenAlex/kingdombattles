//stopgap file

//TODO: remove this file when you rewrite index.js

const password = require('./password.js');
const privacy = require('./privacy.js');
const session = require('./session.js');
const signup = require('./signup.js');
const verifyAccount = require('./verify_account.js');

module.exports = {
	...password,
	...privacy,
	...session,
	...signup,
	...verifyAccount
};