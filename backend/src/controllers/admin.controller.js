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

      // Query to count candidates (from candidates table)
      const [candidateResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM candidates
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

      // Query to count recruiters (role_name = 'RECRUITER')
      const [recruiterResult] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM users u
        INNER JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'RECRUITER'
      `);
      const recruiters = recruiterResult[0].count;

      return res.status(200).json({
        success: true,
        data: {
          companies,
          candidates,
          tests,
          cvs,
          recruiters
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

      console.log('🗑️ Delete user request:', { userId, adminUserId });
      
      // Prevent admin from deleting themselves
      if (parseInt(userId) === parseInt(adminUserId)) {
        console.log('❌ Admin trying to delete themselves');
        return res.status(400).json({
          success: false,
          message: 'You cannot delete your own account'
        });
      }

      // Check if user exists
      console.log('🔍 Checking if user exists:', userId);
      const [users] = await sequelize.query(`
        SELECT user_id, username, email 
        FROM users 
        WHERE user_id = ?
      `, {
        replacements: [userId]
      });

      console.log('📋 Query result:', users);

      if (!users || users.length === 0) {
        console.log('❌ User not found in database');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('✅ User found, attempting to delete:', users[0]);

      // Delete the user (cascade will handle related records)
      console.log('🗑️ Deleting user...');
      const [deleteResult] = await sequelize.query(`
        DELETE FROM users 
        WHERE user_id = ?
      `, {
        replacements: [userId]
      });

      console.log('✅ Delete result:', deleteResult);
      logger.info(`Admin ${adminUserId} deleted user ${userId} (${users[0].username})`);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete user error:', error);
      logger.error(`Delete user error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
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
  },

  /**
   * Get all candidates from ALL companies (Admin only)
   * Returns candidates with company information
   */
  getAllCandidates: async (req, res) => {
    try {
      const [candidates] = await sequelize.query(`
        SELECT 
          c.candidate_id,
          c.user_id,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          c.current_position,
          c.years_of_experience,
          c.education,
          c.skills,
          c.source,
          c.status,
          c.notes,
          c.created_at,
          c.updated_at,
          c.company_id,
          comp.companyName as company_name,
          u.username
        FROM candidates c
        LEFT JOIN companies comp ON c.company_id = comp.company_id
        LEFT JOIN users u ON c.user_id = u.user_id
        ORDER BY c.created_at DESC
      `);

      return res.status(200).json({
        success: true,
        data: candidates,
        message: 'All candidates retrieved successfully'
      });

    } catch (error) {
      logger.error(`Get all candidates error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve candidates'
      });
    }
  },

  /**
   * Get registration statistics by time period
   * Supports both weekly and daily (monthly) views
   */
  getRegistrationStats: async (req, res) => {
    try {
      const { period, month, year } = req.query;
      const now = new Date();
      
      let recruitersData = [];
      let candidatesData = [];
      let labels = [];

      // REAL DATA ONLY: Daily view for specific month with zero-filling
      if (period === 'daily' && month && year) {
        const targetMonth = parseInt(month);
        const targetYear = parseInt(year);
        
        console.log(`📊 Fetching REAL daily data for ${targetMonth}/${targetYear}`);
        
        // Step A: Calculate total days in the requested month/year
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        console.log(`📅 Days in month ${targetMonth}/${targetYear}: ${daysInMonth}`);
        
        // Step B: Initialize arrays with zeros for each day
        recruitersData = new Array(daysInMonth).fill(0);
        candidatesData = new Array(daysInMonth).fill(0);
        labels = Array.from({length: daysInMonth}, (_, i) => (i + 1).toString());
        console.log('🔢 Initialized zero arrays for', daysInMonth, 'days');

        // Get date range for the month
        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        console.log(`📆 Date range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

        // Step C: Query database for selected month/year, grouped by DAY
        console.log('🔍 Querying recruiters from database...');
        const [recruitersByDay] = await sequelize.query(`
          SELECT 
            DAY(created_at) as day,
            COUNT(*) as count 
          FROM users u
          JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_name = 'RECRUITER' 
          AND created_at >= :monthStart 
          AND created_at <= :monthEnd
          GROUP BY DAY(created_at)
          ORDER BY DAY(created_at)
        `, {
          replacements: { 
            monthStart: monthStart.toISOString(), 
            monthEnd: monthEnd.toISOString() 
          }
        });

        console.log('🔍 Querying candidates from database...');
        const [candidatesByDay] = await sequelize.query(`
          SELECT 
            DAY(created_at) as day,
            COUNT(*) as count 
          FROM candidates 
          WHERE created_at >= :monthStart 
          AND created_at <= :monthEnd
          GROUP BY DAY(created_at)
          ORDER BY DAY(created_at)
        `, {
          replacements: { 
            monthStart: monthStart.toISOString(), 
            monthEnd: monthEnd.toISOString() 
          }
        });

        console.log('📋 Database results:');
        console.log('  - Recruiters query returned:', recruitersByDay.length, 'days with data');
        console.log('  - Candidates query returned:', candidatesByDay.length, 'days with data');

        // Step D: Map database results into the arrays
        // If DB shows "Day 5 has 2 users", update index 4 of the array to 2
        recruitersByDay.forEach(row => {
          if (row.day >= 1 && row.day <= daysInMonth) {
            recruitersData[row.day - 1] = row.count;
            console.log(`  ✓ Day ${row.day}: ${row.count} recruiters`);
          }
        });

        candidatesByDay.forEach(row => {
          if (row.day >= 1 && row.day <= daysInMonth) {
            candidatesData[row.day - 1] = row.count;
            console.log(`  ✓ Day ${row.day}: ${row.count} candidates`);
          }
        });

        console.log('📊 Final data arrays:');
        console.log('  - Labels:', labels.slice(0, 5), '...', labels.slice(-2));
        console.log('  - Recruiters total:', recruitersData.reduce((a, b) => a + b, 0));
        console.log('  - Candidates total:', candidatesData.reduce((a, b) => a + b, 0));

        return res.json({
          success: true,
          data: {
            recruiters: recruitersData,
            candidates: candidatesData,
            labels: labels,
            period: 'daily',
            month: targetMonth,
            year: targetYear,
            daysInMonth: daysInMonth,
            realDataOnly: true
          },
          message: `Real daily registration data for ${targetMonth}/${targetYear} (${recruitersData.reduce((a, b) => a + b, 0)} recruiters, ${candidatesData.reduce((a, b) => a + b, 0)} candidates)`
        });
      }

      // EXISTING: Weekly views
      if (period === 'current-week') {
        // Get current week (Monday to Sunday)
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        monday.setHours(0, 0, 0, 0);

        // Get data for each day of current week
        for (let i = 0; i < 7; i++) {
          const dayStart = new Date(monday);
          dayStart.setDate(monday.getDate() + i);
          dayStart.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          // Count recruiters registered on this day
          const [recruiterResult] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE r.role_name = 'RECRUITER' 
            AND u.created_at >= :dayStart 
            AND u.created_at <= :dayEnd
          `, {
            replacements: { dayStart: dayStart.toISOString(), dayEnd: dayEnd.toISOString() }
          });

          // Count candidates registered on this day
          const [candidateResult] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM candidates 
            WHERE created_at >= :dayStart 
            AND created_at <= :dayEnd
          `, {
            replacements: { dayStart: dayStart.toISOString(), dayEnd: dayEnd.toISOString() }
          });

          recruitersData.push(recruiterResult[0].count);
          candidatesData.push(candidateResult[0].count);
        }
      } else if (period === 'last-week') {
        // Get last week (Monday to Sunday)
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1 - 7); // Go back 7 days
        monday.setHours(0, 0, 0, 0);

        // Get data for each day of last week
        for (let i = 0; i < 7; i++) {
          const dayStart = new Date(monday);
          dayStart.setDate(monday.getDate() + i);
          dayStart.setHours(0, 0, 0, 0);
          
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          // Count recruiters registered on this day
          const [recruiterResult] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE r.role_name = 'RECRUITER' 
            AND u.created_at >= :dayStart 
            AND u.created_at <= :dayEnd
          `, {
            replacements: { dayStart: dayStart.toISOString(), dayEnd: dayEnd.toISOString() }
          });

          // Count candidates registered on this day
          const [candidateResult] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM candidates 
            WHERE created_at >= :dayStart 
            AND created_at <= :dayEnd
          `, {
            replacements: { dayStart: dayStart.toISOString(), dayEnd: dayEnd.toISOString() }
          });

          recruitersData.push(recruiterResult[0].count);
          candidatesData.push(candidateResult[0].count);
        }
      } else if (period.startsWith('month-')) {
        // Get specific month data by weeks
        const monthNum = parseInt(period.split('-')[1]);
        const year = 2025;
        const firstDay = new Date(year, monthNum - 1, 1);
        const lastDay = new Date(year, monthNum, 0);
        
        // Divide month into weeks
        const weeks = Math.ceil(lastDay.getDate() / 7);
        
        for (let week = 0; week < weeks; week++) {
          const weekStart = new Date(year, monthNum - 1, week * 7 + 1);
          const weekEnd = new Date(year, monthNum - 1, Math.min((week + 1) * 7, lastDay.getDate()));
          weekEnd.setHours(23, 59, 59, 999);

          // Count recruiters registered in this week
          const [recruiterResult] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE r.role_name = 'RECRUITER' 
            AND u.created_at >= :weekStart 
            AND u.created_at <= :weekEnd
          `, {
            replacements: { weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() }
          });

          // Count candidates registered in this week
          const [candidateResult] = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM candidates 
            WHERE created_at >= :weekStart 
            AND created_at <= :weekEnd
          `, {
            replacements: { weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString() }
          });

          recruitersData.push(recruiterResult[0].count);
          candidatesData.push(candidateResult[0].count);
        }
      }

      res.json({
        success: true,
        data: {
          recruiters: recruitersData,
          candidates: candidatesData,
          period: period,
          currentDate: now.toISOString()
        }
      });

    } catch (error) {
      logger.error('Error fetching registration stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registration statistics',
        error: error.message
      });
    }
  },

  /**
   * Get daily registration statistics for a specific month/year
   */
  getDailyRegistrations: async (req, res) => {
    try {
      const { month, year } = req.query;
      const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
      const targetYear = year ? parseInt(year) : new Date().getFullYear();

      // Get number of days in the month
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const dailyData = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`;
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')} 23:59:59`;

        // Count candidates registered on this day
        const [candidateResult] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM candidates 
          WHERE created_at BETWEEN :startDate AND :endDate
        `, {
          replacements: { startDate, endDate }
        });

        // Count recruiters registered on this day  
        const [recruiterResult] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM users u
          INNER JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_name = 'RECRUITER' 
          AND u.created_at BETWEEN :startDate AND :endDate
        `, {
          replacements: { startDate, endDate }
        });

        dailyData.push({
          day: day,
          date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          candidates: candidateResult[0].count,
          recruiters: recruiterResult[0].count,
          total: candidateResult[0].count + recruiterResult[0].count
        });
      }

      res.json({
        success: true,
        data: dailyData,
        meta: {
          month: targetMonth,
          year: targetYear,
          totalDays: daysInMonth
        }
      });

    } catch (error) {
      logger.error('Error fetching daily registration stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily registration statistics',
        error: error.message
      });
    }
  }
};

module.exports = adminController;