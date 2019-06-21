const mysqlMock = {
	createConnection(config) {
		return {
			//the mock connection
			connected: false,
			lastQuery: '',

			connect(cb) {
				if (this.connected) {
					throw 'mysqlMock already connected';
				}

				this.connected = true;
				if (cb) {
					cb();
				}
			},

			on(msg, cb) {
				//DO NOTHING
			},

			async query(query, params, cb) {
				if (!this.connected) {
					throw 'mysqlMock not connected';
				}

				//So much for default arguments in node
				if (!Array.isArray(params)) {
					cb = params;
					params = null;
				}

				//do the mysql substitution
				let counter = 0;
				this.lastQuery = query.replace(/\?/g, () => `${params[counter++]}`);

				if (typeof(cb) === 'function') {
					return new Promise((resolve, reject) => cb());
				}
			},

			close() {
				if (!this.connected) {
					throw 'mysqlMock not connected';
				}
				this.connected = false;
			}
		};
	}
};

module.exports = mysqlMock;

