"use strict";
//environment variables
require('dotenv').config();

//libraries
let express = require('express');
let compression = require('compression');
let expressSession = require('express-session')
var expressStaticGzip = require("express-static-gzip");
let app = express();
let http = require('http').Server(app);
let bodyParser = require('body-parser');
let path = require('path');

let pool = require("./db/pool");
let passport = require('./account/authStrategies.js');

app.use(passport.initialize());
app.use(passport.session());

let MyStore = require('./util/sessionStore')(expressSession)

// Don't cache index.html
app.get('/', (req, res)=>{
	res.set({'Cache-Control': 'max-age=30000'});
	res.sendFile(path.join(__dirname, "../dist/index.html"), {

	})
})

// Shortcut for staticly compressed files
app.use("/", expressStaticGzip(path.resolve(__dirname + '/../dist/'), {
	enableBrotli: true,
	maxAge:  1000*60*60*24*30,
	orderPreference: ['br','gzip'],
	serveStatic: {
		etag:false
	}
}));

// Compress everything else
app.use(compression({
	level: 6
}))


// Static files
app.use('/', express.static(path.resolve(__dirname + '/../dist/'), {
	maxAge: 1000*60*60*24*30,
	etag: false
}));

// Use a session for each client
app.use(
	expressSession({
		secret: "ToatallySecretSessions",
		saveUninitialized: true,
		resave: true,
		proxy: true,
		cookie: {
			httpOnly: false,
			secure: (process.env.NODE_ENV !== "development"),
			sameSite: true,
			maxAge: 30 * 24 * 60 * 60 * 1000 // 30 Days 
		},
		store: new MyStore({
			client: pool
		}),
		rolling: true,
		saveUninitialized: false // Don't save not logged in cookies
	}),
);

//utilities
let {
	log
} = require('../common/utilities.js');
let {
	replacement,
	stringReplacement
} = require('../common/replacement.js');



app.use(bodyParser.json());

//handle the news request
let news = require('./news/news.js');
app.use('/api/news', news);

//handle diagnostics
let diagnostics = require('./diagnostics.js');
diagnostics.runDailyDiagnostics();

//game statistics
let statistics = require('./game/statistics.js');
app.post('/api/game/stats/', statistics.statisticsRequest);

//handle accounts
let accounts = require('./account/accounts.js');
app.use("/api/account", accounts)

//handle profiles
let profiles = require('./game/profile/index.js');
app.use('/api/game/profile', profiles);

// Run gold tick

// Run the ladder tick


// Import services
let combat = require('./game/combat.js');
let spying = require('./game/spying.js');
let badges = require('./game/badges.js');

// Run 'ticks'
combat.runCombatTick();
spying.runSpyTick();
badges.runBadgeTicks();
require('./game/profile/goldtick').runGoldTick();
require('./game/profile/ladder').runLadderTick();

// Apply game routes
let game = require('./game');
app.use('/api/game', game)

//a bit of fun
const taglineEngine = replacement(require('./taglines.json'));
app.get('/api/tagline', (req, res) => {res.send(taglineEngine('tagline'));});

app.post('/api/easteregg', (req, res) => {
	if (req.body.query === 'search') {
		res.status(200).send('You found it!');
	} else {
		res.status(404).send('Keep searching!');
	}
});

//fallback to index.html
app.get('*', (req, res) => {
	res.set({'Cache-Control': 'max-age=30000'});
	res.sendFile(path.resolve(__dirname + '/../dist/index.html'));
});

//startup
http.listen(process.env.PORT || 3000, () => {
	log(`listening to *:${process.env.PORT || 3000}`);
});