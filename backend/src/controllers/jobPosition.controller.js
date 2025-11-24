const { JobPosition, User, Company, CandidateJobApplication } = require('../models');
const logger = require('../utils/logger');

const jobPositionController = {
  // Get all active job positions (public or filtered by company)
  getAllPositions: async (req, res) => {
    try {
      const { page = 1, limit = 20, search, department, company_id } = req.query;
      const offset = (page - 1) * limit;
      const whereConditions = { is_active: true };
      
      if (search) {
        whereConditions[require('sequelize').Op.or] = [
          { title: { [require('sequelize').Op.like]: `%${search}%` } },
          { description: { [require('sequelize').Op.like]: `%${search}%` } }
        ];
      }
      
      if (department) whereConditions.department = department;
      if (company_id) whereConditions.company_id = company_id;
      
      const { count, rows: positions } = await JobPosition.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['user_id', 'username', 'full_name']
          },
          {
            model: Company,
            attributes: ['company_id', 'companyName', 'companyCode']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        data: {
          positions,
          pagination: {
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error(`Get all positions error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy danh sách vị trí tuyển dụng' 
      });
    }
  },

  // Get position by ID
  getPositionById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const position = await JobPosition.findByPk(id, {
        include: [
          {
            model: User,
            as: 'Creator',
            attributes: ['user_id', 'username', 'full_name']
          },
          {
            model: Company,
            attributes: ['company_id', 'companyName', 'companyCode', 'address', 'email', 'phone']
          }
        ]
      });
      
      if (!position) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy vị trí tuyển dụng' 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: position
      });
    } catch (error) {
      logger.error(`Get position by ID error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi lấy thông tin vị trí tuyển dụng' 
      });
    }
  },

  // Create new position (Recruiter/Admin only)
  createPosition: async (req, res) => {
    try {
      const { title, department, description, requirements, company_id } = req.body;
      
      if (!title) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tên vị trí là bắt buộc' 
        });
      }
      
      const position = await JobPosition.create({
        title,
        department,
        description,
        requirements,
        company_id: company_id || req.user.company_id,
        created_by: req.user.user_id,
        is_active: true
      });
      
      return res.status(201).json({
        success: true,
        message: 'Tạo vị trí tuyển dụng thành công',
        data: position
      });
    } catch (error) {
      logger.error(`Create position error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi tạo vị trí tuyển dụng' 
      });
    }
  },

  // Update position
  updatePosition: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, department, description, requirements, is_active } = req.body;
      
      const position = await JobPosition.findByPk(id);
      
      if (!position) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy vị trí tuyển dụng' 
        });
      }
      
      await position.update({
        title: title || position.title,
        department: department !== undefined ? department : position.department,
        description: description !== undefined ? description : position.description,
        requirements: requirements !== undefined ? requirements : position.requirements,
        is_active: is_active !== undefined ? is_active : position.is_active
      });
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật vị trí tuyển dụng thành công',
        data: position
      });
    } catch (error) {
      logger.error(`Update position error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi cập nhật vị trí tuyển dụng' 
      });
    }
  },

  // Delete position
  deletePosition: async (req, res) => {
    try {
      const { id } = req.params;
      
      const position = await JobPosition.findByPk(id);
      
      if (!position) {
        return res.status(404).json({ 
          success: false, 
          message: 'Không tìm thấy vị trí tuyển dụng' 
        });
      }
      
      // Check if there are applications
      const applicationCount = await CandidateJobApplication.count({
        where: { position_id: id }
      });
      
      if (applicationCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa vị trí có ${applicationCount} đơn ứng tuyển. Vui lòng đặt trạng thái không hoạt động thay thế.`
        });
      }
      
      await position.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Xóa vị trí tuyển dụng thành công'
      });
    } catch (error) {
      logger.error(`Delete position error: ${error.message}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi khi xóa vị trí tuyển dụng' 
      });
    }
  }
};

module.exports = jobPositionController;
