const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * Admin Dashboard Controller
 */
const adminController = {
  /**
   * Get dashboard statistics
   * Returns counts of recruiters, candidates, and tests
   */
  getDashboardStats: async (req, res) => {
    try {
      // Query to count companies
      const [companyResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM companies
      `);
      const companies = companyResult[0].count;

      // Query to count candidates (role_name = 'CANDIDATE')
      const [candidateResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM users u
        INNER JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'CANDIDATE'
      `);
      const candidates = candidateResult[0].count;

      // Query to count total tests
      const [testResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM tests
      `);
      const tests = testResult[0].count;

      // Query to count CVs (candidate resumes)
      const [cvResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM candidate_resumes
      `);
      const cvs = cvResult[0].count;

      return res.status(200).json({
        success: true,
        data: {
          companies,
          candidates,
          tests,
          cvs
        }
      });

    } catch (error) {
      logger.error(`Get dashboard stats error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard statistics'
      });
    }
  },

  /**
   * Get all users with role and company information
   * Returns user details with LEFT JOINs to roles and companies tables
   */
  getAllUsers: async (req, res) => {
    try {
      const [users] = await sequelize.query(`
        SELECT 
          u.user_id,
          u.username,
          u.email,
          u.is_active,
          u.created_at,
          r.role_name,
          c.companyName as company_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN companies c ON u.company_id = c.company_id
        ORDER BY u.created_at DESC
      `);

      return res.status(200).json({
        success: true,
        data: users
      });

    } catch (error) {
      logger.error(`Get all users error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users list'
      });
    }
  },

  /**
   * Delete user by ID
   * Admin can delete any user except themselves
   */
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const adminUserId = req.user.user_id;

      // Prevent admin from deleting themselves
      if (parseInt(userId) === parseInt(adminUserId)) {
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      // Check if user exists
      const [users] = await sequelize.query(`
        SELECT user_id, username, email 
        FROM users 
        WHERE user_id = ?
      `, {
        replacements: [userId]
      });

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete the user
      await sequelize.query(`
        DELETE FROM users 
        WHERE user_id = ?
      `, {
        replacements: [userId]
      });

      logger.info(`Admin ${adminUserId} deleted user ${userId} (${users[0].username})`);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      logger.error(`Delete user error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  },

  /**
   * Get user by ID with detailed information
   */
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id;

      const [users] = await sequelize.query(`
        SELECT 
          u.user_id,
          u.username,
          u.email,
          u.is_active,
          u.created_at,
          u.updated_at,
          u.role_id,
          r.role_name,
          u.company_id,
          c.companyName as company_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN companies c ON u.company_id = c.company_id
        WHERE u.user_id = ?
      `, {
        replacements: [userId]
      });

      if (!users || users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: users[0]
      });

    } catch (error) {
      logger.error(`Get user by ID error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user details'
      });
    }
  },

  /**
   * Update user information
   */
  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const { username, email, role_id, company_id, is_active } = req.body;

      // Check if user exists
      const [existingUsers] = await sequelize.query(`
        SELECT user_id FROM users WHERE user_id = ?
      `, {
        replacements: [userId]
      });

      if (!existingUsers || existingUsers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email already exists for another user
      if (email) {
        const [emailCheck] = await sequelize.query(`
          SELECT user_id FROM users WHERE email = ? AND user_id != ?
        `, {
          replacements: [email, userId]
        });

        if (emailCheck && emailCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Email already exists'
          });
        }
      }

      // Build update query dynamically
      let updateFields = [];
      let replacements = [];

      if (username !== undefined) {
        updateFields.push('username = ?');
        replacements.push(username);
      }
      if (email !== undefined) {
        updateFields.push('email = ?');
        replacements.push(email);
      }
      if (role_id !== undefined) {
        updateFields.push('role_id = ?');
        replacements.push(role_id);
      }
      if (company_id !== undefined) {
        updateFields.push('company_id = ?');
        replacements.push(company_id);
      }
      if (is_active !== undefined) {
        updateFields.push('is_active = ?');
        replacements.push(is_active);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }

      updateFields.push('updated_at = NOW()');
      replacements.push(userId);

      await sequelize.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE user_id = ?
      `, {
        replacements: replacements
      });

      logger.info(`Admin ${req.user.user_id} updated user ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'User updated successfully'
      });

    } catch (error) {
      logger.error(`Update user error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  },

  /**
   * Create new user
   */
  createUser: async (req, res) => {
    try {
      const { username, email, password, role_id, company_id, is_active } = req.body;

      // Validate required fields
      if (!username || !email || !password || !role_id) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, password and role are required'
        });
      }

      // Check if email already exists
      const [existingUsers] = await sequelize.query(`
        SELECT user_id FROM users WHERE email = ?
      `, {
        replacements: [email]
      });

      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const password_hash = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await sequelize.query(`
        INSERT INTO users (username, email, password_hash, role_id, company_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          username,
          email,
          password_hash,
          role_id,
          company_id || null,
          is_active !== undefined ? is_active : 1
        ]
      });

      logger.info(`Admin ${req.user.user_id} created new user: ${username} (${email})`);

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user_id: result.insertId
        }
      });

    } catch (error) {
      logger.error(`Create user error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }
  },

  /**
   * Get all roles
   */
  getRoles: async (req, res) => {
    try {
      const [roles] = await sequelize.query(`
        SELECT role_id, role_name 
        FROM roles 
        ORDER BY role_id
      `);

      return res.status(200).json({
        success: true,
        data: roles
      });

    } catch (error) {
      logger.error(`Get roles error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve roles'
      });
    }
  },

  /**
   * Get all companies
   */
  getCompanies: async (req, res) => {
    try {
      const [companies] = await sequelize.query(`
        SELECT company_id, companyName 
        FROM companies 
        ORDER BY companyName
      `);

      return res.status(200).json({
        success: true,
        data: companies
      });

    } catch (error) {
      logger.error(`Get companies error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve companies'
      });
    }
  }
};

module.exports = adminController;