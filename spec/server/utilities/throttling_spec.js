const { throttle, isThrottled } = require('../../../server/utilities/throttling.js');

describe('Throttling', () => {
	it('Throttle an email', () => {
		let oldDate = Date;
		spyOn(global, 'Date').and.callFake(() => new oldDate('Tue Jan 1 2019 00:00:00 GMT+1000 (Australian Eastern Standard Time)'));

		throttle('example@example.com');

		expect(Date).toHaveBeenCalledTimes(1);
	});

	it('Check the throttle time (should return true)', () => {
		let oldDate = Date;
		spyOn(global, 'Date').and.callFake(() => new oldDate('Tue Jan 1 2019 00:00:09 GMT+1000 (Australian Eastern Standard Time)'));

		const result = isThrottled('example@example.com');

		expect(Date).toHaveBeenCalledTimes(1);
		expect(result).toEqual(true);
	});

	it('Check the throttle time (should return false)', () => {
		let oldDate = Date;
		spyOn(global, 'Date').and.callFake(() => new oldDate('Tue Jan 1 2019 00:00:10 GMT+1000 (Australian Eastern Standard Time)'));

		const result = isThrottled('example@example.com');

		expect(Date).toHaveBeenCalledTimes(1);
		expect(result).toEqual(false);
	});

	it('Check unrecognized email', () => {
		const result = isThrottled('unrecognized@example.com');

		expect(result).toEqual(false);
	});
});