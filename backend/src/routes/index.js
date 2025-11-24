const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const questionRoutes = require('./question.routes');
const testRoutes = require('./test.routes');
const candidateRoutes = require('./candidate.routes');
const jobRoutes = require('./job.routes');
const interviewRoutes = require('./interview.routes');
const candidateTestRoutes = require('./candidateTest.routes');
const reportRoutes = require('./report.routes');
const applyRoutes = require('./apply.routes');
const companyRoutes = require('./company.routes');
const jobPositionRoutes = require('./jobPosition.routes');
const applicationRoutes = require('./application.routes');

// Use route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/questions', questionRoutes);
router.use('/tests', testRoutes);
router.use('/candidates', candidateRoutes);
router.use('/companies', companyRoutes);
router.use('/jobs', jobRoutes);
router.use('/job-positions', jobPositionRoutes);
router.use('/applications', applicationRoutes);
router.use('/interviews', interviewRoutes);
router.use('/candidate-tests', candidateTestRoutes);
router.use('/reports', reportRoutes);
router.use('/apply', applyRoutes); // Apply routes: /api/apply/apply, /api/apply/candidates

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

module.exports = router;
