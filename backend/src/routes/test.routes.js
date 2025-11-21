// ...existing code...
const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// ==========================================
// PUBLIC ROUTES - All authenticated users (including candidates)
// ==========================================
// View all tests
router.get('/', testController.getAllTests);

// View test details
router.get('/:id', testController.getTestById);

// View test questions (for taking test)
router.get('/:id/questions', testController.getTestQuestions);

// ==========================================
// RESTRICTED ROUTES - Only RECRUITER and ADMIN
// ==========================================
// Create new test
router.post(
  '/',
  authorize([], { allowedRoles: ['recruiter', 'admin'] }),
  testController.createTest
);

// Update test
router.put(
  '/:id',
  authorize([], { allowedRoles: ['recruiter', 'admin'] }),
  testController.updateTest
);

// Delete test
router.delete(
  '/:id',
  authorize([], { allowedRoles: ['recruiter', 'admin'] }),
  testController.deleteTest
);

// Add questions to test
router.post(
  '/:id/questions',
  authorize([], { allowedRoles: ['recruiter', 'admin'] }),
  testController.addQuestionsToTest
);

// Remove question from test
router.delete(
  '/:testId/questions/:questionId',
  authorize([], { allowedRoles: ['recruiter', 'admin'] }),
  testController.removeQuestionFromTest
);

module.exports = router;
