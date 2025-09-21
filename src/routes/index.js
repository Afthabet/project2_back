const express = require('express');
const router = express.Router();
const userRoutes = require('./user.routes')

const carRoutes = require('./car.routes');
const authRoutes = require('./auth.routes'); 
const activityLogRoutes = require('./activityLog.routes.js');

router.use('/cars', carRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes); 
router.use('/activity-log', activityLogRoutes);

module.exports = router;