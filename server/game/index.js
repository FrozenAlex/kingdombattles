/**
 * Game router
 */
let express = require('express');
let router = express.Router();

// Import game functionality
let combat = require('./combat.js');
let spying = require('./spying.js');
let equipment = require('./equipment.js');
let badges = require('./badges.js');


// Public routes

// Owned Badges are public
router.post('/badges/owned', badges.ownedRequest);


router.use(require('./../middleware/auth').requireAuth)

//***** Private routes *****//

// Attack is private
router.post('/attack', combat.attackRequest);
router.post('/attackstatus', combat.attackStatusRequest);
router.post('/combatlog', combat.combatLogRequest);

// Spying is confidential
router.post('/spy/', spying.spyRequest);
router.post('/spy/status', spying.spyStatusRequest);
router.post('/spy/log', spying.spyLogRequest);

// Equipment is private
router.post('/equipment/', equipment.equipmentRequest);
router.get('/equipment/', equipment.equipmentRequest);
router.post('/equipment/purchase', equipment.purchaseRequest);
router.post('/equipment/sell', equipment.sellRequest);

// Ability to set badge is private
router.post('/badges/active', badges.selectActiveBadge);



module.exports = router;