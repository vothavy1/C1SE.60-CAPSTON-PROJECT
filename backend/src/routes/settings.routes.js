const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Profile management
router.get('/profile', settingsController.getProfile);
router.put('/profile', settingsController.updateProfile);
router.post('/change-password', settingsController.changePassword);

// Activity logs
router.get('/activity-logs', settingsController.getActivityLogs);
router.get('/all-users-activity', settingsController.getAllUsersActivity);
router.get('/login-stats', settingsController.getLoginStats);

module.exports = router;
