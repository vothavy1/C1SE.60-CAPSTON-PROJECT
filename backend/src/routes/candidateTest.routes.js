const express = require('express');
const router = express.Router();
const candidateTestController = require('../controllers/candidateTest.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');

// Routes for recruiters/admins
router.post(
  '/assign',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('test_assign'),
  validationMiddleware.validateAssignTest,
  candidateTestController.assignTest
);

// Route for candidates to self-assign (start a test)
router.post(
  '/self-assign',
  authMiddleware.verifyToken,
  candidateTestController.selfAssignTest
);

router.get(
  '/admin',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('test_view'),
  candidateTestController.getAllCandidateTests
);

router.get(
  '/admin/:id',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('test_view'),
  candidateTestController.getCandidateTestById
);

router.put(
  '/:id/review',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('test_review'),
  validationMiddleware.validateReviewTest,
  candidateTestController.reviewCandidateTest
);

// Routes for candidates (no auth required, uses access token)
router.get(
  '/access/:token',
  candidateTestController.getTestByToken
);

router.post(
  '/:id/start',
  authMiddleware.verifyToken,
  candidateTestController.startTest
);

router.post(
  '/:id/answers',
  authMiddleware.verifyToken,
  candidateTestController.submitAnswer
);

router.post(
  '/:id/complete',
  authMiddleware.verifyToken,
  candidateTestController.completeTest
);

router.post(
  '/:id/fraud',
  validationMiddleware.validateFraudEvent,
  candidateTestController.logFraudEvent
);

// Routes for authenticated candidates to view their tests
router.get(
  '/my-tests',
  authMiddleware.verifyToken,
  candidateTestController.getMyCandidateTests
);

// Route to get candidate test by ID (for completion page) - MUST be after specific routes
router.get(
  '/:id/details',
  authMiddleware.verifyToken,
  candidateTestController.getCandidateTestDetails
);

router.get(
  '/:id',
  authMiddleware.verifyToken,
  candidateTestController.getCandidateTestById
);

module.exports = router;
