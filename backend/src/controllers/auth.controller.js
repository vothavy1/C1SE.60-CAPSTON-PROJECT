const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role, SystemLog, Company, AdminNotification } = require('../models');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const { createNotification } = require('./notification.controller');

// Đăng ký tài khoản mới
async function register(req, res) {
  try {
    const { username, email, password, full_name, role_id, company_id, other_company_name } = req.body;
    console.log('=== REGISTER REQUEST ===');
    console.log('Body:', { username, email, full_name, role_id, company_id, other_company_name });
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
    
    // Validate company_id for recruiters (nếu không có company_id thì phải có other_company_name)
    if (finalRoleId === 2) {
      // Kiểm tra xem có company_id HOẶC other_company_name không
      const hasCompanyId = company_id && company_id !== '' && company_id !== 'null' && company_id !== 'undefined';
      const hasOtherCompanyName = other_company_name && other_company_name.trim() !== '';
      
      console.log('Validation:', { hasCompanyId, hasOtherCompanyName, company_id, other_company_name });
      
      if (!hasCompanyId && !hasOtherCompanyName) {
        console.log('❌ VALIDATION FAILED: No company_id and no other_company_name');
        return res.status(400).json({
          success: false,
          message: 'Nhà tuyển dụng phải chọn công ty hoặc nhập tên công ty mới'
        });
      }
      console.log('✅ VALIDATION PASSED');
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

    // ===== TẠO THÔNG BÁO CHO ADMIN =====
    // Nếu là RECRUITER không có company
    if (finalRoleId === 2 && !company_id) {
      if (other_company_name) {
        // Recruiter yêu cầu thêm công ty mới
        await createNotification(
          'RECRUITER_REQUEST_NEW_COMPANY',
          '🏢 Yêu cầu thêm công ty mới',
          `Recruiter "${username}" (${email}) đã đăng ký và yêu cầu thêm công ty "${other_company_name}" vào hệ thống. Vui lòng thêm công ty và gán cho recruiter này.`,
          newUser.user_id,
          {
            username: newUser.username,
            email: newUser.email,
            requested_company_name: other_company_name,
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
            registered_at: new Date()
          },
          'HIGH'
        );
      } else {
        // Recruiter không có company (trường hợp cũ)
        await createNotification(
          'RECRUITER_NO_COMPANY',
          '⚠️ Recruiter chưa có công ty',
          `Recruiter "${username}" (${email}) đã đăng ký nhưng chưa được gán công ty. Vui lòng gán công ty để recruiter có thể hoạt động.`,
          newUser.user_id,
          {
            username: newUser.username,
            email: newUser.email,
            ip_address: req.ip,
            user_agent: req.get('user-agent'),
            registered_at: new Date()
          },
          'MEDIUM'
        );
      }
    }

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

    // ===== KIỂM TRA RECRUITER CHƯA CÓ COMPANY =====
    if (user.Role?.role_name === 'RECRUITER' && !user.company_id) {
      // Tạo thông báo cho admin
      await createNotification(
        'RECRUITER_NO_COMPANY',
        '⚠️ Recruiter chưa có công ty đăng nhập',
        `Recruiter "${user.username}" (${user.email}) đã đăng nhập nhưng chưa được gán công ty. Vui lòng gán công ty ngay để recruiter có thể làm việc.`,
        user.user_id,
        {
          username: user.username,
          email: user.email,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          login_at: new Date()
        },
        'HIGH'
      );

      // Vẫn cho phép đăng nhập nhưng hiển thị cảnh báo
      return res.status(200).json({
        success: true,
        warning: true,
        message: '⚠️ Tài khoản của bạn chưa được gán công ty. Một số chức năng có thể bị hạn chế. Vui lòng liên hệ admin.',
        data: {
          user: {
            userId: user.user_id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.Role?.role_name,
            company_id: null,
            needsCompanyAssignment: true
          },
          token: jwt.sign(
            { id: user.user_id, username: user.username, role: user.Role?.role_name, company_id: null },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
          )
        }
      });
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
