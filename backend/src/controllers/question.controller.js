const { Question, QuestionCategory, QuestionOption, CodingQuestionTemplate, User, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * Question management controller
 */
const questionController = {
  /**
   * Get all questions with pagination and filters
   */
  getAllQuestions: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        categoryId,
        type,
        difficulty,
        search,
        isActive
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions = {};
      
      // 🔒 COMPANY FILTER - Recruiter chỉ xem được câu hỏi của công ty mình
      const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
      console.log(`👤 User: ${req.user?.username}, Role: ${userRole}, Company ID: ${req.user?.company_id}`);
      
      if (userRole === 'RECRUITER') {
        if (req.user.company_id) {
          whereConditions.company_id = req.user.company_id;
          console.log(`🔒 RECRUITER FILTER APPLIED: Only showing questions with company_id = ${req.user.company_id}`);
        } else {
          return res.status(403).json({
            success: false,
            message: 'Tài khoản recruiter chưa được gán vào công ty nào. Vui lòng liên hệ admin.'
          });
        }
      }
      
      if (categoryId) whereConditions.category_id = categoryId;
      if (type) whereConditions.question_type = type;
      if (difficulty) whereConditions.difficulty_level = difficulty;
      if (isActive !== undefined) whereConditions.is_active = isActive === 'true';
      
      // Add search condition if provided
      if (search) {
        whereConditions[sequelize.Op.or] = [
          { question_text: { [sequelize.Op.like]: `%${search}%` } }
        ];
      }
      
      // Get questions with pagination
      const { count, rows: questions } = await Question.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        include: [
          {
            model: QuestionCategory,
            attributes: ['category_id', 'category_name']
          },
          {
            model: QuestionOption,
            as: 'QuestionOptions',
            attributes: ['option_id', 'option_text', 'is_correct']
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['user_id', 'username', 'full_name']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      // Calculate total pages
      const totalPages = Math.ceil(count / limit);
      
      return res.status(200).json({
        success: true,
        data: {
          questions,
          pagination: {
            total: count,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
      
    } catch (error) {
      logger.error(`Get all questions error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy danh sách câu hỏi' });
    }
  },
  
  /**
   * Get question by ID with all details
   */
  getQuestionById: async (req, res) => {
    try {
      const questionId = req.params.id;
      
      // Get question with details
      const question = await Question.findByPk(questionId, {
        include: [
          {
            model: QuestionCategory,
            attributes: ['category_id', 'category_name']
          },
          {
            model: QuestionOption,
            as: 'QuestionOptions',
            attributes: ['option_id', 'option_text', 'is_correct']
          },
          {
            model: CodingQuestionTemplate,
            attributes: ['template_id', 'programming_language', 'code_template', 'test_cases']
          },
          {
            model: User,
            as: 'Creator',
            attributes: ['user_id', 'username', 'full_name']
          }
        ]
      });
      
      if (!question) {
        logger.warn(`Question not found: ${questionId}`);
        return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
      }
      
      // 🔒 COMPANY CHECK - Recruiter chỉ xem được câu hỏi của công ty mình
      const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase() || 'UNKNOWN';
      
      logger.info(`📋 Get question ${questionId}: User ${req.user?.username || 'unknown'} (role: ${userRole}, company: ${req.user?.company_id || 'null'}) accessing question (company: ${question.company_id})`);
      
      // Skip company check for ADMIN
      if (userRole === 'ADMIN') {
        logger.info(`👑 ADMIN access granted for question ${questionId}`);
        return res.status(200).json({
          success: true,
          data: question
        });
      }
      
      if (userRole === 'RECRUITER') {
        if (!req.user.company_id) {
          logger.error(`❌ Recruiter ${req.user.username} has no company_id`);
          return res.status(403).json({
            success: false,
            message: 'Tài khoản recruiter chưa được gán vào công ty'
          });
        }
        
        if (question.company_id !== req.user.company_id) {
          logger.warn(`🚫 ACCESS DENIED: Recruiter company_id=${req.user.company_id} tried to access question company_id=${question.company_id}`);
          return res.status(403).json({
            success: false,
            message: `Bạn không có quyền xem câu hỏi này. Câu hỏi thuộc về công ty khác (Company ID: ${question.company_id}). Bạn chỉ có thể xem câu hỏi của công ty mình (Company ID: ${req.user.company_id}).`,
            error_code: 'WRONG_COMPANY',
            details: {
              question_company: question.company_id,
              user_company: req.user.company_id
            }
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        data: question
      });
      
    } catch (error) {
      logger.error(`Get question by ID error: ${error.message}`);
      logger.error(`Error stack: ${error.stack}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Đã xảy ra lỗi khi lấy thông tin câu hỏi',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Create new question
   */
  createQuestion: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        question_title,
        question_text,
        question_type,
        difficulty_level,
        category_id,
        options,
        coding_template
      } = req.body;
      // Create question
      const newQuestion = await Question.create({
        question_title,
        question_text,
        question_type,
        difficulty_level,
        category_id: category_id || null,
        created_by: req.user.user_id,
        company_id: req.user.company_id || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }, { transaction });
      
      // Add options if applicable
      if (['MULTIPLE_CHOICE', 'SINGLE_CHOICE'].includes(question_type)) {
        logger.info('Options received:', options);
        if (options && options.length > 0) {
          for (const option of options) {
            logger.info(`Saving option: ${JSON.stringify(option)}`);
            await QuestionOption.create({
              question_id: newQuestion.question_id,
              option_text: option.option_text,
              is_correct: option.is_correct || false
            }, { transaction });
          }
        } else {
          logger.warn('No options provided for question_type:', question_type);
        }
      }
      
      // Add coding template if applicable
      if (question_type === 'CODING' && coding_template) {
        await CodingQuestionTemplate.create({
          question_id: newQuestion.question_id,
          programming_language: coding_template.programming_language,
          code_template: coding_template.code_template,
          test_cases: coding_template.test_cases
        }, { transaction });
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Get the created question with all details
        const createdQuestion = await Question.findByPk(newQuestion.question_id, {
          include: [
            {
              model: QuestionCategory,
              attributes: ['category_id', 'category_name']
            },
            {
              model: QuestionOption,
              as: 'QuestionOptions',
              attributes: ['option_id', 'option_text', 'is_correct']
            },
            {
              model: CodingQuestionTemplate,
              attributes: ['template_id', 'programming_language', 'code_template', 'test_cases']
            }
          ]
        });
      
      return res.status(201).json({
        success: true,
        message: 'Tạo câu hỏi mới thành công',
        data: createdQuestion
      });
      
    } catch (error) {
      // Rollback transaction in case of error, only if not finished
      if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
      logger.error(`Create question error: ${error.message} | Payload: ${JSON.stringify(req.body)} | Stack: ${error.stack}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tạo câu hỏi mới', error: error.message });
    }
  },
  
  /**
   * Update question
   */
  updateQuestion: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const questionId = req.params.id;
      const {
        question_title,
        question_text,
        question_type,
        difficulty_level,
        category_id,
        is_active,
        options,
        coding_template
      } = req.body;
      
      // Check if question exists
      const question = await Question.findByPk(questionId);
      
      if (!question) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
      }
      
      // 🔒 COMPANY CHECK - Recruiter chỉ cập nhật được câu hỏi của công ty mình
      const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase() || 'UNKNOWN';
      
      logger.info(`📝 Update question ${questionId}: User ${req.user?.username || 'unknown'} (role: ${userRole}, company: ${req.user?.company_id || 'null'}) updating question (company: ${question.company_id})`);
      
      // Skip company check for ADMIN
      if (userRole === 'ADMIN') {
        logger.info(`👑 ADMIN update granted for question ${questionId}`);
        // Continue to update
      } else if (userRole === 'RECRUITER') {
        if (!req.user.company_id) {
          await transaction.rollback();
          logger.error(`❌ Recruiter ${req.user.username} has no company_id`);
          return res.status(403).json({
            success: false,
            message: 'Tài khoản recruiter chưa được gán vào công ty'
          });
        }
        
        if (question.company_id !== req.user.company_id) {
          await transaction.rollback();
          logger.warn(`🚫 UPDATE DENIED: Recruiter company_id=${req.user.company_id} tried to update question company_id=${question.company_id}`);
          return res.status(403).json({
            success: false,
            message: `Bạn không có quyền sửa câu hỏi này. Câu hỏi thuộc về công ty khác (Company ID: ${question.company_id}). Bạn chỉ có thể sửa câu hỏi của công ty mình (Company ID: ${req.user.company_id}).`,
            error_code: 'WRONG_COMPANY',
            details: {
              question_company: question.company_id,
              user_company: req.user.company_id
            }
          });
        }
      } else {
        // Other roles cannot update questions
        await transaction.rollback();
        logger.warn(`🚫 UPDATE DENIED: Role ${userRole} tried to update question`);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật câu hỏi'
        });
      }
      
      // Update question
      await question.update({
        question_title: question_title || question.question_title,
        question_text: question_text || question.question_text,
        question_type: question_type || question.question_type,
        difficulty_level: difficulty_level || question.difficulty_level,
        category_id: category_id !== undefined ? category_id : question.category_id,
        is_active: is_active !== undefined ? is_active : question.is_active,
        updated_at: new Date()
      }, { transaction });
      
      // Update options if provided
      if (options && ['MULTIPLE_CHOICE', 'SINGLE_CHOICE'].includes(question.question_type)) {
        // First delete existing options
        await QuestionOption.destroy({
          where: { question_id: questionId },
          transaction
        });
        
        // Create new options
        if (options.length > 0) {
          await Promise.all(options.map(option => {
            return QuestionOption.create({
              question_id: questionId,
              option_text: option.option_text,
              is_correct: option.is_correct || false
            }, { transaction });
          }));
        }
      }
      
      // Update coding template if provided
      if (coding_template && question.question_type === 'CODING') {
        // Check if template exists
        const existingTemplate = await CodingQuestionTemplate.findOne({
          where: { question_id: questionId }
        });
        
        if (existingTemplate) {
          // Update existing template
          await existingTemplate.update({
            programming_language: coding_template.programming_language || existingTemplate.programming_language,
            code_template: coding_template.code_template || existingTemplate.code_template,
            test_cases: coding_template.test_cases || existingTemplate.test_cases
          }, { transaction });
        } else {
          // Create new template
          await CodingQuestionTemplate.create({
            question_id: questionId,
            programming_language: coding_template.programming_language,
            code_template: coding_template.code_template,
            test_cases: coding_template.test_cases
          }, { transaction });
        }
      }
      
      // Commit transaction
      await transaction.commit();
      
      // Get the updated question with all details
      const updatedQuestion = await Question.findByPk(questionId, {
        include: [
          {
            model: QuestionCategory,
            attributes: ['category_id', 'category_name']
          },
          {
            model: QuestionOption,
            as: 'QuestionOptions',
            attributes: ['option_id', 'option_text', 'is_correct']
          },
          {
            model: CodingQuestionTemplate,
            attributes: ['template_id', 'programming_language', 'code_template', 'test_cases']
          }
        ]
      });
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật câu hỏi thành công',
        data: updatedQuestion
      });
      
    } catch (error) {
      // Rollback transaction in case of error, only if not finished
      if (transaction.finished !== 'commit' && transaction.finished !== 'rollback') {
        await transaction.rollback();
      }
      logger.error(`Update question error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật câu hỏi' });
    }
  },
  
  /**
   * Delete question
   */
  deleteQuestion: async (req, res) => {
    try {
      const questionId = req.params.id;
      
      // Check if question exists
      const question = await Question.findByPk(questionId);
      
      if (!question) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi' });
      }
      
      // 🔒 COMPANY CHECK - Recruiter chỉ xóa được câu hỏi của công ty mình
      const userRole = req.user?.Role?.role_name?.toUpperCase() || req.user?.role?.toUpperCase();
      if (userRole === 'RECRUITER' && question.company_id !== req.user.company_id) {
        console.log(`🚫 DELETE DENIED: Recruiter company_id=${req.user.company_id} tried to delete question company_id=${question.company_id}`);
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa câu hỏi này'
        });
      }
      
      // Delete question (options and coding templates will be cascade deleted)
      await question.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Xóa câu hỏi thành công'
      });
      
    } catch (error) {
      logger.error(`Delete question error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xóa câu hỏi' });
    }
  },
  
  /**
   * Get all question categories
   */
  getAllCategories: async (req, res) => {
    try {
      const categories = await QuestionCategory.findAll({
        order: [['category_name', 'ASC']]
      });
      
      return res.status(200).json({
        success: true,
        data: categories
      });
      
    } catch (error) {
      logger.error(`Get all categories error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy danh sách danh mục' });
    }
  },
  
  /**
   * Create new category
   */
  createCategory: async (req, res) => {
    try {
      const { category_name, description } = req.body;
      
      // Validate input
      if (!category_name) {
        return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
      }
      
      // Check if category exists
      const existingCategory = await QuestionCategory.findOne({
        where: { category_name }
      });
      
      if (existingCategory) {
        return res.status(400).json({ success: false, message: 'Danh mục đã tồn tại' });
      }
      
      // Create category
      const newCategory = await QuestionCategory.create({
        category_name,
        description,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      return res.status(201).json({
        success: true,
        message: 'Tạo danh mục mới thành công',
        data: newCategory
      });
      
    } catch (error) {
      logger.error(`Create category error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi tạo danh mục mới' });
    }
  },
  
  /**
   * Update category
   */
  updateCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;
      const { category_name, description } = req.body;
      
      // Find category
      const category = await QuestionCategory.findByPk(categoryId);
      
      if (!category) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
      }
      
      // Check if name is being changed and already exists
      if (category_name && category_name !== category.category_name) {
        const existingCategory = await QuestionCategory.findOne({
          where: { category_name }
        });
        
        if (existingCategory) {
          return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại' });
        }
      }
      
      // Update category
      await category.update({
        category_name: category_name || category.category_name,
        description: description !== undefined ? description : category.description,
        updated_at: new Date()
      });
      
      return res.status(200).json({
        success: true,
        message: 'Cập nhật danh mục thành công',
        data: category
      });
      
    } catch (error) {
      logger.error(`Update category error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi cập nhật danh mục' });
    }
  },
  
  /**
   * Delete category
   */
  deleteCategory: async (req, res) => {
    try {
      const categoryId = req.params.id;
      
      // Check if category exists
      const category = await QuestionCategory.findByPk(categoryId);
      
      if (!category) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
      }
      
      // Check if category is being used by any questions
      const questionCount = await Question.count({
        where: { category_id: categoryId }
      });
      
      if (questionCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa danh mục đang được sử dụng bởi các câu hỏi'
        });
      }
      
      // Delete category
      await category.destroy();
      
      return res.status(200).json({
        success: true,
        message: 'Xóa danh mục thành công'
      });
      
    } catch (error) {
      logger.error(`Delete category error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi xóa danh mục' });
    }
  }
};

module.exports = questionController;
