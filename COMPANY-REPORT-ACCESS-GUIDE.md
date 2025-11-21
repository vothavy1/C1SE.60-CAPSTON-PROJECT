# 📊 Hệ thống phân quyền Báo cáo theo Công ty

## ✅ Đã hoàn thành

### 1. Báo cáo Vi phạm (Violations)
- ✅ `getViolations()`: Recruiter chỉ xem vi phạm của ứng viên công ty mình
- ✅ `getViolationById()`: Kiểm tra quyền truy cập chi tiết vi phạm theo company_id
- ✅ Lọc theo `candidates.company_id` (vì violation → candidate_tests → candidates)

### 2. Báo cáo Thống kê (Statistics)
- ✅ `getStatistics()`: Recruiter chỉ xem thống kê của công ty mình
- ✅ Tính toán aggregated stats (totalTests, passedTests, failedTests, averageScore)
- ✅ Score distribution và test list được lọc theo công ty

### 3. Thông báo (Notifications)
- ✅ `getNotifications()`: Recruiter chỉ xem thông báo của ứng viên công ty mình
- ✅ Join với test_fraud_logs và interview_feedback
- ✅ Lọc candidate tests theo company_id

## 🔍 Cơ chế lọc dữ liệu

### Chuỗi liên kết:
```
Violations/Statistics → CandidateTest → Candidate → company_id
                              ↓
                         Test (test_id)
                              ↓
                      TestFraudLog (violations)
```

### Filtering Logic:
```javascript
// Build where clause for candidates
const candidateWhereClause = {};
if (userRole === 'RECRUITER') {
  candidateWhereClause.company_id = req.user.company_id;
}

// Apply to Candidate include
{
  model: Candidate,
  where: candidateWhereClause,
  required: true // INNER JOIN - only matching company
}
```

## 🧪 Cách kiểm tra

### Bước 1: Đăng xuất và đăng nhập lại
1. Click **"Đăng xuất"**
2. Đăng nhập với `recruiter@cs60.com`

### Bước 2: Kiểm tra Báo cáo Vi phạm
1. Vào trang **"Báo cáo"** → Tab **"Vi phạm"**
2. Chỉ thấy vi phạm của ứng viên công ty CS60 (company_id=1)
3. Không thấy vi phạm của ứng viên công ty khác

**Console log sẽ hiển thị:**
```
👤 User: recruiter@cs60.com, Role: RECRUITER, Company ID: 1
🔒 RECRUITER FILTER APPLIED: Only showing violations for company_id = 1
📋 Found X completed tests
```

### Bước 3: Kiểm tra Thống kê
1. Vào trang **"Báo cáo"** → Tab **"Thống kê"**
2. Chỉ thấy số liệu của ứng viên công ty CS60
3. Các chỉ số: Total Tests, Passed, Failed, Average Score chỉ tính từ công ty mình

**Console log sẽ hiển thị:**
```
👤 User: recruiter@cs60.com, Role: RECRUITER, Company ID: 1
🔒 RECRUITER FILTER APPLIED: Only showing statistics for company_id = 1
📊 Found X completed tests
```

### Bước 4: Kiểm tra Thông báo
1. Vào trang **"Báo cáo"** → Tab **"Thông báo"**
2. Chỉ thấy thông báo gửi cho ứng viên công ty CS60
3. Không thấy thông báo của ứng viên công ty khác

**Console log sẽ hiển thị:**
```
👤 User: recruiter@cs60.com, Role: RECRUITER, Company ID: 1
🔒 RECRUITER FILTER APPLIED: Only showing notifications for company_id = 1
📧 Found X notifications
```

### Bước 5: Test với công ty khác
1. Đăng ký/đăng nhập với recruiter công ty khác:
   - Email: `recruiter@agency.com`
   - Company: **Recruitment Agency** (company_id=2)

2. Vào trang Báo cáo
3. **Kết quả**: Sẽ thấy dữ liệu khác (hoặc trống nếu chưa có ứng viên)

## 📊 Dữ liệu hiện tại

### Ứng viên theo công ty:
```sql
-- CS60 Company (company_id = 1)
candidate_id=10: VO THI VY, email=candidate@example.com
candidate_id=12: vo thi vy, email=candidate3@example.com

-- Digital Solutions (company_id = 3)
candidate_id=13: vo thi vy, email=candidate3@example.com
```

### Báo cáo sẽ lọc theo ứng viên:
- Recruiter CS60: Chỉ xem báo cáo của candidate 10, 12
- Recruiter Digital Solutions: Chỉ xem báo cáo của candidate 13

## 🔒 Phân quyền theo Role

### ADMIN:
- ✅ Xem tất cả báo cáo của mọi công ty
- ✅ Không bị giới hạn bởi company_id

### RECRUITER:
- ✅ Chỉ xem báo cáo vi phạm của ứng viên công ty mình
- ✅ Chỉ xem thống kê của công ty mình
- ✅ Chỉ xem thông báo gửi cho ứng viên công ty mình
- ❌ Không thể truy cập báo cáo của công ty khác (403 Forbidden khi truy cập chi tiết)

### CANDIDATE:
- ⚠️ Không có quyền truy cập trang báo cáo
- ℹ️ Chỉ xem được kết quả bài thi của chính mình

## 📝 Console Logs để debug

### Khi recruiter xem báo cáo:
```
👤 User: recruiter@cs60.com, Role: RECRUITER, Company ID: 1
🔒 RECRUITER FILTER APPLIED: Only showing violations for company_id = 1
📋 Found 2 completed tests
⚠️ Returning 2 enhanced violations
```

### Khi recruiter cố truy cập chi tiết vi phạm công ty khác:
```
🚫 ACCESS DENIED: Recruiter company_id=1 tried to access violation of candidate company_id=2
```

## 🎯 Kết quả mong đợi

✅ Recruiter công ty A **KHÔNG THỂ** xem báo cáo của công ty B
✅ Thống kê chỉ tính toán từ dữ liệu công ty của recruiter
✅ Vi phạm chỉ hiển thị từ bài thi của ứng viên công ty mình
✅ Admin vẫn có toàn quyền xem tất cả báo cáo

## 🔗 Liên kết với các module khác

### Đã phân quyền theo công ty:
- ✅ Candidates (Ứng viên)
- ✅ Tests (Đề thi)
- ✅ Questions (Câu hỏi)
- ✅ Reports (Báo cáo) ← **MỚI**

### Chuỗi phân quyền hoàn chỉnh:
```
Company → Users (Recruiters)
       → Candidates
       → Tests
       → Questions
       → CandidateTests → TestFraudLogs (Violations)
                       → CandidateTestResults (Statistics)
                       → Notifications
```

## ⚠️ Lưu ý quan trọng

1. **Phải đăng xuất và đăng nhập lại** để JWT token mới có `company_id`
2. Backend đã restart với code mới
3. Báo cáo lọc theo `candidates.company_id`, không phải `tests.company_id`
4. Sử dụng `required: true` trong Sequelize include để INNER JOIN (chỉ lấy dữ liệu match)

## 🚀 Tính năng bổ sung có thể triển khai

- [ ] Export báo cáo theo công ty (PDF/Excel)
- [ ] Dashboard riêng cho từng công ty với real-time stats
- [ ] Comparison reports giữa các công ty (chỉ Admin)
- [ ] Automated weekly/monthly reports gửi email cho recruiters
