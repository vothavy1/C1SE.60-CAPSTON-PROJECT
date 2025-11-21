const { Test, Question, TestQuestion, QuestionOption, User, sequelize } = require('../models');
const logger = require('../utils/logger');

const testController = {
  // Lấy danh sách câu hỏi của một bài test
  getTestQuestions: async (req, res) => {
    try {
      const testId = req.params.id;
      // Lấy danh sách test-question
      const testQuestions = await TestQuestion.findAll({
        where: { test_id: testId },
        order: [['question_order', 'ASC']]
      });
      
      if (!testQuestions || testQuestions.length === 0) {
        return res.json({ questions: [] });
      }
      
      const questionIds = testQuestions.map(q => q.question_id);
      // Lấy chi tiết câu hỏi và đáp án
      const questions = await Question.findAll({
        where: { question_id: questionIds },
        include: [{
          model: QuestionOption,
          as: 'QuestionOptions'
        }]
      });
      
      res.json({ questions });
    } catch (error) {
      logger.error(`Get test questions error: ${error.message}`);
      res.status(500).json({ message: 'Lỗi lấy câu hỏi của bài test', error: error.message });
    }
  },

  // Lấy danh sách tất cả bài test
  getAllTests: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 100,
        search,
        isActive
      } = req.query;

      const offset = (page - 1) * limit;
      const whereConditions = {};
      if (isActive !== undefined) whereConditions.is_active = isActive === 'true';
      if (search) {
        whereConditions[sequelize.Op.or] = [
          { test_name: { [sequelize.Op.like]: `%${search}%` } },
          { description: { [sequelize.Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows: tests } = await Test.findAndCountAll({
        where: whereConditions,
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: [
          'test_id',
          'test_name',
          'description',
          'duration_minutes',
          'difficulty_level',
          'status',
          'passing_score',
          'is_active',
          'created_by',
          'created_at',
          'updated_at'
        ],
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      return res.status(200).json({
        success: true,
        data: {
          tests,
          pagination: {
            total: count,
            totalPages,
            currentPage: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      logger.error(`Get all tests error: ${error.message}`);
      return res.status(500).json({ success: false, message: 'Đã xảy ra lỗi khi lấy danh sách bài test' });
    }
  },

  // Tạo bài test mới
  createTest: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { test_name, description, duration_minutes, difficulty_level, status, created_by, questions } = req.body;
      if (!test_name || !description || !duration_minutes || !difficulty_level || !status || !created_by || !Array.isArray(questions)) {
        await t.rollback();
        return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
      }

      // Tạo bài test
      const newTest = await Test.create({
        test_name,
        description,
        duration_minutes,
        difficulty_level,
        status,
        created_by
      }, { transaction: t });

      // Tạo câu hỏi và liên kết với test
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        // Tạo câu hỏi
        const question = await Question.create({
          question_text: q.question_text,
          question_type: q.question_type,
          difficulty_level: q.difficulty_level,
          created_by,
        }, { transaction: t });

        // Nếu có options thì tạo các option
        if (Array.isArray(q.options) && q.options.length > 0) {
          for (let j = 0; j < q.options.length; j++) {
            await QuestionOption.create({
              question_id: question.question_id,
              option_text: q.options[j],
              is_correct: q.correct_option === j
            }, { transaction: t });
          }
        }

        // Tạo bản ghi test_questions
        await TestQuestion.create({
          test_id: newTest.test_id,
          question_id: question.question_id,
          question_order: i + 1,
          score_weight: q.score_weight || 1
        }, { transaction: t });
      }

      await t.commit();
      return res.status(201).json({ message: 'Tạo bài test thành công', test_id: newTest.test_id });
    } catch (error) {
      await t.rollback();
      logger.error(`Create test error: ${error.message}`);
      return res.status(500).json({ message: 'Lỗi tạo bài test', error: error.message });
    }
  },

  // ... các method khác giữ nguyên từ file cũ
};

module.exports = testController;
