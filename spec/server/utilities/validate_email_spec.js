const validateEmail = require('../../../server/utilities/validate_email.js');

//Reference: https://blogs.msdn.microsoft.com/testing123/2009/02/06/email-address-test-cases/

describe('Validate email', () => {
	it('Valid emails', () => {
		expect(validateEmail('email@domain.com')).toEqual(true); //Valid email
		expect(validateEmail('firstname.lastname@domain.com')).toEqual(true); //Email contains dot in the address field
		expect(validateEmail('email@subdomain.domain.com')).toEqual(true); //Email contains dot with subdomain
		expect(validateEmail('firstname+lastname@domain.com')).toEqual(true); //Plus sign is considered valid character
//		expect(validateEmail('email@123.123.123.123')).toEqual(true); //Domain is valid IP address
		expect(validateEmail('email@[123.123.123.123]')).toEqual(true); //Square bracket around IP address is considered valid
		expect(validateEmail('"email"@domain.com')).toEqual(true); //Quotes around email is considered valid
		expect(validateEmail('1234567890@domain.com')).toEqual(true); //Digits in address are valid
		expect(validateEmail('email@domain-one.com')).toEqual(true); //Dash in domain name is valid
		expect(validateEmail('_______@domain.com')).toEqual(true); //Underscore in the address field is valid
		expect(validateEmail('email@domain.name')).toEqual(true); //.name is valid Top Level Domain name
		expect(validateEmail('email@domain.co.jp')).toEqual(true); //Dot in Top Level Domain name also considered valid (use co.jp as example here)
		expect(validateEmail('firstname-lastname@domain.com')).toEqual(true); //Dash in address field is valid
	});

	it('Invalid emails', () => {
		expect(validateEmail('plainaddress')).toEqual(false); //Missing @ sign and domain
		expect(validateEmail('#@%^%#$@#$@#.com')).toEqual(false); //Garbage
		expect(validateEmail('@domain.com')).toEqual(false); //Missing username
		expect(validateEmail('Joe Smith <email@domain.com>')).toEqual(false); //Encoded html within email is invalid
		expect(validateEmail('email.domain.com')).toEqual(false); //Missing @
		expect(validateEmail('email@domain@domain.com')).toEqual(false); //Two @ sign
		expect(validateEmail('.email@domain.com')).toEqual(false); //Leading dot in address is not allowed
		expect(validateEmail('email.@domain.com')).toEqual(false); //Trailing dot in address is not allowed
		expect(validateEmail('email..email@domain.com')).toEqual(false); //Multiple dots
//		expect(validateEmail('あいうえお@domain.com')).toEqual(false); //Unicode char as address
		expect(validateEmail('email@domain.com (Joe Smith)')).toEqual(false); //Text followed email is not allowed
		expect(validateEmail('email@domain')).toEqual(false); //Missing top level domain (.com/.net/.org/etc)
//		expect(validateEmail('email@-domain.com')).toEqual(false); //Leading dash in front of domain is invalid
//		expect(validateEmail('email@domain.web')).toEqual(false); //.web is not a valid top level domain
		expect(validateEmail('email@111.222.333.44444')).toEqual(false); //Invalid IP format
		expect(validateEmail('email@domain..com')).toEqual(false); //Multiple dot in the domain portion is invalid
	});
});