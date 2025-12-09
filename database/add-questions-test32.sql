-- Tạo câu hỏi mẫu cho company 3 (Digital) - test 32
USE cs60_recruitment;

-- Tạo câu hỏi
INSERT INTO questions (question_title, question_text, question_type, difficulty_level, category_id, company_id, created_by, is_active)
VALUES 
('Câu 1: HTML', 'HTML là viết tắt của gì?', 'SINGLE_CHOICE', 'EASY', 1, 3, 35, 1),
('Câu 2: CSS', 'CSS dùng để làm gì?', 'SINGLE_CHOICE', 'EASY', 1, 3, 35, 1),
('Câu 3: JavaScript', 'JavaScript là ngôn ngữ gì?', 'SINGLE_CHOICE', 'EASY', 1, 3, 35, 1);

-- Lấy IDs
SET @q1 = LAST_INSERT_ID();
SET @q2 = @q1 + 1;
SET @q3 = @q1 + 2;

-- Options câu 1
INSERT INTO question_options (question_id, option_text, is_correct)
VALUES 
(@q1, 'HyperText Markup Language', 1),
(@q1, 'High Technology Modern Language', 0),
(@q1, 'Home Tool Markup Language', 0);

-- Options câu 2
INSERT INTO question_options (question_id, option_text, is_correct)
VALUES 
(@q2, 'Cascading Style Sheets', 1),
(@q2, 'Computer Style Sheets', 0),
(@q2, 'Creative Style Sheets', 0);

-- Options câu 3
INSERT INTO question_options (question_id, option_text, is_correct)
VALUES 
(@q3, 'Ngôn ngữ lập trình phía client', 1),
(@q3, 'Ngôn ngữ đánh dấu', 0),
(@q3, 'Hệ quản trị cơ sở dữ liệu', 0);

-- Thêm vào test 32
INSERT INTO test_questions (test_id, question_id, question_order, score_weight)
VALUES 
(32, @q1, 1, 1),
(32, @q2, 2, 1),
(32, @q3, 3, 1);

SELECT 'Done! Test 32 now has 3 questions' AS result;
