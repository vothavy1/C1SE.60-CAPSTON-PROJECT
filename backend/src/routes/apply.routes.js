const express = require('express');
const router = express.Router();
const applyController = require('../controllers/apply.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public route - anyone can apply
router.post('/apply', 
  applyController.upload.single('cv'), 
  applyController.applyJob
);

// Protected routes - only Recruiter/Admin can access
router.get('/candidates', 
  authenticate, 
  authorize(['ADMIN', 'RECRUITER']), 
  applyController.getCandidates
);

router.get('/candidates/:id', 
  authenticate, 
  authorize(['ADMIN', 'RECRUITER']), 
  applyController.getCandidateById
);

router.put('/candidates/:id', 
  authenticate, 
  authorize(['ADMIN', 'RECRUITER']), 
  applyController.updateCandidate
);

router.put('/candidates/:id/status', 
  authenticate, 
  authorize(['ADMIN', 'RECRUITER']), 
  applyController.updateCandidateStatus
);

router.get('/candidates/:id/cv', 
  authenticate, 
  authorize(['ADMIN', 'RECRUITER']), 
  applyController.getCandidateCV
);

module.exports = router;
