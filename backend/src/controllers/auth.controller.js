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

    // ===== KIỂM TRA NGƯỜI DÙNG HIỆN CÓ VÀ ÁP DỤNG QUY TẮC TRẠNG THÁI =====
    let userStatus = 'ACTIVE'; // Mặc định
    let isActive = true;
    
    if (finalRoleId === 2) { // Áp dụng cho tất cả recruiters
      if (company_id) {
        // Recruiter với công ty có sẵn - kiểm tra số lượng hiện có
        const existingUserCount = await User.count({
          where: {
            company_id: company_id,
            role_id: 2 // Chỉ đếm recruiters
          }
        });

        console.log(`Company ID ${company_id} has ${existingUserCount} existing recruiters`);

        if (existingUserCount === 0) {
          // Đây là người đầu tiên
          userStatus = 'ACTIVE';
          isActive = true;
          console.log('✅ First recruiter for this company - Status: ACTIVE');
        } else {
          // Công ty đã có người dùng
          userStatus = 'PENDING';
          isActive = false;
          console.log('⏳ Additional recruiter for existing company - Status: PENDING');
        }
      } else if (other_company_name) {
        // Recruiter yêu cầu công ty mới - LUÔN chờ admin phê duyệt
        userStatus = 'PENDING';
        isActive = false;
        console.log('⏳ New company request - Status: PENDING (waiting for admin approval)');
      }
    }

    // Tạo user với các field cơ bản (không bao gồm status nếu chưa có cột)
    const userCreateData = {
      username,
      email,
      password_hash: hashedPassword,
      full_name,
      role_id: finalRoleId,
      company_id: finalRoleId === 2 ? company_id : null, // Only set company for recruiters
      is_active: isActive
    };

    // Chỉ thêm status nếu model hỗ trợ
    try {
      // Kiểm tra xem cột status có tồn tại không
      const userAttributes = User.rawAttributes;
      if (userAttributes.status) {
        userCreateData.status = userStatus;
      }
    } catch (e) {
      console.log('Status column not available, using is_active only');
    }

    const newUser = await User.create(userCreateData);
    await SystemLog.create({
      user_id: newUser.user_id,
      action: 'REGISTER',
      description: 'New account registered',
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // ===== TẠO THÔNG BÁO CHO ADMIN =====
    
    // Thông báo cho trường hợp PENDING (recruiter thứ 2+ cho công ty)
    if (userStatus === 'PENDING') {
      // Lấy thông tin công ty
      const company = await Company.findByPk(company_id);
      const companyName = company ? company.company_name : `Company ID ${company_id}`;
      
      await createNotification(
        'RECRUITER_PENDING_APPROVAL',
        '⏳ Yêu cầu phê duyệt Recruiter bổ sung',
        `Recruiter "${username}" (${email}) đã đăng ký cho công ty "${companyName}" nhưng công ty này đã có recruiter. Tài khoản đang ở trạng thái chờ phê duyệt. Vui lòng xem xét và phê duyệt để cho phép recruiter này hoạt động.`,
        newUser.user_id,
        {
          username: newUser.username,
          email: newUser.email,
          full_name: newUser.full_name,
          company_id: company_id,
          company_name: companyName,
          status: userStatus,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          registered_at: new Date()
        },
        'HIGH'
      );
    }

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

    // ===== TRẢ VỀ PHẢN HỒI DỰA TRÊN TRẠNG THÁI =====
    if (userStatus === 'PENDING') {
      let message, warning;
      
      if (other_company_name) {
        // Trường hợp công ty mới
        message = `Tài khoản đã được tạo thành công! Tuy nhiên, công ty "${other_company_name}" chưa có trong hệ thống.`;
        warning = 'Admin sẽ thêm công ty này vào hệ thống và kích hoạt tài khoản của bạn. Bạn sẽ nhận được email thông báo khi có thể đăng nhập.';
      } else {
        // Trường hợp công ty đã có recruiter
        message = 'Tài khoản của bạn đang chờ phê duyệt vì công ty này đã có tài khoản đã đăng ký.';
        warning = 'Bạn sẽ không thể đăng nhập cho đến khi Admin phê duyệt tài khoản của bạn.';
      }
      
      return res.status(201).json({
        success: true,
        status: 'PENDING',
        message: message,
        warning: warning,
        user: {
          userId: newUser.user_id,
          username: newUser.username,
          email: newUser.email,
          role_id: newUser.role_id,
          status: userStatus,
          company_id: newUser.company_id,
          is_active: isActive,
          other_company_name: other_company_name
        }
      });
    }

    return res.status(201).json({
      success: true,
      status: 'ACTIVE',
      message: `Đăng ký tài khoản thành công với vai trò ${finalRoleId === 2 ? 'Recruiter' : 'Candidate'}`,
      user: {
        userId: newUser.user_id,  // Chuẩn hóa key thành userId
        username: newUser.username,
        email: newUser.email,
        role_id: newUser.role_id,
        status: userStatus,
        company_id: newUser.company_id,
        is_active: isActive
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
      // Kiểm tra lý do tại sao tài khoản không active
      if (user.role_id === 2 && !user.company_id) {
        // Recruiter chưa có công ty hoặc đang chờ admin thêm công ty mới
        return res.status(403).json({ 
          success: false, 
          message: 'Tài khoản đang chờ Admin phê duyệt và thêm công ty vào hệ thống. Vui lòng chờ email thông báo.' 
        });
      } else {
        // Trường hợp khác
        return res.status(403).json({ 
          success: false, 
          message: 'Tài khoản đang chờ phê duyệt từ Admin. Vui lòng chờ thông báo qua email.' 
        });
      }
    }

    // Kiểm tra trạng thái tài khoản (nếu có cột status)
    if (user.status) {
      if (user.status === 'PENDING') {
        return res.status(403).json({ 
          success: false, 
          status: 'PENDING',
          message: 'Tài khoản của bạn đang chờ phê duyệt từ Admin. Vui lòng chờ thông báo qua email.' 
        });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({ 
          success: false, 
          status: 'INACTIVE',
          message: 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ Admin.' 
        });
      }
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
