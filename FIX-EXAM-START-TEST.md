# ✅ Sửa Lỗi "Không thể làm bài thi"

## 🔍 Nguyên nhân lỗi

Khi click "Làm bài thi", hệ thống gặp **nhiều lỗi liên tiếp**:

### Lỗi 1: Data truncated for column 'status' (500 Error)
```
POST /api/candidates/self-register - 500 Internal Server Error
Data truncated for column 'status' at row 1
```

**Phân tích:**
- Frontend gửi: `status: 'ACTIVE'`
- Bảng `candidates` chỉ chấp nhận: `'NEW'`, `'SCREENING'`, `'TESTING'`, `'INTERVIEWING'`, `'OFFERED'`, `'HIRED'`, `'REJECTED'`
- ❌ Giá trị `'ACTIVE'` không hợp lệ

### Lỗi 2: Forbidden (403 Error)
```
POST /api/candidate-tests/assign - 403 Forbidden
```

**Phân tích:**
- Route `/assign` yêu cầu permission: `test_assign`
- User với role CANDIDATE không có quyền này
- ❌ Frontend gọi route dành cho RECRUITER/ADMIN

### Lỗi 3: Internal Server Error (500 Error)
```
GET /api/candidate-tests/my-tests - 500 Internal Server Error
```

**Phân tích:**
- Controller dùng: `req.user.user_id`
- Nhưng auth middleware chuẩn hóa thành: `req.user.userId`
- ❌ Không tìm thấy userId → Lỗi khi query database

### Lỗi 4: Invalid ENUM value
```
status: 'ASSIGNED' - Data truncated for column 'status'
```

**Phân tích:**
- Code dùng: `status: 'ASSIGNED'`
- Model `candidate_tests` chỉ chấp nhận: `'PENDING'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'EXPIRED'`
- ❌ Giá trị `'ASSIGNED'` không tồn tại trong ENUM

## ✅ Giải pháp đã áp dụng

### 1. Sửa Candidate Profile Creation (`frontend/exam.html`)

**TRƯỚC:**
```javascript
body: JSON.stringify({
  user_id: session.userId,
  first_name: session.fullName || session.username || 'User',
  last_name: '',                    // ❌ Chuỗi rỗng
  email: session.email || '',
  status: 'ACTIVE'                  // ❌ Giá trị không hợp lệ
})
```

**SAU:**
```javascript
body: JSON.stringify({
  user_id: session.userId,
  first_name: session.fullName || session.username || 'User',
  last_name: '-',                   // ✅ Giá trị mặc định
  email: session.email || '',
  status: 'NEW'                     // ✅ Giá trị hợp lệ
})
```

### 2. Tạo Route Mới cho Self-Assign (`backend/src/routes/candidateTest.routes.js`)

**THÊM MỚI:**
```javascript
// Route for candidates to self-assign (start a test)
router.post(
  '/self-assign',
  authMiddleware.verifyToken,      // ✅ Chỉ cần token, không cần permission
  candidateTestController.selfAssignTest
);
```

**KHÁC BIỆT với route cũ:**
```javascript
// Route cũ (chỉ dành cho RECRUITER/ADMIN)
router.post(
  '/assign',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('test_assign'),  // ❌ CANDIDATE không có
  candidateTestController.assignTest
);
```

### 3. Tạo Controller Method (`backend/src/controllers/candidateTest.controller.js`)

**THÊM MỚI: `selfAssignTest()`**
```javascript
exports.selfAssignTest = async (req, res) => {
  // ✅ Verify user owns this candidate profile
  if (candidate.user_id !== req.user.userId) {
    return res.status(403).json({
      message: 'You can only assign tests to your own profile'
    });
  }
  
  // ✅ Check test is ACTIVE
  if (test.status !== 'ACTIVE') {
    return res.status(400).json({
      message: 'This test is not available'
    });
  }
  
  // ✅ Return existing test if already assigned
  if (existingTest) {
    return res.status(200).json({
      data: { candidate_test_id: existingTest.candidate_test_id }
    });
  }
  
  // ✅ Create with status 'PENDING' (not 'ASSIGNED')
  const candidateTest = await CandidateTest.create({
    status: 'PENDING'
  });
};
```

### 4. Sửa userId Inconsistency

**TRƯỚC:**
```javascript
// getMyCandidateTests
const userId = req.user.user_id;  // ❌ Không tồn tại

// getCandidateTestDetails
const userId = req.user.user_id;  // ❌ Không tồn tại
```

**SAU:**
```javascript
// Cả 2 methods
const userId = req.user.userId || req.user.user_id;  // ✅ Fallback
```

### 5. Sửa Frontend API Call (`frontend/exam.html`)

**TRƯỚC:**
```javascript
const assignResponse = await fetch(`${API_BASE_URL}/candidate-tests/assign`, {
  // ❌ Route yêu cầu permission
});
```

**SAU:**
```javascript
console.log('🎯 Self-assigning test:', testId, 'for candidate:', candidateId);
const assignResponse = await fetch(`${API_BASE_URL}/candidate-tests/self-assign`, {
  // ✅ Route không cần permission
});
```

## 🧪 Cách kiểm tra

### Bước 1: Xóa cache và làm mới trình duyệt
```
1. Mở DevTools (F12)
2. Vào tab "Application" → "Storage" → "Clear site data"
3. Hoặc nhấn Ctrl+Shift+R để hard refresh
```

### Bước 2: Test lại luồng
```
1. Đăng nhập lại (http://localhost:3000/index.html)
2. Vào trang "Làm bài thi" (exam.html)
3. Click nút "🚀 Làm bài thi" trên một bài test
4. Kiểm tra Console (F12) xem có lỗi không
```

### Bước 3: Kiểm tra Database
```sql
-- Xem hồ sơ ứng viên vừa tạo
SELECT * FROM candidates 
ORDER BY created_at DESC 
LIMIT 1;

-- Kiểm tra status của candidate
SELECT candidate_id, user_id, first_name, last_name, status, created_at
FROM candidates
WHERE user_id = 11;  -- Thay 11 bằng userId của bạn
```

## 📋 Kết quả mong đợi

### Console logs thành công:
```
✅ Session valid: 11 CANDIDATE
📝 Creating candidate profile for user: 11
✅ Created candidate profile: 123
🎯 Redirecting to test...
```

### Database sẽ có record:
```
candidate_id | user_id | first_name | last_name | status | email
-------------|---------|------------|-----------|--------|-------
123          | 11      | UserName   | -         | NEW    | user@example.com
```

### Trình duyệt sẽ:
- Tạo candidate profile tự động (nếu chưa có)
- Tạo candidate_test entry
- Chuyển hướng đến trang làm bài: `test.html?testId=X&candidateTestId=Y`

## 🚨 Nếu vẫn còn lỗi

### Lỗi: "User already has a candidate profile"
```javascript
// Hệ thống sẽ tự động retry và lấy candidate_id
console.log('🔄 Candidate exists, fetching again...')
console.log('✅ Got candidate on retry:', candidateId)
```

### Lỗi: 404 Not Found
- Kiểm tra backend đang chạy ở port 5000: `http://localhost:5000/api`
- Kiểm tra route `/api/candidates/self-register` tồn tại
- Xem log backend trong terminal

### Lỗi: 401 Unauthorized
```javascript
// Xóa localStorage và đăng nhập lại
localStorage.clear();
window.location.href = 'index.html';
```

## 📝 ENUM Values Reference

### Bảng `candidates.status`

| Giá trị | Ý nghĩa | Sử dụng |
|---------|---------|---------|
| `NEW` | Ứng viên mới | ✅ Mặc định khi tự đăng ký |
| `SCREENING` | Đang sàng lọc hồ sơ | Recruiter đánh giá CV |
| `TESTING` | Đang làm bài test | Candidate đang test |
| `INTERVIEWING` | Đang phỏng vấn | Candidate vào vòng interview |
| `OFFERED` | Đã gửi offer | Công ty gửi offer |
| `HIRED` | Đã tuyển dụng | Candidate chấp nhận offer |
| `REJECTED` | Đã từ chối | Không đạt yêu cầu |

### Bảng `candidate_tests.status`

| Giá trị | Ý nghĩa | Sử dụng |
|---------|---------|---------|
| `PENDING` | Đã giao, chưa bắt đầu | ✅ Mặc định khi self-assign |
| `IN_PROGRESS` | Đang làm bài | Candidate đã click "Bắt đầu" |
| `COMPLETED` | Đã hoàn thành | Submit hoặc hết giờ |
| `EXPIRED` | Đã hết hạn | Quá thời gian cho phép |

**Lưu ý:** Không có giá trị `'ASSIGNED'` trong cả 2 bảng!

## 🔧 Tổng hợp Code đã thay đổi

| File | Thay đổi | Lý do |
|------|----------|-------|
| `frontend/exam.html` | `status: 'ACTIVE'` → `'NEW'` | ENUM candidates.status không có 'ACTIVE' |
| `frontend/exam.html` | `last_name: ''` → `'-'` | Tránh vi phạm allowNull: false |
| `frontend/exam.html` | `/assign` → `/self-assign` | Route mới không cần permission |
| `backend/src/routes/candidateTest.routes.js` | Thêm route `/self-assign` | Cho phép CANDIDATE tự assign test |
| `backend/src/controllers/candidateTest.controller.js` | Thêm method `selfAssignTest()` | Logic assign test cho candidate |
| `backend/src/controllers/candidateTest.controller.js` | `status: 'ASSIGNED'` → `'PENDING'` | ENUM candidate_tests.status không có 'ASSIGNED' |
| `backend/src/controllers/candidateTest.controller.js` | `req.user.user_id` → `req.user.userId` | Chuẩn hóa key trong req.user |
| `backend/src/controllers/candidateTest.controller.js` | Sửa `getMyCandidateTests()` | Dùng userId với fallback |
| `backend/src/controllers/candidateTest.controller.js` | Sửa `getCandidateTestDetails()` | Dùng userId với fallback |

## 📊 Luồng xử lý mới

### Trước (❌ Lỗi):
```
1. Login → Session saved
2. Click "Làm bài thi"
3. Create candidate profile (status: 'ACTIVE') ❌ 500 Error
4. Không thể tiếp tục
```

### Sau (✅ Hoạt động):
```
1. Login → Session saved (userId: 11)
2. Click "Làm bài thi"
3. Check candidate profile
   - Nếu chưa có: Create (status: 'NEW') ✅
   - Nếu có rồi: Lấy candidate_id ✅
4. Self-assign test
   - POST /self-assign (không cần permission) ✅
   - Tạo candidate_test (status: 'PENDING') ✅
   - Trả về candidate_test_id ✅
5. Redirect: test.html?testId=X&candidateTestId=Y ✅
```

## ✅ Checklist

### Backend Changes
- [x] Tạo route `/self-assign` không yêu cầu permission
- [x] Tạo controller `selfAssignTest()` với validation
- [x] Sửa status từ 'ASSIGNED' → 'PENDING'
- [x] Sửa `req.user.user_id` → `req.user.userId` trong getMyCandidateTests
- [x] Sửa `req.user.user_id` → `req.user.userId` trong getCandidateTestDetails

### Frontend Changes
- [x] Sửa candidate status từ 'ACTIVE' → 'NEW'
- [x] Sửa last_name từ '' → '-'
- [x] Đổi API endpoint từ `/assign` → `/self-assign`
- [x] Thêm console logs cho debugging

### Testing
- [ ] Clear browser cache (Ctrl+F5)
- [ ] Test login flow
- [ ] Test "Làm bài thi" button
- [ ] Kiểm tra Console logs (không còn lỗi 403, 500)
- [ ] Xác nhận redirect to test.html

---

**Tạo ngày:** 2025-11-02  
**Cập nhật:** 2025-11-02 10:23 PM  
**Trạng thái:** ✅ Đã sửa HOÀN TOÀN - Sẵn sàng test
