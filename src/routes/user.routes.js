const express = require('express');
const router = express.Router();
const users = require('../controllers/user.controller.js');

// Route to get all users
router.get('/', users.findAll);

// Route to delete a user by their ID
router.delete('/:id', users.delete);

module.exports = router;