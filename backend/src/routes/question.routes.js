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
router.get('/', authorize(['QUESTION_MANAGEMENT'], { allowedRoles: ['recruiter', 'admin'] }), questionController.getAllQuestions);

// Get question by ID
router.get('/:id', authorize(['QUESTION_MANAGEMENT'], { allowedRoles: ['recruiter', 'admin'] }), questionController.getQuestionById);

// Create new question
router.post('/', authorize(['QUESTION_MANAGEMENT'], { allowedRoles: ['recruiter', 'admin'] }), createQuestionValidation, questionController.createQuestion);

// Update question
router.put('/:id', authorize(['QUESTION_MANAGEMENT'], { allowedRoles: ['recruiter', 'admin'] }), questionController.updateQuestion);

// Delete question
router.delete('/:id', authorize(['QUESTION_MANAGEMENT'], { allowedRoles: ['recruiter', 'admin'] }), questionController.deleteQuestion);

// Category routes
router.get('/categories/all', authorize(['QUESTION_MANAGEMENT']), questionController.getAllCategories);
router.post('/categories', authorize(['QUESTION_MANAGEMENT']), questionController.createCategory);
router.put('/categories/:id', authorize(['QUESTION_MANAGEMENT']), questionController.updateCategory);
router.delete('/categories/:id', authorize(['QUESTION_MANAGEMENT']), questionController.deleteCategory);

module.exports = router;
