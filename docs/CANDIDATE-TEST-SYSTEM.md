# Hệ Thống Quản Lý Bài Test Ứng Viên

## 📊 Tổng Quan Hệ Thống

Hệ thống quản lý đầy đủ quy trình làm bài test của ứng viên, từ giao test, làm bài, đến xem kết quả chi tiết.

## 🗄️ Cấu Trúc Database

### 1. Bảng `candidate_tests` - Quản lý bài test được giao
```sql
CREATE TABLE candidate_tests (
    candidate_test_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,                    -- FK -> candidates
    test_id INT NOT NULL,                         -- FK -> tests
    application_id INT,                           -- FK -> candidate_job_applications
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    status ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'),
    score INT,
    passing_status ENUM('PASSED', 'FAILED', 'PENDING'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Mục đích**: Lưu thông tin về việc giao bài test cho ứng viên
- Mỗi bản ghi = 1 lần ứng viên được giao làm 1 bài test
- Tracking thời gian bắt đầu, kết thúc, trạng thái

### 2. Bảng `candidate_test_answers` - Câu trả lời chi tiết
```sql
CREATE TABLE candidate_test_answers (
    answer_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_test_id INT NOT NULL,               -- FK -> candidate_tests
    question_id INT NOT NULL,                     -- FK -> questions
    selected_options VARCHAR(255),                -- Option IDs (cho multi-choice)
    text_answer TEXT,                             -- Text answer (cho câu tự luận)
    code_answer TEXT,                             -- Code (cho câu coding)
    is_correct BOOLEAN DEFAULT FALSE,
    score_earned DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Mục đích**: Lưu câu trả lời của ứng viên cho từng câu hỏi
- Mỗi bản ghi = 1 câu trả lời cho 1 câu hỏi
- Hỗ trợ nhiều loại câu hỏi: multiple choice, text, coding
- Lưu kết quả chấm (đúng/sai, điểm)

### 3. Bảng `candidate_test_results` - Kết quả tổng hợp
```sql
CREATE TABLE candidate_test_results (
    result_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_test_id INT UNIQUE,                 -- FK -> candidate_tests
    total_score INT NOT NULL,
    max_possible_score INT NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    strength_areas TEXT,                          -- Điểm mạnh
    improvement_areas TEXT,                       -- Cần cải thiện
    feedback TEXT,                                -- Nhận xét
    reviewed_by INT,                              -- FK -> users (người chấm)
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Mục đích**: Tổng hợp kết quả sau khi chấm bài
- Mỗi candidate_test chỉ có 1 result (UNIQUE constraint)
- Lưu điểm tổng, tỷ lệ %, đạt/không đạt
- Feedback chi tiết từ reviewer

## 🔗 Mối Quan Hệ Database

```
candidates (1) ──────> (*) candidate_tests
                              │
                              ├─> (1) candidate_test_results
                              │
                              └─> (*) candidate_test_answers
                                         │
                                         └─> (1) questions
                                                    │
                                                    └─> (*) question_options

tests (1) ──────> (*) candidate_tests
```

## 🌐 Backend API Endpoints

### 1. Lấy Danh Sách Bài Test (My Tests)
```
GET /api/candidate-tests/my-tests
```

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "candidate_test_id": 1,
      "test_id": 5,
      "status": "COMPLETED",
      "score": 85,
      "start_time": "2025-11-01T10:00:00Z",
      "end_time": "2025-11-01T11:30:00Z",
      "created_at": "2025-11-01T09:00:00Z",
      "Test": {
        "test_id": 5,
        "test_name": "JavaScript Fundamentals",
        "description": "Test kiến thức JavaScript cơ bản",
        "duration_minutes": 90,
        "passing_score": 60
      },
      "CandidateTestResult": {
        "total_score": 85,
        "percentage": 85.00,
        "passed": true,
        "reviewed_at": "2025-11-01T12:00:00Z"
      }
    }
  ]
}
```

**Database Query**:
- Table: `candidate_tests`
- JOIN: `tests`, `candidate_test_results`
- WHERE: `candidate_id` = current user's candidate_id
- ORDER BY: `created_at DESC`

### 2. Xem Chi Tiết Bài Test
```
GET /api/candidate-tests/:id/details
```

**Authentication**: Required (JWT token)

**Response**:
```json
{
  "success": true,
  "data": {
    "candidate_test_id": 1,
    "status": "COMPLETED",
    "score": 85,
    "start_time": "2025-11-01T10:00:00Z",
    "end_time": "2025-11-01T11:30:00Z",
    "test": {
      "test_id": 5,
      "test_name": "JavaScript Fundamentals",
      "description": "Test kiến thức JavaScript cơ bản",
      "passing_score": 60
    },
    "result": {
      "total_score": 85,
      "percentage": 85.00,
      "passed": true,
      "strength_areas": "Hiểu rõ về async/await, promises",
      "improvement_areas": "Cần ôn lại về closures",
      "feedback": "Làm bài tốt, tiếp tục phát huy",
      "reviewed_at": "2025-11-01T12:00:00Z"
    },
    "answers": [
      {
        "answer_id": 1,
        "question": {
          "question_id": 10,
          "question_text": "What is a closure in JavaScript?",
          "question_type": "MULTIPLE_CHOICE",
          "QuestionOptions": [
            {
              "option_id": 1,
              "option_text": "A function with access to outer scope",
              "is_correct": true
            },
            {
              "option_id": 2,
              "option_text": "A way to close browser windows",
              "is_correct": false
            }
          ]
        },
        "selected_option_id": 1,
        "text_answer": null,
        "is_correct": true,
        "answered_at": "2025-11-01T10:15:00Z"
      }
    ]
  }
}
```

**Database Query**:
- Table: `candidate_tests`
- JOIN: `tests`, `candidate_test_answers`, `questions`, `question_options`, `candidate_test_results`
- WHERE: `candidate_test_id` = :id AND `candidate_id` = current user's candidate_id

## 💻 Frontend Pages

### 1. my-tests.html - Danh Sách Bài Test
**File**: `frontend/my-tests.html`

**Chức năng**:
- Hiển thị tất cả bài test của ứng viên
- Filter theo trạng thái: ALL, ASSIGNED, IN_PROGRESS, COMPLETED
- Hiển thị điểm số, % đạt được
- Action buttons:
  - ASSIGNED: "Bắt đầu làm bài"
  - IN_PROGRESS: "Tiếp tục làm"
  - COMPLETED: "Xem kết quả"

**API Call**:
```javascript
fetch('http://localhost:5000/api/candidate-tests/my-tests', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**UI Components**:
- Filter tabs (All / Assigned / In Progress / Completed)
- Test cards với thông tin:
  - Tên bài test
  - Trạng thái
  - Thời gian
  - Điểm số (nếu đã hoàn thành)
  - Action button

### 2. test-result.html - Chi Tiết Kết Quả
**File**: `frontend/test-result.html`

**URL**: `test-result.html?id=<candidate_test_id>`

**Chức năng**:
- Hiển thị tổng quan kết quả (điểm, %, đạt/không đạt)
- Chi tiết từng câu hỏi:
  - Câu hỏi
  - Các lựa chọn (cho multiple choice)
  - Đáp án đã chọn (highlight)
  - Đáp án đúng (highlight)
  - Đúng/Sai icon
- Nhận xét từ reviewer:
  - Điểm mạnh (strength_areas)
  - Cần cải thiện (improvement_areas)
  - Feedback tổng quan
- Thống kê:
  - Tổng số câu
  - Số câu đã trả lời
  - Số câu đúng/sai
  - Số câu chờ chấm (cho câu tự luận)

**API Call**:
```javascript
fetch(`http://localhost:5000/api/candidate-tests/${testId}/details`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**UI Components**:
- Score summary (4 boxes: điểm số, %, điểm đạt, kết quả)
- Result badge (pass/fail với emoji)
- Feedback section
- Answer cards (mỗi câu 1 card):
  - Question text
  - Options với màu sắc:
    - Xanh: Đáp án đúng
    - Đỏ: Đáp án sai đã chọn
    - Xám: Không chọn
  - Icon ✅/❌
- Statistics section

## 🔄 Luồng Dữ Liệu (Data Flow)

### 1. Khi Ứng Viên Làm Bài Test

```
1. Recruiter giao test
   └─> INSERT INTO candidate_tests (status='ASSIGNED')

2. Candidate bắt đầu làm
   └─> UPDATE candidate_tests SET status='IN_PROGRESS', start_time=NOW()

3. Candidate trả lời câu hỏi
   └─> INSERT INTO candidate_test_answers (question_id, selected_option_id, ...)

4. Candidate nộp bài
   └─> UPDATE candidate_tests SET status='COMPLETED', end_time=NOW()
   └─> Tự động chấm câu multiple choice
   └─> INSERT INTO candidate_test_results (total_score, percentage, passed)

5. Reviewer chấm thủ công (nếu có câu tự luận)
   └─> UPDATE candidate_test_answers SET is_correct=true/false
   └─> UPDATE candidate_test_results SET feedback, strength_areas, ...
```

### 2. Khi Ứng Viên Xem Kết Quả

```
1. Truy cập my-tests.html
   └─> GET /api/candidate-tests/my-tests
   └─> Hiển thị danh sách từ candidate_tests + results

2. Click "Xem kết quả"
   └─> Redirect to test-result.html?id={candidate_test_id}
   └─> GET /api/candidate-tests/:id/details
   └─> Hiển thị:
       - Test info từ candidate_tests + tests
       - Answers từ candidate_test_answers + questions + options
       - Result từ candidate_test_results
```

## 🎨 Màu Sắc & Styling

### Status Colors
- **ASSIGNED**: Xanh dương (#3b82f6)
- **IN_PROGRESS**: Vàng (#f59e0b)
- **COMPLETED**: Xanh lá (#10b981)
- **EXPIRED**: Đỏ (#ef4444)

### Answer Colors
- **Correct Answer**: Xanh lá nhạt (#d1fae5), border #10b981
- **Wrong Answer**: Đỏ nhạt (#fee2e2), border #ef4444
- **Selected**: Xanh dương nhạt (#dbeafe), border #3b82f6
- **Not Selected**: Xám (#e5e7eb)

## 📝 Model Associations (Sequelize)

```javascript
// backend/src/models/index.js

// CandidateTest associations
CandidateTest.belongsTo(Candidate, { foreignKey: 'candidate_id' });
CandidateTest.belongsTo(Test, { foreignKey: 'test_id' });
CandidateTest.hasOne(CandidateTestResult, { foreignKey: 'candidate_test_id' });
CandidateTest.hasMany(CandidateTestAnswer, { foreignKey: 'candidate_test_id' });

// CandidateTestAnswer associations
CandidateTestAnswer.belongsTo(CandidateTest, { foreignKey: 'candidate_test_id' });
CandidateTestAnswer.belongsTo(Question, { foreignKey: 'question_id' });

// CandidateTestResult associations
CandidateTestResult.belongsTo(CandidateTest, { foreignKey: 'candidate_test_id' });
CandidateTestResult.belongsTo(User, { foreignKey: 'reviewed_by', as: 'Reviewer' });
```

## ✅ Checklist Tích Hợp Hoàn Chỉnh

- [x] Database schema tạo đầy đủ 3 bảng
- [x] Foreign keys và constraints đúng
- [x] Sequelize models định nghĩa đầy đủ
- [x] Model associations (belongsTo, hasMany, hasOne)
- [x] Backend API getMyCandidateTests
- [x] Backend API getCandidateTestDetails
- [x] Frontend my-tests.html
- [x] Frontend test-result.html
- [x] Authentication middleware
- [x] API trả về đúng cấu trúc JSON
- [x] Frontend gọi API với JWT token
- [x] Error handling đầy đủ
- [x] Loading states
- [x] Responsive design

## 🚀 Hướng Dẫn Sử Dụng

### Cho Developer

1. **Kiểm tra database có dữ liệu**:
```sql
-- Kiểm tra candidate_tests
SELECT * FROM candidate_tests LIMIT 10;

-- Kiểm tra answers
SELECT * FROM candidate_test_answers WHERE candidate_test_id = 1;

-- Kiểm tra results
SELECT * FROM candidate_test_results WHERE candidate_test_id = 1;
```

2. **Test API với curl** (cần token thật):
```bash
# Get my tests
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/candidate-tests/my-tests

# Get test details
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/candidate-tests/1/details
```

3. **Truy cập frontend**:
- Danh sách: `http://localhost:8080/my-tests.html`
- Chi tiết: `http://localhost:8080/test-result.html?id=1`

### Cho User (Ứng Viên)

1. Login vào hệ thống
2. Vào mục "Bài Test Của Tôi" / "My Tests"
3. Xem danh sách các bài test đã được giao
4. Click "Xem kết quả" để xem chi tiết câu trả lời và nhận xét

## 🔧 Troubleshooting

### Lỗi "Test not found"
- Kiểm tra candidate_test_id có tồn tại
- Kiểm tra test có thuộc về user đang login không
- Kiểm tra token JWT còn hạn không

### Không hiển thị câu hỏi
- Kiểm tra candidate_test_answers có dữ liệu
- Kiểm tra foreign key question_id đúng
- Kiểm tra QuestionOptions alias trong include

### Điểm số không đúng
- Kiểm tra is_correct trong candidate_test_answers
- Kiểm tra logic tính điểm trong completeTest
- Kiểm tra candidate_test_results có được tạo

## 📚 Tài Liệu Tham Khảo

- Database Schema: `database/init/01-init.sql`
- Models: `backend/src/models/`
- Controllers: `backend/src/controllers/candidateTest.controller.js`
- Frontend: `frontend/my-tests.html`, `frontend/test-result.html`
- API Routes: `backend/src/routes/candidateTest.routes.js`
