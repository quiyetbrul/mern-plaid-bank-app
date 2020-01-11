const router = require('express').Router();
const plaidRoutes   = require('./plaid');
const userRoutes   = require('./users');
const path = require('path');

router.use('/api/users', userRoutes);
router.use('/api/plaid', plaidRoutes);

// If no API routes are hit, send the React app
// router.use(function(req, res) {
// 	res.sendFile(path.join(__dirname, '../client/build/index.html'));
// });

module.exports = router;