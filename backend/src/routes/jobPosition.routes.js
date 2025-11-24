const express = require('express');
const router = express.Router();
const jobPositionController = require('../controllers/jobPosition.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public routes - view job positions
router.get('/', jobPositionController.getAllPositions);
router.get('/:id', jobPositionController.getPositionById);

// Protected routes - require authentication
router.use(authenticate);

// Recruiter/Admin only routes
router.post(
  '/',
  authorize(['RECRUITER', 'ADMIN']),
  jobPositionController.createPosition
);

router.put(
  '/:id',
  authorize(['RECRUITER', 'ADMIN']),
  jobPositionController.updatePosition
);

router.delete(
  '/:id',
  authorize(['RECRUITER', 'ADMIN']),
  jobPositionController.deletePosition
);

module.exports = router;
