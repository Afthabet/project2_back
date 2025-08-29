const express = require('express');
const router = express.Router();
const cars = require('../controllers/car.controller.js');
const multer = require('multer');

// Configure multer to store files in memory as buffers
// This is efficient for processing with `sharp` before saving.
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// GET all cars
router.get('/', cars.findAll);
router.post('/', upload.array('images', 10), cars.create);
router.put('/:id', upload.array('images', 10), cars.update);
// GET a single car by ID
router.get('/:id', cars.findOne);

// PATCH to update a car's status
router.patch('/:id/status', cars.updateStatus);

// DELETE a car by ID
router.delete('/:id', cars.delete);

module.exports = router;