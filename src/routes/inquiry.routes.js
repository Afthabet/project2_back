// routes/inquiry.routes.js
const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller.js');

// This route will handle POST requests to /api/inquiry
router.post('/', inquiryController.sendInquiry);

module.exports = router;