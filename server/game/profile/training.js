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

async function trainRequest(id, role) {
    // Verify role
    if (!(role in ['soldier', 'spy', 'scientist'])) return false;

    // can't train while attacking
    let attacking = await isAttacking(req.body.id);
    if (attacking) {
        return false
    }

    let spying = await isSpying(req.body.id)

    if (spying) {
        res.status(400).write(log('Can\'t train while spying', req.body.id));
        res.end();
        return;
    }

    //determine the cost of the training TODO: make these global for the client too
    let cost = 0;
    switch (req.body.role) {
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
    let query = 'SELECT recruits, gold FROM profiles WHERE accountId = ?;';
    pool.query(query, [req.body.id], (err, results) => {
        if (err) throw err;

        if (results[0].recruits <= 0) {
            res.status(400).write(log('Not enough recruits', results[0].recruits, req.body.id, req.body.token));
            res.end();
            return;
        }

        if (results[0].gold < cost) {
            res.status(400).write(log('Not enough gold', results[0].gold, req.body.id, req.body.token));
            res.end();
            return;
        }

        //update the profile with new values (NOTE: extra protection for network latency)
        let query = 'UPDATE profiles SET gold = gold - ?, recruits = recruits - 1, soldiers = soldiers + ?, spies = spies + ?, scientists = scientists + ? WHERE accountId = ? AND gold >= ? AND recruits > 0;';
        pool.query(query, [cost, req.body.role === 'soldier' ? 1 : 0, req.body.role === 'spy' ? 1 : 0, req.body.role === 'scientist' ? 1 : 0, req.body.id, cost], (err) => {
            if (err) throw err;

            //send the new profile data as JSON (NOTE: possible duplication)
            let query = 'SELECT username, profiles.* FROM profiles JOIN accounts ON accounts.id = profiles.accountId WHERE accounts.id = ?;';
            pool.query(query, [req.body.id], (err, results) => {
                if (err) throw err;

                //check just in case
                if (results.length !== 1) {
                    res.status(400).write(log('Invalid recruit credentials - 2', req.body.id, req.body.token));
                    res.end();
                    return;
                }

                getBadgesOwned(connection, results[0].accountId, (err, {
                    owned
                }) => {
                    if (err) throw err;

                    getBadgesStatistics((err, {
                        statistics
                    }) => {
                        if (err) throw err;

                        let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

                        res.status(200).json({
                            username: results[0].username,
                            gold: results[0].gold,
                            recruits: results[0].recruits,
                            soldiers: results[0].soldiers,
                            spies: results[0].spies,
                            scientists: results[0].scientists,
                            activeBadge: activeBadge,
                            activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
                        });
                        res.end();

                        log('Train executed', results[0].username, req.body.role, req.body.id, req.body.token);
                        logActivity(req.body.id);
                    });
                });
            });
        });
    });
};

async function untrainRequest(req, res) {
    //verify the role argument
    if (req.body.role !== 'soldier' && req.body.role !== 'spy' && req.body.role !== 'scientist') {
        res.status(400).write(log('Invalid untrain parameters', req.body.role, req.body.id, req.body.token));
        res.end();
        return;
    }

    //can't untrain while attacking
    isAttacking(connection, req.body.id, (err, attacking) => {
        if (err) throw err;

        if (attacking) {
            res.status(400).write(log('Can\'t untrain while attacking', req.body.id, req.body.token));
            res.end();
            return;
        }

        isSpying(connection, req.body.id, (err, spying) => {
            if (err) throw err;

            if (spying) {
                res.status(400).write(log('Can\'t untrain while spying', req.body.id, req.body.token));
                res.end();
                return;
            }

            //verify that the user has a high enough balance
            let query = 'SELECT soldiers, spies, scientists FROM profiles WHERE accountId = ?;';
            pool.query(query, [req.body.id], (err, results) => {
                if (err) throw err;

                if (req.body.role === 'soldier' && results[0].soldiers <= 0) {
                    res.status(400).write(log('Not enough soldiers', results[0].soldiers, req.body.id, req.body.token));
                    res.end();
                    return;
                }

                if (req.body.role === 'spy' && results[0].spies <= 0) {
                    res.status(400).write(log('Not enough spies', results[0].spies, req.body.id, req.body.token));
                    res.end();
                    return;
                }

                if (req.body.role === 'scientist' && results[0].scientists <= 0) {
                    res.status(400).write(log('Not enough scientists', results[0].scientists, req.body.id, req.body.token));
                    res.end();
                    return;
                }

                //hacky
                let roleName = null;

                if (req.body.role === 'soldier') {
                    roleName = 'soldiers';
                } else if (req.body.role === 'spy') {
                    roleName = 'spies';
                } else if (req.body.role === 'scientist') {
                    roleName = 'scientists';
                } else {
                    res.status(400).write(log('Unknown role received', req.body.role, req.body.id, req.body.token));
                    res.end();
                    return;
                }

                //update the profile with new values (NOTE: extra protection for network latency)
                let query = `UPDATE profiles SET recruits = recruits + 1, soldiers = soldiers - ?, spies = spies - ?, scientists = scientists - ? WHERE accountId = ? AND ${roleName} > 0;`;
                pool.query(query, [roleName === 'soldiers' ? 1 : 0, roleName === 'spies' ? 1 : 0, roleName === 'scientists' ? 1 : 0, req.body.id], (err) => {
                    if (err) throw err;

                    //send the new profile data as JSON (NOTE: possible duplication)
                    let query = 'SELECT username, profiles.* FROM profiles JOIN accounts ON accounts.id = profiles.accountId WHERE accounts.id = ?;';
                    pool.query(query, [req.body.id], (err, results) => {
                        if (err) throw err;

                        //check just in case
                        if (results.length !== 1) {
                            res.status(400).write(log('Invalid untrain credentials - 2', req.body.role, req.body.id, req.body.token));
                            res.end();
                            return;
                        }

                        getBadgesOwned(connection, results[0].accountId, (err, {
                            owned
                        }) => {
                            if (err) throw err;

                            getBadgesStatistics((err, {
                                statistics
                            }) => {
                                if (err) throw err;

                                let activeBadge = Object.keys(owned).find(name => owned[name].active) || null;

                                res.status(200).json({
                                    username: results[0].username,
                                    gold: results[0].gold,
                                    recruits: results[0].recruits,
                                    soldiers: results[0].soldiers,
                                    spies: results[0].spies,
                                    scientists: results[0].scientists,
                                    activeBadge: activeBadge,
                                    activeBadgeFilename: activeBadge ? statistics[activeBadge].filename : null
                                });
                                res.end();

                                log('Untrain executed', results[0].username, roleName, req.body.id, req.body.token);
                                logActivity(req.body.id);
                            });
                        });
                    });
                });
            });
        });
    });
};