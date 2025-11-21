const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public route - get all companies (for register form)
router.get('/', companyController.getAllCompanies);

// Get company by ID
router.get('/:id', authenticate, companyController.getCompanyById);

// Create company (Admin only)
router.post('/', authenticate, companyController.createCompany);

module.exports = router;
