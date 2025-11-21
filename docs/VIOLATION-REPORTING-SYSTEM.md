# Hệ Thống Báo Cáo Vi Phạm (Violation Reporting System)

## Tổng Quan

Hệ thống báo cáo vi phạm đã được cập nhật để sử dụng **database** thay vì JSON files, tích hợp với các bảng `test_fraud_logs` và `recruitment_reports`.

## Cấu Trúc Database

### Bảng `test_fraud_logs`
Lưu trữ các vi phạm được phát hiện trong quá trình làm bài test.

```sql
CREATE TABLE test_fraud_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_test_id INT NOT NULL,
    event_type ENUM('TAB_SWITCH', 'COPY_PASTE', 'MULTIPLE_WINDOWS', 'SCREENSHOT', 'OTHER') NOT NULL,
    event_count INT DEFAULT 1,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details TEXT,
    FOREIGN KEY (candidate_test_id) REFERENCES candidate_tests(candidate_test_id) ON DELETE CASCADE
);
```

**Các loại vi phạm:**
- `TAB_SWITCH`: Chuyển tab trình duyệt
- `COPY_PASTE`: Copy/paste nội dung
- `MULTIPLE_WINDOWS`: Mở nhiều cửa sổ
- `SCREENSHOT`: Chụp màn hình
- `OTHER`: Vi phạm khác

### Bảng `recruitment_reports`
Lưu trữ metadata về các báo cáo được tạo.

```sql
CREATE TABLE recruitment_reports (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    report_name VARCHAR(100) NOT NULL,
    report_type ENUM('VIOLATION', 'STATISTICS', 'ACTIVITY_LOG', ...) NOT NULL,
    parameters TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);
```

## API Endpoints

### 1. Báo Cáo Vi Phạm

**POST** `/api/reports/violation`

Ghi nhận một vi phạm mới trong quá trình làm test.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "candidate_test_id": 1,
  "violation_type": "TAB_SWITCH",
  "description": "Candidate switched tabs during exam",
  "event_count": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Violation reported successfully",
  "data": {
    "log_id": 123,
    "candidate_test_id": 1,
    "test_name": "JavaScript Fundamentals",
    "candidate_name": "John Doe",
    "candidate_email": "john@example.com",
    "violation_type": "TAB_SWITCH",
    "description": "Candidate switched tabs during exam",
    "event_count": 3,
    "reported_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Lấy Tất Cả Vi Phạm

**GET** `/api/reports/violations`

Lấy danh sách tất cả vi phạm (Admin only).

**Query Parameters:**
- `violationType`: Lọc theo loại vi phạm (optional)
- `candidateTestId`: Lọc theo bài test (optional)
- `startDate`: Ngày bắt đầu (optional)
- `endDate`: Ngày kết thúc (optional)

**Example:**
```
GET /api/reports/violations?violationType=TAB_SWITCH
```

**Response:**
```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "log_id": 123,
      "candidate_test_id": 1,
      "candidate_name": "John Doe",
      "test_name": "JavaScript Fundamentals",
      "violation_type": "TAB_SWITCH",
      "event_count": 3,
      "score": 75,
      "status": "pass",
      "reported_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Lấy Vi Phạm Theo ID

**GET** `/api/reports/violations/:logId`

Lấy chi tiết một vi phạm cụ thể.

**Response:**
```json
{
  "success": true,
  "data": {
    "log_id": 123,
    "candidate_test_id": 1,
    "event_type": "TAB_SWITCH",
    "event_count": 3,
    "event_time": "2024-01-15T10:30:00Z",
    "details": "Candidate switched tabs during exam",
    "test": {
      "test_id": 1,
      "test_name": "JavaScript Fundamentals"
    },
    "candidate": {
      "candidate_id": 5,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "test_result": {
      "total_score": 75,
      "percentage": 75.0,
      "passed": true
    }
  }
}
```

### 4. Lấy Vi Phạm Theo Test

**GET** `/api/reports/violations/test/:candidateTestId`

Lấy tất cả vi phạm của một bài test cụ thể.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "log_id": 123,
      "event_type": "TAB_SWITCH",
      "event_count": 2,
      "event_time": "2024-01-15T10:30:00Z"
    },
    {
      "log_id": 124,
      "event_type": "COPY_PASTE",
      "event_count": 1,
      "event_time": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### 5. Thống Kê Vi Phạm

**GET** `/api/reports/violations-stats`

Lấy thống kê tổng quan về vi phạm.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_violations": 150,
    "by_type": [
      {
        "event_type": "TAB_SWITCH",
        "count": 80,
        "total_events": 245
      },
      {
        "event_type": "COPY_PASTE",
        "count": 40,
        "total_events": 50
      }
    ],
    "top_tests_with_violations": [
      {
        "candidate_test_id": 15,
        "violation_count": 5
      }
    ],
    "recent_violations": [...]
  }
}
```

### 6. Thống Kê Bài Test

**GET** `/api/reports/statistics`

Lấy thống kê tổng quan về các bài test (đã cập nhật để dùng database).

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTests": 100,
    "completedTests": 80,
    "passedTests": 60,
    "failedTests": 20,
    "pendingTests": 0,
    "averageScore": 75.5,
    "totalViolations": 150,
    "statusDistribution": {
      "completed": 80,
      "in_progress": 15,
      "assigned": 5
    },
    "scoreDistribution": {
      "0-20": 5,
      "21-40": 10,
      "41-60": 15,
      "61-80": 30,
      "81-100": 20
    },
    "testsList": [...]
  }
}
```

## Models

### TestFraudLog Model

```javascript
const TestFraudLog = sequelize.define('TestFraudLog', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidate_test_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  event_type: {
    type: DataTypes.ENUM('TAB_SWITCH', 'COPY_PASTE', 'MULTIPLE_WINDOWS', 'SCREENSHOT', 'OTHER'),
    allowNull: false
  },
  event_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  event_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  details: {
    type: DataTypes.TEXT
  }
});
```

### RecruitmentReport Model

```javascript
const RecruitmentReport = sequelize.define('RecruitmentReport', {
  report_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  report_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  report_type: {
    type: DataTypes.ENUM(...),
    allowNull: false
  },
  parameters: {
    type: DataTypes.TEXT,
    get() {
      return JSON.parse(this.getDataValue('parameters'));
    },
    set(value) {
      this.setDataValue('parameters', JSON.stringify(value));
    }
  },
  created_by: {
    type: DataTypes.INTEGER
  }
});
```

## Database Views

Hệ thống tạo các view để truy vấn dễ dàng hơn:

### v_violation_reports
Kết hợp thông tin từ test_fraud_logs với candidate, test và result.

```sql
SELECT * FROM v_violation_reports 
WHERE event_type = 'TAB_SWITCH' 
ORDER BY event_time DESC;
```

### v_test_statistics
Thống kê tổng quan về các bài test đã hoàn thành.

```sql
SELECT * FROM v_test_statistics 
WHERE passed = true 
ORDER BY percentage DESC;
```

## Sử Dụng

### 1. Chạy Migration

Chạy script SQL để cập nhật database:

```bash
# Kết nối MySQL
mysql -u root -p cs60_recruitment < database/init/02-update-reports.sql
```

### 2. Test API

Sử dụng PowerShell script để test:

```powershell
.\test-violation-api.ps1
```

### 3. Tích Hợp Frontend

```javascript
// Báo cáo vi phạm từ frontend
async function reportViolation(candidateTestId, violationType, description) {
  const response = await fetch('/api/reports/violation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      candidate_test_id: candidateTestId,
      violation_type: violationType,
      description: description
    })
  });
  return response.json();
}

// Lấy danh sách vi phạm
async function getViolations(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/reports/violations?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

## Permissions

Cần các permission sau để sử dụng các API:

- `report_view`: Xem báo cáo và vi phạm (Admin, Recruiter)
- `test_review`: Review và thông báo cho candidate (Admin, Recruiter)

## Logging

Tất cả các hoạt động đều được ghi log vào:
- `system_logs` table (database)
- `logs/app.log` (file)

## Best Practices

1. **Báo cáo real-time**: Gọi API reportViolation ngay khi phát hiện vi phạm
2. **Batch reporting**: Có thể gom nhóm các vi phạm tương tự bằng event_count
3. **Review thường xuyên**: Admin nên review violations để phát hiện gian lận
4. **Kết hợp với kết quả test**: Xem xét vi phạm cùng với kết quả để đánh giá chính xác

## Troubleshooting

### Lỗi: "Violation type not valid"
- Kiểm tra `violation_type` phải nằm trong enum values
- Sử dụng: TAB_SWITCH, COPY_PASTE, MULTIPLE_WINDOWS, SCREENSHOT, OTHER

### Lỗi: "Candidate test not found"
- Kiểm tra `candidate_test_id` có tồn tại trong database
- Đảm bảo test đã được tạo và assigned cho candidate

### Không có dữ liệu violations
- Kiểm tra database connection
- Verify rằng migration script đã chạy thành công
- Kiểm tra permissions của user

## Migration từ JSON Files

Nếu bạn có dữ liệu cũ trong JSON files, có thể migrate bằng script:

```javascript
// Đọc từ violations.json và insert vào database
const oldViolations = require('./reports/violations.json');
for (const v of oldViolations) {
  await TestFraudLog.create({
    candidate_test_id: v.candidate_test_id,
    event_type: v.violation_type,
    event_count: 1,
    event_time: v.reported_at,
    details: v.description
  });
}
```

## Tài Liệu Liên Quan

- [CANDIDATE-TEST-SYSTEM.md](./CANDIDATE-TEST-SYSTEM.md)
- [TESTING-GUIDE.md](./TESTING-GUIDE.md)
- [RESULT-VISIBILITY-CONTROL.md](./RESULT-VISIBILITY-CONTROL.md)
