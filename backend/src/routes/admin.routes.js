const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Admin-only middleware - ensures user has ADMIN role
const verifyAdmin = authorize(['ADMIN']);

// GET /api/admin/stats - Get dashboard statistics (recruiters, candidates, tests count)
router.get('/stats', verifyAdmin, adminController.getDashboardStats);

// GET /api/admin/registration-stats - Get registration statistics by time period
router.get('/registration-stats', verifyAdmin, adminController.getRegistrationStats);

// GET /api/admin/daily-registrations - Get daily registration statistics
router.get('/daily-registrations', verifyAdmin, adminController.getDailyRegistrations);

// GET /api/admin/users - Get all users with role and company information
router.get('/users', verifyAdmin, adminController.getAllUsers);

// GET /api/admin/users/:id - Get user details by ID
router.get('/users/:id', verifyAdmin, adminController.getUserById);

// POST /api/admin/users - Create new user
router.post('/users', verifyAdmin, adminController.createUser);

// PUT /api/admin/users/:id - Update user by ID
router.put('/users/:id', verifyAdmin, adminController.updateUser);

// DELETE /api/admin/users/:id - Delete a user by ID
router.delete('/users/:id', verifyAdmin, adminController.deleteUser);

// GET /api/admin/roles - Get all roles
router.get('/roles', verifyAdmin, adminController.getRoles);

// GET /api/admin/companies - Get all companies
router.get('/companies', verifyAdmin, adminController.getCompanies);

// GET /api/admin/candidates - Get all candidates from all companies
router.get('/candidates', verifyAdmin, adminController.getAllCandidates);

// ===== NOTIFICATION ROUTES =====
// IMPORTANT: Specific routes MUST come before parameterized routes to avoid conflicts

// GET /api/admin/notifications/unread-count - Get unread count (BEFORE /notifications)
router.get('/notifications/unread-count', verifyAdmin, notificationController.getUnreadCount);

// PUT /api/admin/notifications/read-all - Mark all as read (BEFORE /notifications/:id)
router.put('/notifications/read-all', verifyAdmin, notificationController.markAllAsRead);

// DELETE /api/admin/notifications/read - Delete all read notifications (BEFORE /notifications/:id)
router.delete('/notifications/read', verifyAdmin, notificationController.deleteReadNotifications);

// GET /api/admin/notifications - Get all notifications
router.get('/notifications', verifyAdmin, notificationController.getAllNotifications);

// PUT /api/admin/notifications/:id/read - Mark as read
router.put('/notifications/:id/read', verifyAdmin, notificationController.markAsRead);

// DELETE /api/admin/notifications/:id - Delete notification
router.delete('/notifications/:id', verifyAdmin, notificationController.deleteNotification);

module.exports = router;