-- Tạo câu hỏi mẫu cho company 3 (Digital)
INSERT INTO questions (question_text, question_type, difficulty_level, category_id, company_id, created_by, is_active)
VALUES 
('HTML là viết tắt của gì?', 'SINGLE_CHOICE', 'EASY', 1, 3, 35, 1),
('CSS dùng để làm gì?', 'SINGLE_CHOICE', 'EASY', 1, 3, 35, 1),
('JavaScript là ngôn ngữ gì?', 'SINGLE_CHOICE', 'EASY', 1, 3, 35, 1);

-- Lấy IDs của câu hỏi vừa tạo
SET @q1 = (SELECT question_id FROM questions WHERE question_text = 'HTML là viết tắt của gì?' AND company_id = 3 ORDER BY created_at DESC LIMIT 1);
SET @q2 = (SELECT question_id FROM questions WHERE question_text = 'CSS dùng để làm gì?' AND company_id = 3 ORDER BY created_at DESC LIMIT 1);
SET @q3 = (SELECT question_id FROM questions WHERE question_text = 'JavaScript là ngôn ngữ gì?' AND company_id = 3 ORDER BY created_at DESC LIMIT 1);

-- Thêm options cho câu 1
INSERT INTO question_options (question_id, option_text, is_correct)
VALUES 
(@q1, 'HyperText Markup Language', 1),
(@q1, 'High Technology Modern Language', 0),
(@q1, 'Home Tool Markup Language', 0),
(@q1, 'Hyperlinks and Text Markup Language', 0);

-- Thêm options cho câu 2
INSERT INTO question_options (question_id, option_text, is_correct)
VALUES 
(@q2, 'Cascading Style Sheets', 1),
(@q2, 'Computer Style Sheets', 0),
(@q2, 'Creative Style Sheets', 0),
(@q2, 'Colorful Style Sheets', 0);

-- Thêm options cho câu 3
INSERT INTO question_options (question_id, option_text, is_correct)
VALUES 
(@q3, 'Ngôn ngữ lập trình phía client', 1),
(@q3, 'Ngôn ngữ đánh dấu', 0),
(@q3, 'Hệ quản trị cơ sở dữ liệu', 0),
(@q3, 'Ngôn ngữ truy vấn', 0);

-- Thêm câu hỏi vào test 32
INSERT INTO test_questions (test_id, question_id, question_order, score_weight)
VALUES 
(32, @q1, 1, 1),
(32, @q2, 2, 1),
(32, @q3, 3, 1);

SELECT 'Questions added to test 32 successfully!' AS result;
