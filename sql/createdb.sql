# Fix for no default TIMESTAMP value
SET SQL_MODE='ALLOW_INVALID_DATES';
#diagnostic system
CREATE TABLE IF NOT EXISTS diagnostics (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	playerCount INTEGER NOT NULL DEFAULT 0,
	returnedPlayerCount INTEGER NOT NULL DEFAULT 0,
	totalGold INTEGER NOT NULL DEFAULT 0,
	totalRecruitments INTEGER NOT NULL DEFAULT 0,
	totalDeaths INTEGER NOT NULL DEFAULT 0,
	totalCombats INTEGER NOT NULL DEFAULT 0,
	activity INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS diagnosticsEvents (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	eventName VARCHAR(50),
	quantity INTEGER NOT NULL DEFAULT 1
);

# account system
CREATE TABLE IF NOT EXISTS signups (
	email VARCHAR(320) UNIQUE,
	username VARCHAR(100) UNIQUE,
	hash VARCHAR(100),
	promotions BOOLEAN DEFAULT FALSE,

	verify INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounts (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	email VARCHAR(320) UNIQUE,
	username VARCHAR(100) UNIQUE,
	hash VARCHAR(100),
	promotions BOOLEAN DEFAULT FALSE,

	lastActivityTime TIMESTAMP DEFAULT '2019-01-01 00:00:00'
);

CREATE TABLE IF NOT EXISTS sessions (
	sid varchar(255) NOT NULL PRIMARY KEY,
	session TEXT NOT NULL,
	expires BIGINT UNSIGNED NOT NULL,
	accountId INTEGER UNSIGNED,
	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passwordRecover (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	accountId INTEGER UNSIGNED UNIQUE,
	token INTEGER DEFAULT 0,

	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

#profile system
CREATE TABLE IF NOT EXISTS profiles (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	accountId INTEGER UNSIGNED UNIQUE,

	ladderRank INTEGER UNSIGNED,
	ladderRankWeight FLOAT UNSIGNED,

	gold INTEGER DEFAULT 100,
	recruits INTEGER DEFAULT 0,
	soldiers INTEGER DEFAULT 0,
	spies INTEGER DEFAULT 0,
	scientists INTEGER DEFAULT 0,

	lastRecruitTime TIMESTAMP DEFAULT '2019-01-01 00:00:00',

	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

#combat system
CREATE TABLE IF NOT EXISTS pendingCombat (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	eventTime TIMESTAMP,

	attackerId INTEGER UNSIGNED UNIQUE,
	defenderId INTEGER UNSIGNED,
	attackingUnits INTEGER UNSIGNED,

	CONSTRAINT FOREIGN KEY fk_attackerId(attackerId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT FOREIGN KEY fk_defenderId(defenderId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pastCombat (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	eventTime TIMESTAMP,

	attackerId INTEGER UNSIGNED,
	defenderId INTEGER UNSIGNED,
	attackingUnits INTEGER UNSIGNED,
	defendingUnits INTEGER UNSIGNED,

	undefended BOOLEAN,

	victor ENUM ('attacker', 'defender'),

	spoilsGold INTEGER,

	attackerCasualties INTEGER,

	flagCaptured BOOLEAN NOT NULL DEFAULT FALSE,

	CONSTRAINT FOREIGN KEY fk_attackerId(attackerId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT FOREIGN KEY fk_defenderId(defenderId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

#spying system
CREATE TABLE IF NOT EXISTS pendingSpying (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	eventTime TIMESTAMP,

	attackerId INTEGER UNSIGNED UNIQUE,
	defenderId INTEGER UNSIGNED,
	attackingUnits INTEGER UNSIGNED,

	CONSTRAINT FOREIGN KEY fk_attackerId(attackerId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT FOREIGN KEY fk_defenderId(defenderId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pastSpying (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	eventTime TIMESTAMP,

	attackerId INTEGER UNSIGNED,
	defenderId INTEGER UNSIGNED,
	attackingUnits INTEGER UNSIGNED,

	success ENUM ('success', 'failure', 'ineffective'),

	spoilsGold INTEGER,

	/* check the table "equipmentStolen" for a list of equipment stolen */

	CONSTRAINT FOREIGN KEY fk_attackerId(attackerId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT FOREIGN KEY fk_defenderId(defenderId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

#equipment system
CREATE TABLE IF NOT EXISTS equipment (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	accountId INTEGER UNSIGNED,

	name VARCHAR(50),
	quantity INTEGER,

	type VARCHAR(50),

	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS equipmentStolen (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	pastSpyingId INTEGER UNSIGNED,

	name VARCHAR(50), #TODO: make this NOT NULL
	quantity INTEGER,

	type VARCHAR(50),

	CONSTRAINT FOREIGN KEY fk_pastSpyingId(pastSpyingId) REFERENCES pastSpying(id) ON UPDATE CASCADE ON DELETE CASCADE
);

#badge system
CREATE TABLE IF NOT EXISTS badges (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	accountId INTEGER UNSIGNED,

	name VARCHAR(50) NOT NULL,
	active BOOLEAN NOT NULL DEFAULT FALSE,

	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badgesTimespan ( #for recording timespan-related badges
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	accountId INTEGER UNSIGNED,

	name VARCHAR(50) NOT NULL,

	qualifyTime TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

#banning system
CREATE TABLE IF NOT EXISTS bannedEmails (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	email VARCHAR(320) UNIQUE,
	reason VARCHAR(1000)
);