const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const logger = require('../utils/logger');

// Middleware to authenticate user with JWT
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Không có token xác thực' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        include: [Permission]
      }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    // Add user info to request with standardized userId
    req.user = {
      ...user.toJSON(),
      userId: user.user_id,  // Standardize key
      user_id: user.user_id  // Keep for backward compatibility
    };
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token đã hết hạn' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }
    
    return res.status(500).json({ success: false, message: 'Lỗi xác thực' });
  }
};

// Middleware to check for required permissions and allowed roles
const authorize = (requiredPermissions = [], options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Chưa xác thực' });
      }

      // For admin role, bypass permission check
      if (req.user.Role && req.user.Role.role_name === 'ADMIN') {
        return next();
      }

      // Check allowed roles if provided
      if (options.allowedRoles && Array.isArray(options.allowedRoles)) {
        const userRole = req.user.Role.role_name?.toUpperCase();
        const allowedRoles = options.allowedRoles.map(r => r.toUpperCase());
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ success: false, message: 'Không có quyền truy cập chức năng này' });
        }
      }

      // Get user permissions from loaded relationship
      const userPermissions = req.user.Role.Permissions.map(p => p.permission_name);
      // Check if user has any of the required permissions
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      if (!hasPermission && requiredPermissions.length > 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Không có quyền truy cập chức năng này' 
        });
      }
      next();
    } catch (error) {
      logger.error(`Authorization error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Lỗi phân quyền' });
    }
  };
};

// Alias for backward compatibility
const verifyToken = authenticate;
const hasPermission = (permission) => authorize([permission]);

module.exports = {
  authenticate,
  authorize,
  verifyToken,
  hasPermission
};
