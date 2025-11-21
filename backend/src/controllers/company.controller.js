const { Company } = require('../models');
const logger = require('../utils/logger');

// Get all active companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { status: 'active' },
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
