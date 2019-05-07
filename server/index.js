//environment variables
require('dotenv').config();

//libraries
let express = require('express');
let app = express();
let http = require('http').Server(app);
let path = require('path');

//database
let { connectToDatabase } = require('./database.js');
let connection = connectToDatabase(); //uses .env

//handle accounts
let accounts = require('./accounts.js');
app.post('/signup', accounts.signup(connection));
app.get('/verify', accounts.verify(connection));

//static directories
app.use('/styles', express.static(path.resolve(__dirname + '/../public/styles')) );

//the app file
app.get('/app.bundle.js', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../public/app.bundle.js'));
});

//fallback
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname + '/../public/index.html'));
});

//startup
http.listen(4000, () => {
  console.log('listening to *:4000');
});