const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Candidate, CandidateResume, User } = require('../models');
const { Op } = require('sequelize');
const emailService = require('../services/email.service');
const accountService = require('../services/account.service');
const logger = require('../utils/logger');

// Configure multer for CV upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/cv');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: originalname-timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only accept PDF and DOC files
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file PDF, DOC, hoặc DOCX'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// @route   POST /api/apply
// @desc    Submit job application with CV
// @access  Public (no authentication required)
const applyJob = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, position, company_name, experience_years, company_id } = req.body;

    // Validation
    if (!first_name || !last_name || !email || !phone || !position || !experience_years) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin: Họ, Tên, Email, Số điện thoại, Vị trí, Số năm kinh nghiệm'
      });
    }

    // Validate company_id
    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn công ty bạn muốn ứng tuyển'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file CV'
      });
    }

    // Check if candidate with this email already exists
    const existingCandidate = await Candidate.findOne({ where: { email } });
    
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng để nộp CV trước đó'
      });
    }

    // Create candidate record
    const newCandidate = await Candidate.create({
      first_name,
      last_name,
      email,
      phone,
      position: position,
      company_name: company_name || null,
      current_position: position, // Use position as current_position
      experience_years: experience_years,
      years_of_experience: parseInt(experience_years) || 0,
      status: 'NEW', // Default status
      source: 'WEBSITE_APPLY', // Track where the candidate came from
      company_id: parseInt(company_id) // Link candidate to the company they applied to
    });

    // Save CV path to candidate_resumes table
    const cvPath = `/uploads/cv/${req.file.filename}`;
    await CandidateResume.create({
      candidate_id: newCandidate.candidate_id,
      resume_type: 'CV',
      file_path: cvPath,
      file_name: req.file.originalname,
      uploaded_at: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Nộp CV thành công! Chúng tôi sẽ liên hệ với bạn sớm.',
      data: {
        candidate_id: newCandidate.candidate_id,
        full_name: `${first_name} ${last_name}`,
        email: email,
        cv_uploaded: true
      }
    });

  } catch (error) {
    console.error('Apply job error:', error);
    
    // Delete uploaded file if database operation failed
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/cv', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi nộp CV. Vui lòng thử lại sau.',
      error: error.message
    });
  }
};

// @route   GET /api/candidates
// @desc    Get list of all candidates with their resumes
// @access  Private (Recruiter/Admin only)
const getCandidates = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    // 🔒 SECURITY CHECK: Filter by company for recruiters ONLY (Admin sees all)
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    
    // Build where clause for filtering
    const whereClause = {};
    
    // 🔒 COMPANY FILTER - Only RECRUITER is restricted to their company
    if (userRole === 'RECRUITER') {
      if (!req.user.company_id) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty',
          error_code: 'NO_COMPANY'
        });
      }
      whereClause.company_id = req.user.company_id;
      console.log(`🔒 RECRUITER FILTER: Only showing candidates for company ${req.user.company_id}`);
    } else if (userRole === 'ADMIN') {
      console.log('👑 ADMIN ACCESS: Showing all candidates from all companies');
    }
    
    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (page - 1) * limit;

    // Fetch candidates with their resumes
    const { count, rows: candidates } = await Candidate.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: CandidateResume,
          as: 'CandidateResumes', // Add alias to match model association
          attributes: ['resume_id', 'file_type', 'file_path', 'file_name', 'file_size', 'uploaded_at', 'is_primary'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    return res.status(200).json({
      success: true,
      count: count,
      total_pages: Math.ceil(count / limit),
      current_page: parseInt(page),
      data: candidates
    });

  } catch (error) {
    console.error('Get candidates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách ứng viên',
      error: error.message
    });
  }
};

// @route   PUT /api/candidates/:id
// @desc    Update candidate information
// @access  Private (Recruiter/Admin only)
const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      position,
      company_name,
      current_position,
      experience_years,
      education,
      skills,
      source,
      status,
      notes
    } = req.body;

    // Find candidate
    const candidate = await Candidate.findByPk(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ứng viên'
      });
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['NEW', 'SCREENING', 'TESTING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status không hợp lệ. Các giá trị cho phép: ${validStatuses.join(', ')}`
        });
      }
    }

    // Update fields if provided
    if (first_name !== undefined) candidate.first_name = first_name;
    if (last_name !== undefined) candidate.last_name = last_name;
    if (email !== undefined) candidate.email = email;
    if (phone !== undefined) candidate.phone = phone;
    if (position !== undefined) candidate.position = position;
    if (company_name !== undefined) candidate.company_name = company_name;
    if (current_position !== undefined) candidate.current_position = current_position;
    if (experience_years !== undefined) candidate.experience_years = experience_years;
    if (education !== undefined) candidate.education = education;
    if (skills !== undefined) candidate.skills = skills;
    if (source !== undefined) candidate.source = source;
    if (status !== undefined) candidate.status = status;
    if (notes !== undefined) candidate.notes = notes;

    await candidate.save();

    return res.status(200).json({
      success: true,
      message: 'Đã cập nhật thông tin ứng viên thành công',
      data: candidate
    });

  } catch (error) {
    console.error('Update candidate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin ứng viên',
      error: error.message
    });
  }
};

// @route   PUT /api/candidates/:id/status
// @desc    Update candidate status (Pass/Fail) - WITH AUTO EMAIL
// @access  Private (Recruiter/Admin only)
const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['NEW', 'SCREENING', 'TESTING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status không hợp lệ. Các giá trị cho phép: ${validStatuses.join(', ')}`
      });
    }

    // Find candidate
    const candidate = await Candidate.findByPk(id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ứng viên'
      });
    }

    // 🔒 SECURITY CHECK: Verify recruiter can only update their company's candidates
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    if (userRole === 'RECRUITER') {
      if (!req.user.company_id) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty',
          error_code: 'NO_COMPANY'
        });
      }
      if (candidate.company_id !== req.user.company_id) {
        logger.warn(`🚫 BLOCKED: Recruiter company ${req.user.company_id} tried to update candidate ${id} from company ${candidate.company_id}`);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật trạng thái ứng viên của công ty khác'
        });
      }
    } else if (userRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật trạng thái ứng viên'
      });
    }

    // Store old status
    const oldStatus = candidate.status;
    
    // Update status and notes
    candidate.status = status;
    if (notes) {
      candidate.notes = notes;
    }
    await candidate.save();

    const candidateName = `${candidate.first_name} ${candidate.last_name}`;
    const candidateEmail = candidate.email;
    
    // ========================================
    // AUTO EMAIL SYSTEM
    // ========================================
    let emailSent = false;
    let accountCreated = false;
    let accountInfo = null;

    try {
      // CASE 1: PASS - Status is HIRED or OFFERED
      // Always send email when recruiter sets status to HIRED/OFFERED (even if already HIRED)
      if (status === 'HIRED' || status === 'OFFERED') {
        logger.info(`🎉 Candidate PASSED: ${candidateName} (${candidateEmail}) - Status: ${status}`);
        
        // Always create/reset account and get credentials
        accountInfo = await accountService.createCandidateAccount(candidate);
        
        if (accountInfo) {
          accountCreated = !accountInfo.isReset;
          
          if (accountInfo.isReset) {
            logger.info(`🔄 Password reset for: ${accountInfo.username}`);
          } else {
            logger.info(`✅ Account created: ${accountInfo.username}`);
          }
          
          // Send approval email with credentials (new or reset)
          await emailService.sendApprovalEmail(
            candidateEmail,
            candidateName,
            accountInfo.username,
            accountInfo.password
          );
          emailSent = true;
          logger.info(`✅ Approval email sent to ${candidateEmail} with credentials`);
        }
      }
      
      // CASE 2: FAIL - Status is REJECTED
      // Always send email when recruiter sets status to REJECTED (even if already REJECTED)
      else if (status === 'REJECTED') {
        logger.info(`❌ Candidate REJECTED: ${candidateName} (${candidateEmail})`);
        
        // Send rejection email
        await emailService.sendRejectionEmail(
          candidateEmail,
          candidateName,
          candidate.position || candidate.current_position || ''
        );
        emailSent = true;
        logger.info(`✅ Rejection email sent to ${candidateEmail}`);
      }
      
    } catch (emailError) {
      // Log email error but don't fail the status update
      logger.error(`❌ Email error for candidate ${id}:`, emailError);
      // Continue - status was already updated successfully
    }

    // Build response
    const responseData = {
      candidate_id: candidate.candidate_id,
      full_name: candidateName,
      email: candidateEmail,
      old_status: oldStatus,
      new_status: status,
      updated_at: candidate.updated_at,
      email_sent: emailSent
    };

    // Add account info to response if created
    if (accountCreated && accountInfo) {
      responseData.account_created = true;
      responseData.username = accountInfo.username;
      responseData.message = 'Đã tạo tài khoản và gửi email thông báo';
    } else if (emailSent && status === 'REJECTED') {
      responseData.message = 'Đã gửi email thông báo từ chối';
    } else if (emailSent) {
      responseData.message = 'Đã gửi email thông báo';
    }

    logger.info(`✅ Status updated for candidate ${id}: ${oldStatus} -> ${status}`);

    return res.status(200).json({
      success: true,
      message: responseData.message || `Đã cập nhật trạng thái từ "${oldStatus}" sang "${status}"`,
      data: responseData
    });

  } catch (error) {
    logger.error('Update candidate status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái ứng viên',
      error: error.message
    });
  }
};

// @route   GET /api/candidates/:id
// @desc    Get single candidate by ID
// @access  Private (Recruiter/Admin only)
const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 getCandidateById called with id:', id);

    // Try simple SQL query first to debug
    const sequelize = require('../config/database');
    const [candidates] = await sequelize.query(`
      SELECT * FROM candidates WHERE candidate_id = ?
    `, {
      replacements: [id]
    });

    const candidate = candidates[0];
    console.log('📦 Found candidate:', candidate);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ứng viên'
      });
    }

    // 🔒 SECURITY CHECK: Verify recruiter can only view their company's candidates (Admin sees all)
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    if (userRole === 'RECRUITER') {
      if (!req.user.company_id) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty',
          error_code: 'NO_COMPANY'
        });
      }
      if (candidate.company_id !== req.user.company_id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem ứng viên của công ty khác'
        });
      }
    } else if (userRole === 'ADMIN') {
      console.log('👑 ADMIN access: Can view all candidates');
    }

    return res.status(200).json({
      success: true,
      data: candidate,
      message: 'Candidate retrieved successfully'
    });

  } catch (error) {
    console.error('Get candidate by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải thông tin ứng viên',
      error: error.message
    });
  }
};

// @route   GET /api/candidates/:id/cv
// @desc    Download/View candidate CV
// @access  Private (Recruiter/Admin only)
const getCandidateCV = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔒 SECURITY CHECK: Verify recruiter can only download their company's candidate CV (Admin downloads all)
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    if (userRole === 'RECRUITER') {
      // First check if candidate belongs to recruiter's company
      const candidate = await Candidate.findByPk(id);
      if (!candidate) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy ứng viên'
        });
      }
      if (candidate.company_id !== req.user.company_id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền tải CV của ứng viên công ty khác'
        });
      }
    } else if (userRole === 'ADMIN') {
      console.log('👑 ADMIN access: Can download all CVs');
    }

    // Find candidate's CV
    const resume = await CandidateResume.findOne({
      where: { candidate_id: id },
      order: [['uploaded_at', 'DESC']] // Get most recent CV
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy CV của ứng viên này'
      });
    }

    // Build file path
    const filePath = path.join(__dirname, '../..', resume.file_path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File CV không tồn tại trên server'
      });
    }

    // Set UTF-8 encoding for Vietnamese filename
    const encodedFileName = encodeURIComponent(resume.file_name);
    
    // Set headers for proper UTF-8 filename display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`);

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Download CV error:', err);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Không thể tải file CV'
          });
        }
      }
    });

  } catch (error) {
    console.error('Get candidate CV error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải CV',
      error: error.message
    });
  }
};

// @route   DELETE /api/apply/candidates/:id
// @desc    Delete a candidate
// @access  ADMIN, RECRUITER
const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role || req.user.Role?.role_name;

    logger.info(`🗑️ Attempting to delete candidate ${id} by user ${userId} (${userRole})`);

    // Find candidate
    const candidate = await Candidate.findByPk(id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ứng viên'
      });
    }

    // Authorization check
    if (userRole !== 'ADMIN') {
      // Recruiter can only delete candidates from their company
      if (candidate.company_id !== req.user.company_id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa ứng viên này'
        });
      }
    }

    // Delete associated CV files
    const resumes = await CandidateResume.findAll({
      where: { candidate_id: id }
    });

    for (const resume of resumes) {
      const filePath = path.join(__dirname, '../../uploads/cv', path.basename(resume.file_path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`🗑️ Deleted CV file: ${filePath}`);
      }
    }

    // Delete resumes from database
    await CandidateResume.destroy({
      where: { candidate_id: id }
    });

    // Delete user account if exists
    if (candidate.user_id) {
      await User.destroy({
        where: { user_id: candidate.user_id }
      });
      logger.info(`🗑️ Deleted user account: ${candidate.user_id}`);
    }

    // Delete candidate
    await candidate.destroy();

    logger.info(`✅ Successfully deleted candidate ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Đã xóa ứng viên thành công'
    });

  } catch (error) {
    logger.error('Delete candidate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa ứng viên',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  applyJob,
  getCandidates,
  getCandidateById,
  updateCandidate,
  updateCandidateStatus,
  getCandidateCV,
  deleteCandidate
};
