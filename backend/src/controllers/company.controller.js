const { Company } = require('../models');
const logger = require('../utils/logger');

// Get all active companies
exports.getAllCompanies = async (req, res) => {
  try {
    const whereConditions = { status: 'active' };
    
    // 🔒 COMPANY FILTER - Recruiter chỉ xem được công ty của mình
    const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
    console.log(`👤 User: ${req.user?.username}, Role: ${userRole}, Company ID: ${req.user?.company_id}`);
    
    if (userRole === 'RECRUITER') {
      if (req.user.company_id) {
        whereConditions.company_id = req.user.company_id;
        console.log(`🔒 RECRUITER FILTER APPLIED: Only showing company_id = ${req.user.company_id}`);
      } else {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản recruiter chưa được gán vào công ty nào. Vui lòng liên hệ admin.'
        });
      }
    }
    
    const companies = await Company.findAll({
      where: whereConditions,
      attributes: ['company_id', 'companyName', 'companyCode', 'email', 'description'],
      order: [['companyName', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      count: companies.length,
      data: companies
    });
  } catch (error) {
    logger.error(`Error getting companies: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách công ty',
      error: error.message
    });
  }
};

// Get company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty'
      });
    }

    return res.status(200).json({
      success: true,
      data: company
    });
  } catch (error) {
    logger.error(`Error getting company: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin công ty',
      error: error.message
    });
  }
};

// Create new company (Admin only)
exports.createCompany = async (req, res) => {
  try {
    const { companyName, companyCode, address, phone, email, website, description } = req.body;

    if (!companyName) {
      return res.status(400).json({
        success: false,
        message: 'Tên công ty là bắt buộc'
      });
    }

    const existingCompany = await Company.findOne({
      where: { companyName }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Công ty đã tồn tại'
      });
    }

    const company = await Company.create({
      companyName,
      companyCode,
      address,
      phone,
      email,
      website,
      description,
      status: 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo công ty thành công',
      data: company
    });
  } catch (error) {
    logger.error(`Error creating company: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Không thể tạo công ty',
      error: error.message
    });
  }
};

// Update company (Admin only)
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyName, companyCode, address, phone, email, website, description, status } = req.body;

    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty'
      });
    }

    // Check if new company name already exists (excluding current company)
    if (companyName && companyName !== company.companyName) {
      const existingCompany = await Company.findOne({
        where: { companyName }
      });

      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Tên công ty đã tồn tại'
        });
      }
    }

    // Update company fields
    await company.update({
      companyName: companyName || company.companyName,
      companyCode: companyCode !== undefined ? companyCode : company.companyCode,
      address: address !== undefined ? address : company.address,
      phone: phone !== undefined ? phone : company.phone,
      email: email !== undefined ? email : company.email,
      website: website !== undefined ? website : company.website,
      description: description !== undefined ? description : company.description,
      status: status || company.status
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật công ty thành công',
      data: company
    });
  } catch (error) {
    logger.error(`Error updating company: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật công ty',
      error: error.message
    });
  }
};

// Delete company (Admin only)
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công ty'
      });
    }

    // Check if company has associated users
    const { User } = require('../models');
    const usersCount = await User.count({
      where: { company_id: id }
    });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa công ty có ${usersCount} nhân viên. Vui lòng chuyển nhân viên sang công ty khác trước.`
      });
    }

    await company.destroy();

    return res.status(200).json({
      success: true,
      message: 'Xóa công ty thành công'
    });
  } catch (error) {
    logger.error(`Error deleting company: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa công ty',
      error: error.message
    });
  }
};
