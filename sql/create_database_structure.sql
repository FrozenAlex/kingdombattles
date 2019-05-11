# account system
CREATE TABLE IF NOT EXISTS signups (
	email VARCHAR(320) UNIQUE,
	username VARCHAR(100) UNIQUE,
	salt VARCHAR(50),
	hash VARCHAR(100),

	verify INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounts (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	email VARCHAR(320) UNIQUE,
	username VARCHAR(100) UNIQUE,
	salt VARCHAR(50),
	hash VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS sessions (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	accountId INTEGER UNSIGNED,
	token INTEGER DEFAULT 0,

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

	gold INTEGER DEFAULT 100,
	recruits INTEGER DEFAULT 0,
	soldiers INTEGER DEFAULT 0,
	spies INTEGER DEFAULT 0,
	scientists INTEGER DEFAULT 0,

	CONSTRAINT FOREIGN KEY fk_accountId(accountId) REFERENCES accounts(id) ON UPDATE CASCADE ON DELETE CASCADE
);