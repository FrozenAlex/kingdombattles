/**
 * Profile
 */
let pool = require('../../db/pool.js')

let {
    getBadgesOwned,
    logActivity
} = require('./../../utilities.js');

let {
    log
} = require('../../../common/utilities.js');

/**
 * Create profile function for internal use, returns true on success
 * @param {number} id
 * @param {string} username 
 */
async function createProfile(username) {
    // Check if the profile exists
    let accounts = (await pool.promise().query('SELECT accountId FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);', [username]))[0]

    if (accounts.length === 1) {
        return false
    }

    //create the profile
    (await pool.promise().query(
        'INSERT INTO profiles (accountId) SELECT accounts.id FROM accounts WHERE username = ?;',
        [username]))[0]
    log('Profile created', username);
    // logActivity(body.id);

    return true
};

/**
 * Get profile inner function
 * @param {username} username Username
 * @param {boolean} private Private or public profile to hide some of the stats
 */
async function getProfile(username, private = true) {
    // Get the profile.
    let profiles = (await pool.promise().query(
        'SELECT * FROM profiles WHERE accountId IN (SELECT accounts.id FROM accounts WHERE username = ?);',
        [username]))[0]

    // Check if theprofile exist
    if (profiles.length !== 1) {
        // Don't pass it anywhere we will check it in the request
        return null
    } else {
        let userProfile = profiles[0];

        // Get owned badges
        let owndedBadges = await getBadgesOwned(userProfile.accountId)

        // Active badges
        let activeBadge = Object.keys(owndedBadges).find(name => owndedBadges[name].active) || null;

        log('Profile sent', username);
        return {
            username: username,
            gold: userProfile.gold,
            recruits: userProfile.recruits,
            soldiers: userProfile.soldiers,
            spies: (private) ? userProfile.spies : "Secret",
            scientists: userProfile.scientists,
            activeBadge: activeBadge,
        }

    }
};

module.exports = {
    createProfile,
    getProfile
}