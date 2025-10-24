const express = require('express');
const router = express.Router();
const userRoutes = require('./user.routes')

const carRoutes = require('./car.routes');
const authRoutes = require('./auth.routes'); 
const activityLogRoutes = require('./activityLog.routes.js');
const inquiryRoutes = require('./inquiry.routes.js');
router.use('/cars', carRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes); 
router.use('/activity-log', activityLogRoutes);
router.use('/inquiry', inquiryRoutes);
module.exports = router;