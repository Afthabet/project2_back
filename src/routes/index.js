const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const carRoutes = require('./car.routes');

// Mount routes under /api/*
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cars', carRoutes);

// Health check route
router.get('/', (req, res) => {
  res.json({ message: 'API is working!' });
});

module.exports = router;
