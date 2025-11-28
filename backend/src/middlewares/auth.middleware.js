const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');
const logger = require('../utils/logger');

// Middleware to authenticate user with JWT
const authenticate = async (req, res, next) => {
  try {
    // Get token from header or query parameter (for file downloads)
    let token = null;
    
    // Try to get from Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If not in header, try query parameter (for CV downloads)
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    // If still no token, return error
    if (!token) {
      return res.status(401).json({ success: false, message: 'Không có token xác thực' });
    }

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

    // IMPORTANT: Always use company_id from database, not from token
    // This ensures we always have the latest company_id even if token is old
    const userRole = user.Role?.role_name?.toUpperCase();
    
    // CRITICAL: Enforce company_id requirement for recruiters
    if (userRole === 'RECRUITER') {
      // Check if user has no company_id in database
      if (!user.company_id) {
        logger.error(`❌ Recruiter ${user.username} (ID: ${user.user_id}) không có company_id!`);
        return res.status(403).json({ 
          success: false, 
          message: 'Tài khoản recruiter chưa được gán vào công ty nào. Vui lòng liên hệ admin để được hỗ trợ.',
          error_code: 'NO_COMPANY'
        });
      }
      
      // CRITICAL: Check if token company_id doesn't match database company_id
      // This prevents user from accessing wrong company data after being reassigned
      if (decoded.company_id && decoded.company_id !== user.company_id) {
        logger.warn(`🚨 SECURITY: User ${user.username} token có company_id=${decoded.company_id} nhưng database có company_id=${user.company_id}. Buộc đăng nhập lại!`);
        return res.status(401).json({ 
          success: false, 
          message: '⚠️ Phát hiện thay đổi công ty trong hệ thống. Vui lòng đăng xuất và đăng nhập lại để cập nhật quyền truy cập.',
          error_code: 'COMPANY_MISMATCH',
          force_logout: true
        });
      }
      
      // Log for security audit
      logger.info(`✅ Auth OK: ${user.username} (Company: ${user.company_id})`);
    }

    // Add user info to request with standardized userId
    req.user = {
      ...user.toJSON(),
      userId: user.user_id,  // Standardize key
      user_id: user.user_id,  // Keep for backward compatibility
      company_id: user.company_id  // Always use company_id from database
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
// Can accept either roles (e.g., ['ADMIN', 'RECRUITER']) or permissions
const authorize = (rolesOrPermissions = [], options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Chưa xác thực' });
      }

      // For admin role, bypass all checks
      if (req.user.Role && req.user.Role.role_name === 'ADMIN') {
        return next();
      }

      const userRole = req.user.Role?.role_name?.toUpperCase();
      
      // If rolesOrPermissions array contains role names (ADMIN, RECRUITER, CANDIDATE, etc.)
      // treat it as roles check
      const commonRoles = ['ADMIN', 'RECRUITER', 'CANDIDATE'];
      const isRoleCheck = rolesOrPermissions.some(item => 
        commonRoles.includes(item.toUpperCase())
      );

      if (isRoleCheck) {
        // Check if user's role is in the allowed roles list
        const allowedRoles = rolesOrPermissions.map(r => r.toUpperCase());
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Không có quyền truy cập chức năng này' 
          });
        }
        return next();
      }

      // Otherwise, treat as permissions check
      // Check allowed roles from options (legacy support)
      if (options.allowedRoles && Array.isArray(options.allowedRoles)) {
        const allowedRoles = options.allowedRoles.map(r => r.toUpperCase());
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ success: false, message: 'Không có quyền truy cập chức năng này' });
        }
      }

      // Get user permissions from loaded relationship
      const userPermissions = req.user.Role?.Permissions?.map(p => p.permission_name) || [];
      // Check if user has any of the required permissions
      const hasPermission = rolesOrPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      if (!hasPermission && rolesOrPermissions.length > 0) {
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
