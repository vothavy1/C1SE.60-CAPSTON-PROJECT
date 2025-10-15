const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Validation rules for authentication
const loginValidation = [
  body('username').notEmpty().withMessage('Tên đăng nhập là bắt buộc'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  validate
];

const registerValidation = [
  body('username')
    .notEmpty().withMessage('Tên đăng nhập là bắt buộc')
    .isLength({ min: 3 }).withMessage('Tên đăng nhập phải có ít nhất 3 ký tự'),
  body('email')
    .notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('full_name').notEmpty().withMessage('Họ tên là bắt buộc'),
  validate
];

// Validation rules for user management
const createUserValidation = [
  body('username')
    .notEmpty().withMessage('Tên đăng nhập là bắt buộc')
    .isLength({ min: 3 }).withMessage('Tên đăng nhập phải có ít nhất 3 ký tự'),
  body('email')
    .notEmpty().withMessage('Email là bắt buộc')
    .isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .notEmpty().withMessage('Mật khẩu là bắt buộc')
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('full_name').notEmpty().withMessage('Họ tên là bắt buộc'),
  body('role_id').notEmpty().withMessage('Vai trò là bắt buộc'),
  validate
];

const updateUserValidation = [
  param('id').isInt().withMessage('ID người dùng không hợp lệ'),
  body('email')
    .optional()
    .isEmail().withMessage('Email không hợp lệ'),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  validate
];

// Validation rules for questions
const createQuestionValidation = [
  body('question_text').notEmpty().withMessage('Nội dung câu hỏi là bắt buộc'),
  body('question_type')
    .notEmpty().withMessage('Loại câu hỏi là bắt buộc')
    .isIn(['MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TEXT', 'CODING']).withMessage('Loại câu hỏi không hợp lệ'),
  body('difficulty_level')
    .notEmpty().withMessage('Mức độ khó là bắt buộc')
    .isIn(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).withMessage('Mức độ khó không hợp lệ'),
  body('options')
    .custom((value, { req }) => {
      if (['MULTIPLE_CHOICE', 'SINGLE_CHOICE'].includes(req.body.question_type)) {
        if (!Array.isArray(value) || value.length < 2) {
          throw new Error('Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn');
        }
        
        // For SINGLE_CHOICE, ensure exactly one correct answer
        if (req.body.question_type === 'SINGLE_CHOICE') {
          const correctCount = value.filter(opt => opt.is_correct).length;
          if (correctCount !== 1) {
            throw new Error('Câu hỏi trắc nghiệm một đáp án phải có đúng 1 đáp án đúng');
          }
        }
        
        // For MULTIPLE_CHOICE, ensure at least one correct answer
        if (req.body.question_type === 'MULTIPLE_CHOICE') {
          const correctCount = value.filter(opt => opt.is_correct).length;
          if (correctCount < 1) {
            throw new Error('Câu hỏi trắc nghiệm nhiều đáp án phải có ít nhất 1 đáp án đúng');
          }
        }
      }
      return true;
    }),
  validate
];

// Validation rules for candidate management
const validateCreateCandidate = [
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  validate
];

const validateUpdateCandidate = [
  param('id').isInt().withMessage('Invalid candidate ID'),
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format'),
  validate
];

// Validation rules for job positions
const validateCreateJobPosition = [
  body('title').notEmpty().withMessage('Job title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  validate
];

const validateUpdateJobPosition = [
  param('id').isInt().withMessage('Invalid job position ID'),
  validate
];

// Validation rules for job applications
const validateCreateJobApplication = [
  body('candidate_id').isInt().withMessage('Candidate ID is required and must be an integer'),
  body('position_id').isInt().withMessage('Position ID is required and must be an integer'),
  body('status')
    .optional()
    .isIn(['APPLIED', 'SCREENING', 'TESTING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED'])
    .withMessage('Invalid application status'),
  validate
];

const validateUpdateApplicationStatus = [
  param('id').isInt().withMessage('Invalid application ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['APPLIED', 'SCREENING', 'TESTING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED'])
    .withMessage('Invalid application status'),
  validate
];

// Validation rules for interviews
const validateScheduleInterview = [
  body('application_id').isInt().withMessage('Application ID is required and must be an integer'),
  body('interview_type')
    .notEmpty().withMessage('Interview type is required')
    .isIn(['PHONE', 'TECHNICAL', 'HR', 'FINAL']).withMessage('Invalid interview type'),
  body('scheduled_date')
    .notEmpty().withMessage('Scheduled date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('duration_minutes').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  validate
];

const validateUpdateInterview = [
  param('id').isInt().withMessage('Invalid interview ID'),
  body('status')
    .optional()
    .isIn(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).withMessage('Invalid interview status'),
  validate
];

const validateAddParticipants = [
  param('id').isInt().withMessage('Invalid interview ID'),
  body('participants')
    .isArray().withMessage('Participants must be an array')
    .notEmpty().withMessage('At least one participant is required'),
  body('participants.*.user_id').isInt().withMessage('User ID must be an integer'),
  body('participants.*.role')
    .isIn(['INTERVIEWER', 'OBSERVER', 'HR']).withMessage('Invalid participant role'),
  validate
];

const validateInterviewFeedback = [
  param('id').isInt().withMessage('Invalid interview ID'),
  body('overall_rating')
    .isInt({ min: 1, max: 5 }).withMessage('Overall rating must be between 1 and 5'),
  body('recommendation')
    .notEmpty().withMessage('Recommendation is required')
    .isIn(['STRONG_HIRE', 'HIRE', 'NEUTRAL', 'NO_HIRE', 'STRONG_NO_HIRE'])
    .withMessage('Invalid recommendation'),
  validate
];

// Validation rules for candidate tests
const validateAssignTest = [
  body('candidate_id').isInt().withMessage('Candidate ID is required and must be an integer'),
  body('test_id').isInt().withMessage('Test ID is required and must be an integer'),
  validate
];

const validateStartTest = [
  param('id').isInt().withMessage('Invalid candidate test ID'),
  validate
];

const validateSubmitAnswer = [
  param('id').isInt().withMessage('Invalid candidate test ID'),
  body('question_id').isInt().withMessage('Question ID is required and must be an integer'),
  validate
];

const validateFraudEvent = [
  param('id').isInt().withMessage('Invalid candidate test ID'),
  body('event_type')
    .notEmpty().withMessage('Event type is required')
    .isIn(['TAB_SWITCH', 'COPY_PASTE', 'MULTIPLE_WINDOWS', 'SCREENSHOT', 'OTHER'])
    .withMessage('Invalid event type'),
  validate
];

const validateReviewTest = [
  param('id').isInt().withMessage('Invalid candidate test ID'),
  body('answers')
    .optional()
    .isArray().withMessage('Answers must be an array'),
  validate
];

// Export validation middleware
module.exports = {
  loginValidation,
  registerValidation,
  createUserValidation,
  updateUserValidation,
  createQuestionValidation,
  validateCreateCandidate,
  validateUpdateCandidate,
  validateCreateJobPosition,
  validateUpdateJobPosition,
  validateCreateJobApplication,
  validateUpdateApplicationStatus,
  validateScheduleInterview,
  validateUpdateInterview,
  validateAddParticipants,
  validateInterviewFeedback,
  validateAssignTest,
  validateStartTest,
  validateSubmitAnswer,
  validateFraudEvent,
  validateReviewTest
};
