const express = require('express');
const router = express.Router();
const cars = require('../controllers/car.controller.js');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth.middleware'); // Import the middleware

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Public Routes ---
// Anyone can view the list of cars and details of a single car
router.get('/', cars.findAll);
router.get('/:id', cars.findOne);

// --- Protected Routes ---
// The authenticateToken middleware now protects these routes.
// It will run BEFORE the controller functions.
router.post('/', authenticateToken, upload.array('images', 10), cars.create);
router.put('/:id', authenticateToken, upload.array('images', 10), cars.update);
router.patch('/:id/status', authenticateToken, cars.updateStatus);
router.delete('/:id', authenticateToken, cars.delete);

module.exports = router;
