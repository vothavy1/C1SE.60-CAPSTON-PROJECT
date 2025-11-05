const request = require('supertest');
const app = require('../server');
const { sequelize, Question, QuestionOption } = require('../models');

describe('API: Create Question with Options', () => {
  let token;
  beforeAll(async () => {
    await sequelize.sync({ force: false });
    // Đăng nhập để lấy JWT token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' }); // Thay bằng tài khoản hợp lệ
    expect(loginRes.statusCode).toBe(200);
    token = loginRes.body.token;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a MULTIPLE_CHOICE question and save options', async () => {
  // Token đã lấy ở beforeAll
    const payload = {
      question_title: 'Test Question',
      question_text: 'What is 2 + 2?',
      question_type: 'MULTIPLE_CHOICE',
      difficulty_level: 'EASY',
      options: [
        { option_text: '3', is_correct: false },
        { option_text: '4', is_correct: true },
        { option_text: '5', is_correct: false }
      ]
    };
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    // Kiểm tra đáp án đã lưu vào DB
    const questionId = res.body.data.question_id;
    const options = await QuestionOption.findAll({ where: { question_id: questionId } });
    expect(options.length).toBe(3);
    expect(options.some(opt => opt.option_text === '4' && opt.is_correct)).toBe(true);
  });
});
