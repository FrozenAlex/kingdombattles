//formParams
const formReq = {
	body: {
		id: 0,
		token: 12345
	}
}

const formFields = {
	email: 'example@example.com',
	username: 'Nobody'
};

const formFiles = {
	avatar: 'image.png'
};

//rewire
const rewiremock = require('rewiremock/node');

rewiremock('formidable').with({
	IncomingForm() {
		return {
			parse(req, next) {
				expect(req).toEqual(formReq);
				next(undefined, formFields, formFiles);
			}
		};
	}
});

//the functions to test
rewiremock.enable();

const formidablePromise = require('../../../server/utilities/formidable_promise.js');

rewiremock.disable();

describe('formidablePromise', () => {
	it('formidablePromise check', async () => {
		const results = await formidablePromise(formReq);

		expect(results.fields).toEqual(formFields);
		expect(results.files).toEqual(formFiles);
	});
});
