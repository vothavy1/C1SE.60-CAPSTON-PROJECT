const express = require('express');
const router = express.Router();
const jobPositionController = require('../controllers/jobPosition.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public routes - view job positions
router.get('/', jobPositionController.getAllPositions);
router.get('/:id', jobPositionController.getPositionById);

// Public route - anyone can create job posting
router.post('/', jobPositionController.createPosition);

// Public route - anyone can update job posting
router.put('/:id', jobPositionController.updatePosition);

// Protected routes - require authentication
router.use(authenticate);

// Recruiter/Admin only routes

router.delete(
  '/:id',
  authorize(['RECRUITER', 'ADMIN']),
  jobPositionController.deletePosition
);

module.exports = router;
