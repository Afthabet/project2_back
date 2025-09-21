const express = require('express');
const router = express.Router();
const activityLog = require('../controllers/activityLog.controller.js');

router.get('/', activityLog.findAll);

module.exports = router;