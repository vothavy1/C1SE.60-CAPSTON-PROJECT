const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, SystemLog, Company } = require('../models');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Đăng ký tài khoản mới
async function register(req, res) {
  try {
    const { username, email, password, full_name, role_id, company_id } = req.body;
    let finalRoleId = role_id;
    if (finalRoleId === undefined || finalRoleId === null || finalRoleId === "") {
      finalRoleId = 4;
    } else {
      finalRoleId = parseInt(finalRoleId, 10);
    }
    if (![2, 4].includes(finalRoleId)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò không hợp lệ. Chỉ chấp nhận Recruiter hoặc Candidate.'
      });
    }
    
    // Validate company_id for recruiters
    if (finalRoleId === 2 && !company_id) {
      return res.status(400).json({
        success: false,
        message: 'Nhà tuyển dụng phải chọn công ty'
      });
    }
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [{ username }, { email }]
      }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại'
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      email,
      password_hash: hashedPassword,
      full_name,
      role_id: finalRoleId,
      company_id: finalRoleId === 2 ? company_id : null, // Only set company for recruiters
      is_active: true
    });
    await SystemLog.create({
      user_id: newUser.user_id,
      action: 'REGISTER',
      description: 'New account registered',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
    return res.status(201).json({
      success: true,
      message: `Đăng ký tài khoản thành công với vai trò ${finalRoleId === 2 ? 'Recruiter' : 'Candidate'}`,
      user: {
        userId: newUser.user_id,  // Chuẩn hóa key thành userId
        username: newUser.username,
        email: newUser.email,
        role_id: newUser.role_id
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.' });
  }
}

// Đăng nhập
async function login(req, res) {
  try {
    const { email, username, password } = req.body;
    // Cho phép đăng nhập bằng username hoặc email
    const user = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          username ? { username } : {},
          email ? { email } : {}
        ]
      },
      include: [{ model: Role }]
    });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
    }
    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.Role?.role_name, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    user.last_login = new Date();
    await user.save();
    await SystemLog.create({
      user_id: user.user_id,
      action: 'LOGIN',
      description: 'User logged in',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
    return res.status(200).json({
      success: true,
      data: {
        user: {
          userId: user.user_id,  // Chuẩn hóa key thành userId
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.Role?.role_name,
          company_id: user.company_id
        },
        token
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng nhập' });
  }
}

// Đổi mật khẩu
async function changePassword(req, res) {
  try {
    const { email, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu cũ không đúng' });
    }
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();
    await SystemLog.create({
      user_id: user.user_id,
      action: 'CHANGE_PASSWORD',
      description: 'User changed password',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
    return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đổi mật khẩu' });
  }
}

// Lấy thông tin profile người dùng
async function getProfile(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    return res.status(200).json({
      success: true,
      data: {
        userId: user.user_id,  // Chuẩn hóa key thành userId
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.Role?.role_name
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy thông tin người dùng' });
  }
}

// Đăng xuất
async function logout(req, res) {
  try {
    if (req.user) {
      await SystemLog.create({
        user_id: req.user.user_id,
        action: 'LOGOUT',
        description: 'User logged out',
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi đăng xuất' });
  }
}

module.exports = {
  register,
  login,
  changePassword,
  getProfile,
  logout
};
