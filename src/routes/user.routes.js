const express = require('express');
const router = express.Router();
const users = require('../controllers/user.controller.js');

// Route to get all users
router.get('/', users.findAll);

// UPDATED: Route to create a new user
router.post('/', users.create);

// UPDATED: Route to update a user by their ID
router.put('/:id', users.update);

// Route to delete a user by their ID
router.delete('/:id', users.delete);

module.exports = router;