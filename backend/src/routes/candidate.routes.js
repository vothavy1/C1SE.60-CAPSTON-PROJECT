const express = require('express');
const router = express.Router();
const candidateController = require('../controllers/candidate.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for CV/Resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/cv');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Create a new candidate (admin/recruiter) with optional resume upload
router.post(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  upload.single('resume'), // Handle single file upload with field name 'resume'
  candidateController.createCandidate
);

// Self-create candidate profile (for authenticated users without permission check)
router.post(
  '/self-register',
  authMiddleware.verifyToken,
  candidateController.createCandidate
);

// Get all candidates with filtering options
router.get(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  candidateController.getAllCandidates
);

// Get candidate by user ID
router.get(
  '/by-user/:userId',
  authMiddleware.verifyToken,
  candidateController.getCandidateByUserId
);

// Get candidate by ID
router.get(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  candidateController.getCandidateById
);

// Update candidate
router.put(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  validationMiddleware.validateUpdateCandidate,
  candidateController.updateCandidate
);

// Delete candidate
router.delete(
  '/:id',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  candidateController.deleteCandidate
);

// Upload candidate resume
router.post(
  '/:id/resume',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  upload.single('resume'),
  candidateController.uploadResume
);

// Set primary resume
router.put(
  '/:candidateId/resume/:resumeId/set-primary',
  authMiddleware.verifyToken,
  authMiddleware.authorize([], { allowedRoles: ['ADMIN', 'RECRUITER'] }),
  candidateController.setPrimaryResume
);

module.exports = router;
