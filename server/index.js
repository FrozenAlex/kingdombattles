"use strict";
//environment variables
require('dotenv').config();

//libraries
let express = require('express');
let compression = require('compression');
let expressSession = require('express-session')
let app = express();
let http = require('http').Server(app);
let bodyParser = require('body-parser');
let path = require('path');

let pool = require("./db/pool");

let MyStore = require('./util/sessionStore')(expressSession)

// Use a session for each client
app.use(
	expressSession({
	  secret: "ToatallySecretSessions",
	  saveUninitialized: true,
	  resave: true,
	  cookie: {
		httpOnly: false,
		secure: false,
	  },
	  store: new MyStore({client: pool})
	}),
  );

//utilities
let { log } = require('../common/utilities.js');
let { replacement, stringReplacement } = require('../common/replacement.js');

app.use(compression({
	level: 6
}))

// Temporary stuff
app.use('/content/', express.static(path.resolve(__dirname + '/../public/content/')) );
app.use('/', express.static(path.resolve(__dirname + '/../dist/')) );

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
require('./game/profile/goldtick').runGoldTick();
// Run the ladder tick
require('./game/profile/ladder').runLadderTick();

let combat = require('./game/combat.js');
app.post('/api/game/attack', combat.attackRequest);
app.post('/api/game/attackstatus', combat.attackStatusRequest);
app.post('/api/game/combatlog', combat.combatLogRequest);
combat.runCombatTick();

let spying = require('./game/spying.js');
app.post('/api/game/spy/', spying.spyRequest);
app.post('/api/game/spy/status', spying.spyStatusRequest);
app.post('/api/game/spy/log', spying.spyLogRequest);
spying.runSpyTick();

let equipment = require('./game/equipment.js');
app.post('/api/game/equipment/', equipment.equipmentRequest);
app.post('/api/game/equipment/purchase', equipment.purchaseRequest);
app.post('/api/game/equipment/sell', equipment.sellRequest);

let badges = require('./game/badges.js');
app.post('/api/game/badges/owned', badges.ownedRequest);
app.post('/api/game/badges/active', badges.selectActiveBadge);
badges.runBadgeTicks();

//a bit of fun
const taglineEngine = replacement(require('./taglines.json'));
app.get('/api/tagline', (req, res) => {
	res.send(taglineEngine('tagline'));
});

app.post('/api/easteregg', (req, res) => {
	if (req.body.query === 'search') {
		res.status(200).send('You found it!');
	} else {
		res.status(404).send('Keep searching!');
	}
});



//fallback to index.html
app.get('*', (req, res) => {
	res.sendFile(path.resolve(__dirname + '/../dist/index.html'));
});

//startup
http.listen(process.env.PORT  || 3000, () => {
	log(`listening to *:${process.env.PORT || 3000}`);
});

