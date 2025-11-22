const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createQuestionValidation } = require('../middlewares/validation.middleware');

// All routes require authentication
router.use(authenticate);

// ==========================================
// RESTRICTED ROUTES - Only RECRUITER and ADMIN
// ==========================================
// Get all questions
router.get('/', authorize(['RECRUITER', 'ADMIN']), questionController.getAllQuestions);

// Get question by ID
router.get('/:id', authorize(['RECRUITER', 'ADMIN']), questionController.getQuestionById);

// Create new question
router.post('/', authorize(['RECRUITER', 'ADMIN']), createQuestionValidation, questionController.createQuestion);

// Update question
router.put('/:id', authorize(['RECRUITER', 'ADMIN']), questionController.updateQuestion);

// Delete question
router.delete('/:id', authorize(['RECRUITER', 'ADMIN']), questionController.deleteQuestion);

// Category routes - GET doesn't need special permission, just auth
router.get('/categories/all', questionController.getAllCategories);
router.post('/categories', authorize(['RECRUITER', 'ADMIN']), questionController.createCategory);
router.put('/categories/:id', authorize(['RECRUITER', 'ADMIN']), questionController.updateCategory);
router.delete('/categories/:id', authorize(['RECRUITER', 'ADMIN']), questionController.deleteCategory);

module.exports = router;
