CREATE TABLE signups (
	email VARCHAR(320) UNIQUE,
	username VARCHAR(100) UNIQUE,
	salt VARCHAR(50),
	hash VARCHAR(100),

	verify INTEGER DEFAULT 0
);

CREATE TABLE accounts (
	id INTEGER UNSIGNED AUTO_INCREMENT PRIMARY KEY UNIQUE,
	td TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),

	email VARCHAR(320) UNIQUE,
	username VARCHAR(100) UNIQUE,
	salt VARCHAR(50),
	hash VARCHAR(100)
);
