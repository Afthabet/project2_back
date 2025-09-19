const express = require('express');
const { authenticateToken } = require('../middleware/auth.middleware');
const users = require('../controllers/user.controller.js');

const router = express.Router();

router.get("/", authenticateToken, users.findAll);
router.post("/", authenticateToken, users.create);
router.put("/:id", authenticateToken, users.update);
router.delete("/:id", authenticateToken, users.delete);

module.exports = router;
