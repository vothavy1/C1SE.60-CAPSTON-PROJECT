const { CandidateJobApplication, Candidate, JobPosition, User, Company } = require('../models');
const logger = require('../utils/logger');

const applicationController = {
  // Apply for a job position (Candidate only)
  applyForJob: async (req, res) => {
    try {
      const { position_id } = req.body;
      const userId = req.user.user_id;
      
      // Get candidate info
      const candidate = await Candidate.findOne({ where: { user_id: userId } });
      
      if (!candidate) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy hồ sơ ứng viên' 
        });
      }
      
      // Check if position exists and is active
      const position = await JobPosition.findByPk(position_id);
      
      if (!position || !position.is_active) {
        return res.status(404).json({ 
          success: false, 
          message: 'Vị trí tuyển dụng không tồn tại hoặc đã đóng' 
        });
      }
      
      // Check if already applied
      const existingApplication = await CandidateJobApplication.findOne({
        where: { 
          candidate_id: candidate.candidate_id,
          position_id: position_id
        }
      });
      
      if (existingApplication) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bạn đã ứng tuyển vị trí này rồi' 
        });
      }
      
      // Create application
      const application = await CandidateJobApplication.create({
        candidate_id: candidate.candidate_id,
        position_id: position_id,
        status: 'APPLIED',
        application_date: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Ứng tuyển thành công',
        data: application
      });
    } catch (error) {
      logger.error(`Apply for job error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi ứng tuyển' 
      });
    }
  },

  // Get my applications (Candidate only)
  getMyApplications: async (req, res) => {
    try {
      const userId = req.user.user_id;
      
      const candidate = await Candidate.findOne({ where: { user_id: userId } });
      
      if (!candidate) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy hồ sơ ứng viên' 
        });
      }
      
      const applications = await CandidateJobApplication.findAll({
        where: { candidate_id: candidate.candidate_id },
        include: [
          {
            model: JobPosition,
            include: [
              {
                model: Company,
                attributes: ['company_id', 'companyName', 'companyCode']
              }
            ]
          },
          {
            model: User,
            as: 'Recruiter',
            attributes: ['user_id', 'username', 'full_name']
          }
        ],
        order: [['application_date', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        data: applications
      });
    } catch (error) {
      logger.error(`Get my applications error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách ứng tuyển' 
      });
    }
  },

  // Get all applications (Recruiter/Admin)
  getAllApplications: async (req, res) => {
    try {
      const { page = 1, limit = 20, status, position_id } = req.query;
      const offset = (page - 1) * limit;
      const whereConditions = {};
      
      // Filter by company for recruiter
      const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
      
      if (status) whereConditions.status = status;
      if (position_id) whereConditions.position_id = position_id;
      
      const includeOptions = [
        {
          model: Candidate,
          include: [
            {
              model: User,
              attributes: ['user_id', 'username', 'email', 'full_name']
            },
            {
              model: Company,
              attributes: ['company_id', 'companyName']
            }
          ]
        },
        {
          model: JobPosition,
          include: [
            {
              model: Company,
              attributes: ['company_id', 'companyName', 'companyCode']
            }
          ]
        },
        {
          model: User,
          as: 'Recruiter',
          attributes: ['user_id', 'username', 'full_name']
        }
      ];
      
      // Filter by recruiter's company
      if (userRole === 'RECRUITER' && req.user.company_id) {
        includeOptions[1].where = { company_id: req.user.company_id };
      }
      
      const { count, rows: applications } = await CandidateJobApplication.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: includeOptions,
        order: [['application_date', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        data: {
          applications,
          pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error(`Get all applications error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách ứng tuyển' 
      });
    }
  },

  // Update application status (Recruiter/Admin)
  updateApplicationStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, recruiter_id } = req.body;
      
      const application = await CandidateJobApplication.findByPk(id);
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy đơn ứng tuyển' 
        });
      }
      
      await application.update({
        status: status || application.status,
        recruiter_id: recruiter_id || req.user.user_id
      });
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thành công',
        data: application
      });
    } catch (error) {
      logger.error(`Update application status error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi cập nhật trạng thái' 
      });
    }
  },

  // Cancel application (Candidate only)
  cancelApplication: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.user_id;
      
      const candidate = await Candidate.findOne({ where: { user_id: userId } });
      
      if (!candidate) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy hồ sơ ứng viên' 
        });
      }
      
      const application = await CandidateJobApplication.findOne({
        where: { 
          application_id: id,
          candidate_id: candidate.candidate_id
        }
      });
      
      if (!application) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy đơn ứng tuyển' 
        });
      }
      
      if (application.status !== 'APPLIED') {
        return res.status(400).json({ 
          success: false, 
          message: 'Chỉ có thể hủy đơn ứng tuyển đang ở trạng thái "Đã nộp"' 
        });
      }
      
      await application.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Hủy ứng tuyển thành công'
      });
    } catch (error) {
      logger.error(`Cancel application error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi hủy ứng tuyển' 
      });
    }
  }
};

module.exports = applicationController;
