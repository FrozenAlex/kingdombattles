let {
    getBadgesStatistics,
    getBadgesOwned,
    logActivity,
    isAttacking,
    isSpying
} = require('./../../utilities.js');

let {
    log
} = require('../../../common/utilities.js');

let pool = require("./../../db/pool.js");

/**
 * Train request. Returns false on success and string on error he he
 * @param {*} id 
 * @param {*} role 
 */
async function trainRequest(id, role) {
    // Verify role
    if (!(['soldier', 'spy', 'scientist'].includes(role))) return "Role does not exist";

    // can't train while attacking
    let attacking = await isAttacking(id);
    if (attacking) {
        return 'You can\'t do it while you are attacking'
    }

    let spying = await isSpying(id)
    if (spying) {
        return 'Can\'t train while spying';
    }

    //determine the cost of the training TODO: make these global for the client too
    let cost = 0;
    switch (role) {
        case 'soldier':
            cost = 100;
            break;

        case 'spy':
            cost = 300;
            break;

        case 'scientist':
            cost = 120;
            break;
    }

    //verify that the user has a high enough gold and recruit balance
    // Check it on the client??
    let balance = (await pool.promise().query('SELECT recruits, gold FROM profiles WHERE accountId = ?;', [id]))[0]

    if (balance[0].recruits <= 0) {
        return 'Not enough recruits'
    }

    if (balance[0].gold < cost) {
        return 'Not enough gold'
    }

    //update the profile with new values (NOTE: extra protection for network latency)
    await pool.promise().query(
        'UPDATE profiles SET gold = gold - ?, recruits = recruits - 1, soldiers = soldiers + ?, spies = spies + ?, scientists = scientists + ? WHERE accountId = ? AND gold >= ? AND recruits > 0;',
        [
            cost,
            role === 'soldier' ? 1 : 0,
            role === 'spy' ? 1 : 0,
            role === 'scientist' ? 1 : 0,
            id,
            cost
        ])

    return false;
};

async function untrainRequest(id, role) {
    // Verify role
    if (!(['soldier', 'spy', 'scientist'].includes(role))) return "Role does not exist";

    // can't untrain while attacking
    let attacking = await isAttacking(id);
    if (attacking) {
        return 'You can\'t do it while you are attacking'
    }

    let spying = await isSpying(id)
    if (spying) {
        return 'Can\'t untrain while spying';
    }

    //verify that the user has a high enough balance
    let userBalance = (await pool.promise().query(
        'SELECT soldiers, spies, scientists FROM profiles WHERE accountId = ?;',
        [id]))[0]

    if (role === 'soldier' && userBalance[0].soldiers <= 0) {
        return 'Not enough soldiers'
    }

    if (role === 'spy' && userBalance[0].spies <= 0) {
        return 'Not enough spies'
    }

    if (role === 'scientist' && userBalance[0].scientists <= 0) {
        return 'Not enough scientists'
    }

    // Update the profile with new values (NOTE: extra protection for network latency)
    let plurals = {
        'soldier': 'soldiers',
        'scientist': 'scientists',
        'spy': 'spies'
    };
    (await pool.promise().query(
        `UPDATE profiles SET recruits = recruits + 1, soldiers = soldiers - ?, spies = spies - ?, scientists = scientists - ? WHERE accountId = ? AND ${plurals[role]} > 0;`,
        [
            plurals[role] === 'soldiers' ? 1 : 0,
            plurals[role] === 'spies' ? 1 : 0,
            plurals[role] === 'scientists' ? 1 : 0,
            id
        ]))
    // Success
    return false;
};

async function recruitRequest(id) {
    let timeDifference = (await pool.promise().query(
        'SELECT TIMESTAMPDIFF(HOUR, (SELECT lastRecruitTime FROM profiles WHERE accountId = ?), CURRENT_TIMESTAMP());',
        [id]
    ))[0]

    if (timeDifference.length !== 1) {
        return 'Invalid database state'
    }

    let timespans = timeDifference[0][Object.keys(timeDifference[0])];

    //not enough time has passed
    if (timespans < 20) {
        return 'Not enough time has passed, you need to wait '+ (20-timespans) + ' hours';
    }

    //update the profile with the new data (gaining 1 recruit)
    pool.promise().query(
        'UPDATE profiles SET recruits = recruits + 1, lastRecruitTime = CURRENT_TIMESTAMP() WHERE accountId	= ?;', [id])

    return false
}

module.exports = {
    untrainRequest,
    trainRequest,
    recruitRequest
}