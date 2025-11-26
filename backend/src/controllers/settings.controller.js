const { User, SystemLog, sequelize } = require('../models');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Settings Controller - Admin Personal Settings & Activity Logs
 */

// Get current admin profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.userId;
    
    console.log(`👤 Fetching profile for user ${userId}`);
    
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'username', 'email', 'full_name', 'is_active', 'last_login', 'created_at', 'updated_at']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    logger.error(`Error fetching profile: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update admin profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.userId;
    const { full_name, email } = req.body;
    
    console.log(`✏️ Updating profile for user ${userId}`);
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          user_id: { [Op.ne]: userId }
        }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Update fields
    if (full_name) user.full_name = full_name;
    if (email) user.email = email;
    
    await user.save();
    
    // Log activity
    await SystemLog.create({
      user_id: userId,
      action: 'UPDATE_PROFILE',
      description: `Admin updated profile information`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });
    
    console.log(`✅ Profile updated for user ${userId}`);
    logger.info(`Profile updated: user ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        updated_at: user.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    logger.error(`Error updating profile: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.userId;
    const { current_password, new_password } = req.body;
    
    console.log(`🔒 Password change request for user ${userId}`);
    
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(new_password, salt);
    await user.save();
    
    // Log activity
    await SystemLog.create({
      user_id: userId,
      action: 'CHANGE_PASSWORD',
      description: `Admin changed password`,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers['user-agent']
    });
    
    console.log(`✅ Password changed for user ${userId}`);
    logger.info(`Password changed: user ${userId}`);
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error changing password:', error);
    logger.error(`Error changing password: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Get activity logs (login/logout history)
exports.getActivityLogs = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.userId;
    const { limit = 50, offset = 0, action } = req.query;
    
    console.log(`📋 Fetching activity logs for user ${userId}`);
    
    const whereClause = { user_id: userId };
    
    if (action) {
      whereClause.action = action;
    }
    
    const logs = await SystemLog.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: ['log_id', 'action', 'description', 'ip_address', 'user_agent', 'created_at']
    });
    
    const totalCount = await SystemLog.count({
      where: whereClause
    });
    
    console.log(`✅ Found ${logs.length} activity logs`);
    
    return res.status(200).json({
      success: true,
      count: logs.length,
      total: totalCount,
      data: logs
    });
    
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    logger.error(`Error fetching activity logs: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get all users' login activity (Admin only - see who logged in/out)
exports.getAllUsersActivity = async (req, res) => {
  try {
    const { limit = 100, offset = 0, action, user_id } = req.query;
    
    console.log(`📊 Fetching all users activity logs`);
    
    const whereClause = {};
    
    if (action) {
      whereClause.action = action;
    }
    
    if (user_id) {
      whereClause.user_id = user_id;
    }
    
    const logs = await SystemLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['user_id', 'username', 'full_name', 'email'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalCount = await SystemLog.count({
      where: whereClause
    });
    
    // Group by action type for statistics
    const actionStats = await SystemLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('log_id')), 'count']
      ],
      where: whereClause,
      group: ['action'],
      raw: true
    });
    
    console.log(`✅ Found ${logs.length} activity logs from all users`);
    
    return res.status(200).json({
      success: true,
      count: logs.length,
      total: totalCount,
      statistics: actionStats,
      data: logs
    });
    
  } catch (error) {
    console.error('❌ Error fetching all users activity:', error);
    logger.error(`Error fetching all users activity: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get login statistics
exports.getLoginStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    console.log(`📈 Fetching login statistics for last ${days} days`);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Count logins by date
    const loginsByDate = await SystemLog.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('log_id')), 'count']
      ],
      where: {
        action: 'LOGIN',
        created_at: {
          [Op.gte]: startDate
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });
    
    // Total unique users logged in
    const uniqueUsers = await SystemLog.count({
      distinct: true,
      col: 'user_id',
      where: {
        action: 'LOGIN',
        created_at: {
          [Op.gte]: startDate
        }
      }
    });
    
    // Most active users
    const activeUsers = await SystemLog.findAll({
      attributes: [
        'user_id',
        [sequelize.fn('COUNT', sequelize.col('log_id')), 'activity_count']
      ],
      where: {
        created_at: {
          [Op.gte]: startDate
        }
      },
      include: [
        {
          model: User,
          attributes: ['username', 'full_name'],
          required: false
        }
      ],
      group: ['user_id'],
      order: [[sequelize.fn('COUNT', sequelize.col('log_id')), 'DESC']],
      limit: 10,
      raw: false
    });
    
    console.log(`✅ Login statistics calculated`);
    
    return res.status(200).json({
      success: true,
      data: {
        period_days: parseInt(days),
        logins_by_date: loginsByDate,
        unique_users: uniqueUsers,
        most_active_users: activeUsers
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching login stats:', error);
    logger.error(`Error fetching login stats: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch login statistics',
      error: error.message
    });
  }
};

module.exports = exports;
