let pool = require('./../db/pool');

let passport = require("passport");
let bcrypt = require('bcryptjs');

let LocalStrategy = require("passport-local").Strategy;
let GoogleStrategy = require("passport-google-oauth20").Strategy;

const GOOGLE_CLIENT_ID = "729853527258-074ts3koml5i1i6fdpb39ceafalksql3.apps.googleusercontent.com"
const GOOGLE_CLIENT_SECRET = "Q3taeIBJoyMOcFGI64e9PuP8"

let {
    log,
    validateEmail
} = require('../../common/utilities.js');

let {
    logActivity
} = require('../utilities.js');


// If the secrets are provided add strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.WEB_ADDRESS}/api/account/social/googlecallback`
        },
        function (accessToken, refreshToken, profile, cb) {
            console.log(profile)
            User.findOrCreate({
                googleId: profile.id
            }, function (err, user) {
                return cb(err, user);
            });
        }
    ));
}



passport.use(new LocalStrategy({
        usernameField: "email",
        passwordField: "password",
    },
    async function (email, password, cb) {
        console.log(email, password)
        //check to see if the email has been banned
        let bannedEmails = (await pool.promise().query('SELECT COUNT(*) as total FROM bannedEmails WHERE email = ?;', [email]))[0]

        //if the email has been banned
        if (bannedEmails.total > 0) {
            log('This email account has been banned!', 'login', fields.email);
            return cb(null, false);
        }

        //find this email's information
        let userData = (await pool.promise().query('SELECT id, username, hash FROM accounts WHERE email = ?;', [email]))[0]

        //found this email?
        if (userData.length === 0) {
            log('Incorrect email or password', email, 'Did not find this email') //NOTE: deliberately obscure incorrect email or password
            return cb(null, false);
        }

        //compare the passwords
        let isValidPassword = await bcrypt.compare(password, userData[0].hash)
        if (!isValidPassword) {
            log('Incorrect email or password', email, 'Did not find this password');
            return cb(null, false);
        }

        logActivity(userData[0].id);

        return cb(null, userData[0]);
    }));

module.exports = passport;