const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth.middleware');

// Tất cả routes yêu cầu ADMIN
router.use(authenticateToken, authorizeRole('ADMIN'));

// GET /api/admin/notifications - Lấy tất cả thông báo
router.get('/', notificationController.getAllNotifications);

// GET /api/admin/notifications/unread-count - Đếm thông báo chưa đọc
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/admin/notifications/:id/read - Đánh dấu đã đọc
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/admin/notifications/read-all - Đánh dấu tất cả đã đọc
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/admin/notifications/:id - Xóa thông báo
router.delete('/:id', notificationController.deleteNotification);

// DELETE /api/admin/notifications/read - Xóa tất cả thông báo đã đọc
router.delete('/read', notificationController.deleteReadNotifications);

module.exports = router;
