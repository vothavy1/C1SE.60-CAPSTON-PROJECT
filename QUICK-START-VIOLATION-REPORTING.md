# Quick Start Guide - Violation Reporting System

## 🚀 Cài Đặt Nhanh (5 phút)

### Bước 1: Cập Nhật Database

```powershell
# Di chuyển vào thư mục database
cd database

# Chạy migration script
mysql -u root -p cs60_recruitment < init/02-update-reports.sql

# Hoặc nếu dùng Docker:
docker exec -i cs60-mysql mysql -uroot -p123456 cs60_recruitment < init/02-update-reports.sql
```

**Verify:**
```sql
USE cs60_recruitment;
SHOW CREATE TABLE recruitment_reports;
SHOW CREATE TABLE test_fraud_logs;
SELECT * FROM information_schema.views WHERE table_schema = 'cs60_recruitment';
```

### Bước 2: Restart Backend

```powershell
cd ..\backend

# Stop backend nếu đang chạy
# Ctrl+C hoặc:
# taskkill /F /IM node.exe

# Start lại
npm start
```

### Bước 3: Test API

```powershell
cd ..

# Chạy test script
.\test-violation-api.ps1
```

**Expected Output:**
```
✓ Login successful
✓ Violation reported successfully
✓ Retrieved violations successfully
Total violations: X
✓ Retrieved test statistics successfully
```

## 📝 Sử Dụng Cơ Bản

### 1. Báo Cáo Vi Phạm

**Từ Frontend:**
```javascript
const token = localStorage.getItem('token');

// Báo cáo vi phạm khi phát hiện
fetch('http://localhost:3000/api/reports/violation', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    candidate_test_id: 1,
    violation_type: 'TAB_SWITCH',  // hoặc COPY_PASTE, MULTIPLE_WINDOWS, SCREENSHOT, OTHER
    description: 'Candidate switched to another tab',
    event_count: 1
  })
})
.then(res => res.json())
.then(data => console.log('Violation reported:', data));
```

**Từ PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

$body = @{
    candidate_test_id = 1
    violation_type = "TAB_SWITCH"
    description = "Test violation"
    event_count = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/reports/violation" `
    -Method Post `
    -Headers @{"Authorization"="Bearer $token"} `
    -Body $body `
    -ContentType "application/json"
```

### 2. Xem Danh Sách Vi Phạm (Admin)

```javascript
// Lấy tất cả violations
fetch('http://localhost:3000/api/reports/violations', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('Total violations:', data.count);
  console.log('Violations:', data.data);
});

// Filter theo loại
fetch('http://localhost:3000/api/reports/violations?violationType=TAB_SWITCH', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => console.log('Tab switch violations:', data.data));
```

### 3. Xem Thống Kê

```javascript
// Thống kê tests
fetch('http://localhost:3000/api/reports/statistics', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('Total tests:', data.data.totalTests);
  console.log('Passed:', data.data.passedTests);
  console.log('Failed:', data.data.failedTests);
  console.log('Average score:', data.data.averageScore);
  console.log('Total violations:', data.data.totalViolations);
});

// Thống kê violations
fetch('http://localhost:3000/api/reports/violations-stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.json())
.then(data => {
  console.log('Violation statistics:', data.data);
});
```

### 4. Auto-Logging Khi Test Hoàn Thành

**Trong candidateTest.controller.js:**
```javascript
const reportController = require('./report.controller');

// Khi candidate submit test
const result = await CandidateTestResult.create({
  candidate_test_id,
  total_score,
  percentage,
  passed
});

// Auto-save report data
await reportController.saveTestCompletionData({
  candidate_test_id,
  test_id,
  candidate_id,
  candidate_name: `${candidate.first_name} ${candidate.last_name}`,
  candidate_email: candidate.email,
  test_name: test.test_name,
  score: total_score,
  percentage,
  passed,
  start_time: candidateTest.start_time,
  end_time: candidateTest.end_time,
  violations: [] // Array of violations detected during test
});
```

## 🔍 Truy Vấn Database Trực Tiếp

### Violations

```sql
-- Tất cả violations
SELECT * FROM test_fraud_logs ORDER BY event_time DESC LIMIT 10;

-- Violations với details
SELECT * FROM v_violation_reports 
WHERE event_type = 'TAB_SWITCH' 
ORDER BY event_time DESC;

-- Count violations theo type
SELECT event_type, COUNT(*) as count, SUM(event_count) as total_events
FROM test_fraud_logs
GROUP BY event_type;

-- Tests có nhiều violations nhất
SELECT candidate_test_id, COUNT(*) as violation_count
FROM test_fraud_logs
GROUP BY candidate_test_id
ORDER BY violation_count DESC
LIMIT 10;
```

### Statistics

```sql
-- Tổng quan tests
SELECT 
  COUNT(*) as total_tests,
  SUM(CASE WHEN passed = 1 THEN 1 ELSE 0 END) as passed,
  SUM(CASE WHEN passed = 0 THEN 1 ELSE 0 END) as failed,
  AVG(total_score) as avg_score
FROM candidate_test_results;

-- Test statistics view
SELECT * FROM v_test_statistics 
WHERE passed = 1 
ORDER BY percentage DESC;
```

### Reports

```sql
-- Tất cả reports
SELECT * FROM recruitment_reports ORDER BY created_at DESC LIMIT 20;

-- Violations reports
SELECT * FROM recruitment_reports 
WHERE report_type = 'VIOLATION' 
ORDER BY created_at DESC;

-- Notifications
SELECT * FROM recruitment_reports 
WHERE report_type = 'NOTIFICATION' 
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### Lỗi: "Table doesn't exist"
```powershell
# Chạy lại migration
cd database
mysql -u root -p cs60_recruitment < init/01-init.sql
mysql -u root -p cs60_recruitment < init/02-update-reports.sql
```

### Lỗi: "Cannot read property of undefined"
```javascript
// Check model đã được import
const { TestFraudLog, RecruitmentReport } = require('../models');

// Check relationship đã được setup
// Trong models/index.js
```

### Lỗi: "Permission denied"
```javascript
// Verify user có permission 'report_view'
// Check trong auth.middleware.js
// Verify token hợp lệ
```

### Database Connection Error
```javascript
// Check database config trong backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cs60_recruitment
DB_USER=root
DB_PASSWORD=your_password

// Test connection
node -e "require('./backend/src/config/database').authenticate().then(() => console.log('OK'))"
```

## 📊 Monitoring

### Check Logs
```powershell
# Backend logs
Get-Content backend/logs/app.log -Tail 50

# Error logs
Get-Content backend/logs/error.log -Tail 20
```

### Database Performance
```sql
-- Slow queries
SHOW FULL PROCESSLIST;

-- Index usage
SHOW INDEX FROM test_fraud_logs;
SHOW INDEX FROM recruitment_reports;

-- Table stats
SHOW TABLE STATUS LIKE 'test_fraud_logs';
SHOW TABLE STATUS LIKE 'recruitment_reports';
```

## 🎯 Common Use Cases

### Use Case 1: Real-time Violation Detection

Trong `exam.html`:
```javascript
// Detect tab switch
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    reportViolation('TAB_SWITCH', 'User switched away from exam tab');
  }
});

// Detect copy/paste
document.addEventListener('paste', (e) => {
  e.preventDefault();
  reportViolation('COPY_PASTE', 'User attempted to paste content');
});

async function reportViolation(type, description) {
  await fetch('/api/reports/violation', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      candidate_test_id: currentTestId,
      violation_type: type,
      description: description
    })
  });
}
```

### Use Case 2: Admin Dashboard

Trong `report.html`:
```javascript
// Load statistics
async function loadDashboard() {
  const stats = await fetch('/api/reports/statistics', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  const violations = await fetch('/api/reports/violations', {
    headers: { 'Authorization': `Bearer ${token}` }
  }).then(r => r.json());
  
  displayStats(stats.data);
  displayViolations(violations.data);
}
```

### Use Case 3: Candidate Review

```javascript
// Review a specific test with violations
async function reviewTest(candidateTestId) {
  const violations = await fetch(
    `/api/reports/violations/test/${candidateTestId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(r => r.json());
  
  console.log(`Found ${violations.count} violations for this test`);
  violations.data.forEach(v => {
    console.log(`${v.event_type}: ${v.event_count} times at ${v.event_time}`);
  });
}
```

## 📚 Tài Liệu Tham Khảo

- **Chi tiết đầy đủ:** `docs/VIOLATION-REPORTING-SYSTEM.md`
- **Tổng quan thay đổi:** `VIOLATION-REPORTING-DATABASE-INTEGRATION.md`
- **Checklist:** `VIOLATION-REPORTING-CHECKLIST.md`
- **Test script:** `test-violation-api.ps1`

## ✅ Next Steps

1. ✅ Đã setup database
2. ✅ Đã restart backend
3. ✅ Đã test API
4. ⏭️ Integrate với frontend
5. ⏭️ Setup monitoring
6. ⏭️ Train users

---

**Need Help?** Check documentation hoặc review code comments.
**Found a Bug?** Check logs và troubleshooting guide.
**Want Enhancement?** Submit feature request.
