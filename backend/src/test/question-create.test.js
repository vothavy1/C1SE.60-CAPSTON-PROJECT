const request = require('supertest');
const app = require('../server');

describe('API - Thêm câu hỏi mới', () => {
  let token;

  beforeAll(async () => {
    // Đăng nhập lấy token (sử dụng tài khoản test có quyền recruiter hoặc admin)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    token = res.body.token;
  });

  it('Thêm câu hỏi mới trắc nghiệm thành công', async () => {
    const payload = {
      question_title: 'FPT Shop',
      question_text: 'Đâu là thương hiệu laptop nổi tiếng?',
      question_type: 'MULTIPLE_CHOICE',
      difficulty_level: 'EASY',
      options: [
        { option_text: 'Dell', is_correct: true },
        { option_text: 'Asus', is_correct: false },
        { option_text: 'HP', is_correct: false }
      ]
    };
    const res = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.question_title).toBe('FPT Shop');
    expect(res.body.data.question_text).toBe(payload.question_text);
    expect(res.body.data.QuestionOptions.length).toBe(3);
  });
});
