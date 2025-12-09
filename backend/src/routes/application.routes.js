const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Candidate routes
router.post('/apply', authorize(['CANDIDATE']), applicationController.applyForJob);
router.get('/my-applications', authorize(['CANDIDATE']), applicationController.getMyApplications);
router.delete('/:id/cancel', authorize(['CANDIDATE']), applicationController.cancelApplication);

// Recruiter/Admin routes
router.get('/', authorize(['RECRUITER', 'ADMIN']), applicationController.getAllApplications);
router.put('/:id/status', authorize(['RECRUITER', 'ADMIN']), applicationController.updateApplicationStatus);

module.exports = router;
