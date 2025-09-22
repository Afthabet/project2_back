const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller.js');

router.post('/login', auth.login);
router.post('/refresh-token', auth.refreshToken); // Add this new route
router.post('/logout', auth.logout);
module.exports = router;