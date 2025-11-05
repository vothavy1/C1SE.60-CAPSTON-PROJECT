const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const reportController = require('../controllers/report.controller');

// Health check endpoint for reports
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Reports API is running' });
});

// ===== 1. VIOLATION REPORTS =====
// Report a violation (authenticated users)
router.post(
  '/violation',
  authMiddleware.verifyToken,
  reportController.reportViolation
);

// Get all violations (admin only)
router.get(
  '/violations',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.getViolations
);

// Get violation by ID (admin only)
router.get(
  '/violations/:logId',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.getViolationById
);

// Get violations by candidate test (admin/recruiter)
router.get(
  '/violations/test/:candidateTestId',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.getViolationsByTest
);

// Get violation statistics (admin only)
router.get(
  '/violations-stats',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.getViolationStatistics
);

// ===== 2. STATISTICS REPORTS =====
// Get test statistics (admin only)
router.get(
  '/statistics',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.getStatistics
);

// ===== 3. ACTIVITY LOGS =====
// Log activity (authenticated users - can be called from frontend)
router.post(
  '/activity',
  authMiddleware.verifyToken,
  reportController.logActivity
);

// Get activity logs (admin only)
router.get(
  '/activity',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.getActivityLogs
);

// ===== 4. CANDIDATE NOTIFICATIONS =====
// Send notification to candidate (admin only)
router.post(
  '/notify-candidate',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('REPORTING'),
  reportController.notifyCandidate
);

// Get notifications for current user (candidate)
router.get(
  '/notifications',
  authMiddleware.verifyToken,
  reportController.getNotifications
);

module.exports = router;
