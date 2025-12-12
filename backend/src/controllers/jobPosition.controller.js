const { JobPosition, User, Company, CandidateJobApplication } = require('../models');
const logger = require('../utils/logger');

const jobPositionController = {
  // Get all active job positions (public or filtered by company)
  getAllPositions: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        title,
        department, 
        location,
        company_id 
      } = req.query;
      
      const offset = (page - 1) * limit;
      const whereConditions = { is_active: true };
      const { Op } = require('sequelize');
      
      // Search by title or description
      if (search) {
        whereConditions[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { requirements: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Filter by specific title
      if (title) {
        whereConditions.title = { [Op.like]: `%${title}%` };
      }
      
      // Filter by department/industry
      if (department) {
        whereConditions.department = { [Op.like]: `%${department}%` };
      }
      
      // Filter by location (search in description or requirements)
      if (location && location !== 'danang') {
        whereConditions[Op.or] = [
          ...(whereConditions[Op.or] || []),
          { description: { [Op.like]: `%${location}%` } },
          { requirements: { [Op.like]: `%${location}%` } }
        ];
      }
      
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
            attributes: ['company_id', 'companyName', 'companyCode', 'address']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      // Add applicationCount: 0 since there's no application tracking table yet
      const transformedPositions = positions.map(pos => {
        const posData = pos.get({ plain: true });
        return {
          ...posData,
          applicationCount: 0
        };
      });
      
      return res.status(200).json({
        success: true,
        data: {
          positions: transformedPositions,
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
      const { title, department, description, requirements, company_id, location, job_type, deadline, company_name, positions_available } = req.body;
      
      if (!title) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tên vị trí là bắt buộc' 
        });
      }
      
      let finalCompanyId = company_id || (req.user ? req.user.company_id : null);
      
      // If company_name is provided but no company_id, create or find company
      if (company_name && !finalCompanyId) {
        // Check if company exists by name
        let company = await Company.findOne({
          where: { companyName: company_name }
        });
        
        // If not exists, create new company
        if (!company) {
          company = await Company.create({
            companyName: company_name,
            companyCode: company_name.substring(0, 10).toUpperCase().replace(/\s/g, ''),
            status: 'active'
          });
          logger.info(`Auto-created company: ${company_name} (ID: ${company.company_id})`);
        }
        
        finalCompanyId = company.company_id;
      }
      
      const position = await JobPosition.create({
        title,
        department,
        description,
        requirements,
        location,
        job_type,
        deadline,
        positions_available: positions_available || 1,
        company_name,
        company_id: finalCompanyId,
        created_by: req.user ? req.user.user_id : null,
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
      const { 
        title, 
        department, 
        description, 
        requirements, 
        location,
        job_type,
        deadline,
        positions_available,
        company_name,
        is_active 
      } = req.body;
      
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
        location: location !== undefined ? location : position.location,
        job_type: job_type !== undefined ? job_type : position.job_type,
        deadline: deadline !== undefined ? deadline : position.deadline,
        positions_available: positions_available !== undefined ? positions_available : position.positions_available,
        company_name: company_name !== undefined ? company_name : position.company_name,
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
