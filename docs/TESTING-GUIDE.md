# Hướng Dẫn Test Hệ Thống Candidate Test

## 🎯 Luồng Hoàn Chỉnh

### 1. Ứng Viên Bắt Đầu Làm Bài
```
exam.html (Danh sách đề thi)
    ↓ User click "Làm bài thi"
    ↓ POST /api/candidate-tests/assign
    ↓ Tạo record trong candidate_tests
    ↓ Status: ASSIGNED
    ↓
test.html?testId=X&candidateTestId=Y
    ↓ Load câu hỏi từ /api/tests/X/questions
    ↓ User bật camera
    ↓ POST /api/candidate-tests/Y/start
    ↓ Status: IN_PROGRESS, ghi start_time
```

### 2. Ứng Viên Làm Bài
```
test.html
    ↓ User trả lời từng câu
    ↓ POST /api/candidate-tests/Y/answer (cho mỗi câu)
    ↓ Lưu vào candidate_test_answers
    ↓ Tự động chấm câu multiple choice
```

### 3. Nộp Bài
```
test.html
    ↓ User click "Nộp bài"
    ↓ POST /api/candidate-tests/Y/complete
    ↓ Tính điểm tổng
    ↓ Lưu vào candidate_test_results
    ↓ Status: COMPLETED
    ↓
Hiển thị kết quả ngay lập tức
```

### 4. Xem Lại Kết Quả
```
my-tests.html
    ↓ GET /api/candidate-tests/my-tests
    ↓ Hiển thị danh sách
    ↓ Click "Xem kết quả"
    ↓
test-result.html?id=Y
    ↓ GET /api/candidate-tests/Y/details
    ↓ Hiển thị chi tiết câu trả lời
```

## 📊 Database Flow

### Khi Assign Test
```sql
INSERT INTO candidate_tests (
    candidate_id,
    test_id,
    status,
    created_at
) VALUES (
    1,  -- ID của candidate
    5,  -- ID của test
    'ASSIGNED',
    NOW()
);
-- Trả về candidate_test_id = 10
```

### Khi Start Test
```sql
UPDATE candidate_tests 
SET 
    status = 'IN_PROGRESS',
    start_time = NOW(),
    end_time = DATE_ADD(NOW(), INTERVAL 90 MINUTE)  -- based on test duration
WHERE candidate_test_id = 10;
```

### Khi Submit Answer
```sql
INSERT INTO candidate_test_answers (
    candidate_test_id,
    question_id,
    selected_option_id,
    is_correct,  -- Tự động xác định cho multiple choice
    submitted_at
) VALUES (
    10,  -- candidate_test_id
    25,  -- question_id
    101, -- option_id
    TRUE,  -- Nếu option có is_correct=true
    NOW()
);
```

### Khi Complete Test
```sql
-- 1. Update candidate_tests
UPDATE candidate_tests 
SET 
    status = 'COMPLETED',
    score = 85,  -- Calculated
    end_time = NOW()
WHERE candidate_test_id = 10;

-- 2. Insert result
INSERT INTO candidate_test_results (
    candidate_test_id,
    total_score,
    max_possible_score,
    percentage,
    passed,
    created_at
) VALUES (
    10,
    85,
    100,
    85.00,
    TRUE,  -- if >= passing_score
    NOW()
);
```

## 🧪 Test Scenarios

### Scenario 1: Test Thành Công
```bash
1. Login as candidate
   URL: http://localhost:8080/login.html
   
2. Vào trang danh sách test
   URL: http://localhost:8080/exam.html
   
3. Click "Làm bài thi"
   → Tạo candidate_test mới
   → Redirect to test.html?testId=X&candidateTestId=Y
   
4. Bật camera và làm bài
   → Status chuyển IN_PROGRESS
   → Mỗi câu trả lời lưu vào candidate_test_answers
   
5. Nộp bài
   → Tính điểm
   → Lưu vào candidate_test_results
   → Hiển thị kết quả
   
6. Xem lại kết quả
   → Vào my-tests.html
   → Click "Xem kết quả"
```

### Scenario 2: Kiểm Tra Database
```sql
-- Xem candidate_tests
SELECT 
    ct.candidate_test_id,
    ct.status,
    ct.score,
    ct.start_time,
    ct.end_time,
    t.test_name,
    CONCAT(c.first_name, ' ', c.last_name) as candidate_name
FROM candidate_tests ct
JOIN tests t ON ct.test_id = t.test_id
JOIN candidates c ON ct.candidate_id = c.candidate_id
ORDER BY ct.created_at DESC
LIMIT 10;

-- Xem câu trả lời của 1 bài test
SELECT 
    cta.answer_id,
    q.question_text,
    qo.option_text as selected_answer,
    cta.is_correct,
    cta.submitted_at
FROM candidate_test_answers cta
JOIN questions q ON cta.question_id = q.question_id
LEFT JOIN question_options qo ON cta.selected_option_id = qo.option_id
WHERE cta.candidate_test_id = 1
ORDER BY cta.answer_id;

-- Xem kết quả
SELECT 
    ctr.*,
    ct.score as test_score,
    ct.status
FROM candidate_test_results ctr
JOIN candidate_tests ct ON ctr.candidate_test_id = ct.candidate_test_id
WHERE ctr.candidate_test_id = 1;
```

## 🐛 Troubleshooting

### Lỗi: "Candidate profile not found"
**Nguyên nhân**: User chưa có record trong bảng `candidates`

**Giải pháp**:
```sql
-- Kiểm tra user_id
SELECT * FROM users WHERE email = 'your_email@example.com';

-- Tạo candidate record
INSERT INTO candidates (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    status,
    created_at
) VALUES (
    1,  -- user_id from above
    'Nguyen',
    'Van A',
    'a@example.com',
    '0123456789',
    'ACTIVE',
    NOW()
);
```

### Lỗi: "Test not found or not in progress"
**Nguyên nhân**: candidate_test_id không tồn tại hoặc status sai

**Giải pháp**:
```sql
-- Kiểm tra status
SELECT candidate_test_id, status, start_time, end_time
FROM candidate_tests
WHERE candidate_test_id = X;

-- Nếu bị stuck, reset status
UPDATE candidate_tests 
SET status = 'IN_PROGRESS', 
    start_time = NOW(),
    end_time = DATE_ADD(NOW(), INTERVAL 90 MINUTE)
WHERE candidate_test_id = X;
```

### Lỗi: Không lưu được kết quả
**Nguyên nhân**: Lỗi transaction hoặc thiếu dữ liệu

**Kiểm tra**:
```sql
-- 1. Xem có answers không
SELECT COUNT(*) FROM candidate_test_answers 
WHERE candidate_test_id = X;

-- 2. Xem có questions không
SELECT COUNT(*) FROM test_questions 
WHERE test_id = Y;

-- 3. Xem log backend
tail -f backend/logs/app.log
```

## ✅ Checklist Before Testing

- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 8080)
- [ ] MySQL database running
- [ ] User đã đăng nhập với role CANDIDATE
- [ ] User có record trong bảng `candidates`
- [ ] Test có câu hỏi (bảng `test_questions`)
- [ ] Questions có options (bảng `question_options`)
- [ ] Token JWT còn hạn

## 📝 Expected Data After Complete Flow

### candidate_tests
```
candidate_test_id: 1
candidate_id: 1
test_id: 5
status: COMPLETED
score: 85
start_time: 2025-11-02 10:00:00
end_time: 2025-11-02 11:30:00
created_at: 2025-11-02 09:00:00
```

### candidate_test_answers (10 câu)
```
answer_id | candidate_test_id | question_id | selected_option_id | is_correct
1         | 1                 | 10          | 41                 | TRUE
2         | 1                 | 11          | 45                 | FALSE
3         | 1                 | 12          | 49                 | TRUE
...
```

### candidate_test_results
```
result_id: 1
candidate_test_id: 1
total_score: 85
max_possible_score: 100
percentage: 85.00
passed: TRUE
created_at: 2025-11-02 11:30:00
```

## 🚀 Quick Test Commands

```bash
# 1. Start services
cd "d:\CAPSTON C1SE.60\CS.60"
.\start-all.ps1

# 2. Check if services are running
curl http://localhost:5000/api/tests
curl http://localhost:8080

# 3. Open browser
start http://localhost:8080/login.html

# 4. After completing test, check database
mysql -u root -p cs60_recruitment
SELECT * FROM candidate_tests ORDER BY created_at DESC LIMIT 1;
SELECT * FROM candidate_test_answers WHERE candidate_test_id = LAST_INSERT_ID();
SELECT * FROM candidate_test_results WHERE candidate_test_id = LAST_INSERT_ID();
```

## 📚 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | /api/candidate-tests/assign | Tạo candidate_test | Yes |
| POST | /api/candidate-tests/:id/start | Bắt đầu làm bài | No |
| POST | /api/candidate-tests/:id/answer | Submit câu trả lời | No |
| POST | /api/candidate-tests/:id/complete | Nộp bài | No |
| GET | /api/candidate-tests/my-tests | Danh sách bài test | Yes |
| GET | /api/candidate-tests/:id/details | Chi tiết kết quả | Yes |

## 🎓 User Flow Diagram

```
[Login] → [exam.html] → [Click Test] → [Assign API]
                                           ↓
                                    [candidate_tests created]
                                           ↓
                        [test.html?candidateTestId=X]
                                           ↓
                                    [Start API]
                                           ↓
                              [Status = IN_PROGRESS]
                                           ↓
                            [Answer each question]
                                           ↓
                             [Submit Answer API]
                                           ↓
                      [candidate_test_answers created]
                                           ↓
                              [Complete Test]
                                           ↓
                              [Complete API]
                                           ↓
                   [candidate_test_results created]
                                           ↓
                          [Show Result Screen]
                                           ↓
                         [Go to my-tests.html]
                                           ↓
                        [View Detailed Results]
```

## 🔍 Debug Tips

1. **Check console logs**: Mở F12 → Console để xem logs
2. **Check network**: F12 → Network → XHR để xem API calls
3. **Check backend logs**: `backend/logs/app.log`
4. **Check database**: SQL queries above
5. **Check localStorage**: F12 → Application → Local Storage
