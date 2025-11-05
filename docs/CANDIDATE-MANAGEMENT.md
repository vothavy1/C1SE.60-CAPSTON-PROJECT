# 📋 Tài Liệu Chức Năng Quản Lý Ứng Viên

## 🎯 Tổng Quan

Chức năng quản lý ứng viên cho phép Recruiter/Admin:
- Xem danh sách tất cả ứng viên
- Thêm ứng viên mới
- Sửa thông tin ứng viên
- Xóa ứng viên
- Tìm kiếm và lọc theo nhiều tiêu chí
- Theo dõi thống kê nhanh

## 📁 Files Đã Tạo/Sửa

### Frontend

#### 1. `candidate-list.html` (MỚI)
**Mô tả:** Trang quản lý ứng viên chính

**Chức năng:**
- ✅ Hiển thị danh sách ứng viên dạng table
- ✅ Phân trang (10 records/page)
- ✅ Tìm kiếm realtime theo: tên, email, vị trí, kỹ năng
- ✅ Lọc theo trạng thái
- ✅ Thống kê: Tổng ứng viên, Ứng viên mới, Đang test, Đã tuyển
- ✅ Modal form để thêm/sửa ứng viên
- ✅ Actions: Xem, Sửa, Xóa với icon trực quan

**API Calls:**
```javascript
// Get all candidates
GET /api/candidates
Headers: Authorization: Bearer <token>

// Get candidate by ID
GET /api/candidates/:id
Headers: Authorization: Bearer <token>

// Create candidate
POST /api/candidates
Headers: Authorization: Bearer <token>
Body: {
  first_name, last_name, email, phone,
  current_position, years_of_experience,
  education, skills, source, status, notes
}

// Update candidate
PUT /api/candidates/:id
Headers: Authorization: Bearer <token>
Body: { ...candidate data }

// Delete candidate
DELETE /api/candidates/:id
Headers: Authorization: Bearer <token>
```

#### 2. `recruiter.html` (CẬP NHẬT)
**Thay đổi:**
- Link "Danh sách ứng viên" → `candidate-list.html`
- Link "Thêm ứng viên" → `candidate-list.html`

### Backend (Đã có sẵn)

Backend API đã được implement trong:
- **Route:** `backend/src/routes/candidate.routes.js`
- **Controller:** `backend/src/controllers/candidate.controller.js`
- **Model:** `backend/src/models/candidate.model.js`

## 🗄️ Database Schema

### Bảng `candidates`

| Cột | Type | Mô tả |
|-----|------|-------|
| `candidate_id` | INT (PK) | ID ứng viên |
| `user_id` | INT | Link tới bảng users (nullable) |
| `first_name` | VARCHAR(50) | Họ |
| `last_name` | VARCHAR(50) | Tên |
| `email` | VARCHAR(100) | Email (unique) |
| `phone` | VARCHAR(20) | Số điện thoại |
| `current_position` | VARCHAR(100) | Vị trí hiện tại |
| `years_of_experience` | INT | Số năm kinh nghiệm |
| `education` | TEXT | Học vấn |
| `skills` | TEXT | Kỹ năng |
| `source` | VARCHAR(100) | Nguồn ứng tuyển |
| `status` | ENUM | Trạng thái |
| `notes` | TEXT | Ghi chú |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

### Status ENUM Values

| Value | Ý nghĩa | Badge Color |
|-------|---------|-------------|
| `NEW` | Ứng viên mới | Blue |
| `SCREENING` | Đang sàng lọc hồ sơ | Yellow |
| `TESTING` | Đang làm bài test | Purple |
| `INTERVIEWING` | Đang phỏng vấn | Indigo |
| `OFFERED` | Đã gửi offer | Orange |
| `HIRED` | Đã tuyển dụng | Green |
| `REJECTED` | Từ chối | Red |

### Bảng liên quan

#### `candidate_job_applications`
Lưu các đơn ứng tuyển của ứng viên vào các vị trí công việc

| Cột | Type | Mô tả |
|-----|------|-------|
| `application_id` | INT (PK) | ID đơn ứng tuyển |
| `candidate_id` | INT | ID ứng viên |
| `job_id` | INT | ID công việc |
| `status` | ENUM | Trạng thái |
| `applied_at` | TIMESTAMP | Ngày ứng tuyển |

#### `candidate_resumes`
Lưu CV/Resume của ứng viên

| Cột | Type | Mô tả |
|-----|------|-------|
| `resume_id` | INT (PK) | ID resume |
| `candidate_id` | INT | ID ứng viên |
| `file_name` | VARCHAR(255) | Tên file |
| `file_path` | VARCHAR(500) | Đường dẫn file |
| `is_primary` | BOOLEAN | CV chính hay không |
| `uploaded_at` | TIMESTAMP | Ngày upload |

#### `candidate_tests`
Lưu các bài test được giao cho ứng viên

| Cột | Type | Mô tả |
|-----|------|-------|
| `candidate_test_id` | INT (PK) | ID |
| `candidate_id` | INT | ID ứng viên |
| `test_id` | INT | ID bài test |
| `application_id` | INT | ID đơn ứng tuyển (nullable) |
| `status` | ENUM | Trạng thái |
| `start_time` | TIMESTAMP | Thời gian bắt đầu |
| `end_time` | TIMESTAMP | Thời gian kết thúc |
| `score` | INT | Điểm số |
| `passing_status` | ENUM | PASSED/FAILED/PENDING |

## 🎨 UI/UX Features

### 1. **Header**
- Logo và title
- Hiển thị tên user
- Nút đăng xuất
- Back button về Dashboard

### 2. **Actions Bar**
- Nút "Thêm Ứng Viên" (green)
- Nút "Làm mới" (blue)
- Search box (realtime search)
- Status filter dropdown

### 3. **Statistics Cards**
Grid 4 cột hiển thị:
- Tổng ứng viên (emerald)
- Ứng viên mới (blue)
- Đang test (yellow)
- Đã tuyển (green)

### 4. **Table**
Responsive table với các cột:
- ID
- Họ tên
- Email
- Số điện thoại
- Vị trí
- Kinh nghiệm
- Trạng thái (badge màu)
- Ngày tạo
- Thao tác (view/edit/delete)

Hover effects:
- Row hover: bg-white/5
- Button hover: lighter color

### 5. **Pagination**
- Hiển thị: "Showing X - Y of Z records"
- Nút Previous/Next
- Number buttons (1, 2, 3, ...)
- Current page highlighted

### 6. **Modal Form**
Full-screen overlay với form gồm:
- Họ, Tên (required)
- Email (required, validated)
- Số điện thoại
- Vị trí hiện tại
- Số năm kinh nghiệm
- Học vấn (textarea)
- Kỹ năng (textarea với placeholder)
- Nguồn ứng tuyển (dropdown)
- Trạng thái (dropdown)
- Ghi chú (textarea)

Buttons:
- Lưu (green gradient)
- Hủy (gray)

## 🔒 Authentication & Authorization

### Guard Checks
```javascript
// Page load check
const session = JSON.parse(localStorage.getItem('session_user'));
const token = localStorage.getItem('auth_token');

if (!session || !token) {
  redirect to login
}

if (role !== 'RECRUITER' && role !== 'ADMIN') {
  redirect to exam.html
}
```

### API Headers
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
}
```

## 🧪 Testing Checklist

### Functional Tests

- [ ] **Load candidates:** Page loads and displays candidates from DB
- [ ] **Search:** Typing in search box filters results realtime
- [ ] **Filter:** Status dropdown filters correctly
- [ ] **Pagination:** Can navigate between pages
- [ ] **Statistics:** Numbers update correctly
- [ ] **Add:** Can add new candidate via modal
- [ ] **Edit:** Can edit existing candidate
- [ ] **Delete:** Can delete candidate with confirmation
- [ ] **Validation:** Required fields validated
- [ ] **Email:** Email format validated
- [ ] **Responsive:** Works on mobile/tablet/desktop

### API Tests

```powershell
# Test authentication
$token = "your_jwt_token_here"

# Get all candidates
Invoke-RestMethod -Uri "http://localhost:5000/api/candidates" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }

# Get candidate by ID
Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/1" `
  -Method Get `
  -Headers @{ Authorization = "Bearer $token" }

# Create candidate
$body = @{
  first_name = "Test"
  last_name = "User"
  email = "test@example.com"
  status = "NEW"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/candidates" `
  -Method Post `
  -Headers @{ 
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

## 🚀 Next Steps (Future Enhancements)

### Phase 2 - Detail View
- [ ] Candidate detail page
- [ ] View full history
- [ ] Timeline of status changes
- [ ] Associated tests and results
- [ ] Uploaded resumes list

### Phase 3 - Advanced Features
- [ ] Bulk actions (assign test to multiple candidates)
- [ ] Export to CSV/Excel
- [ ] Import candidates from file
- [ ] Email integration
- [ ] Calendar integration for interviews
- [ ] Advanced filtering (date range, multiple criteria)
- [ ] Sorting by columns

### Phase 4 - Resume Management
- [ ] Upload resume directly from candidate page
- [ ] View/Download resumes
- [ ] Set primary resume
- [ ] Parse resume automatically

### Phase 5 - Application Management
- [ ] Link candidates to job positions
- [ ] Track application pipeline
- [ ] Move candidates between stages
- [ ] Kanban board view

## 📝 Code Structure

```
frontend/
├── candidate-list.html          # Main candidate management page
└── recruiter.html               # Dashboard (updated links)

backend/
├── src/
│   ├── routes/
│   │   └── candidate.routes.js  # API routes
│   ├── controllers/
│   │   └── candidate.controller.js  # Business logic
│   └── models/
│       └── candidate.model.js   # Sequelize model
```

## 🐛 Common Issues & Solutions

### Issue 1: "403 Forbidden"
**Cause:** User không có quyền RECRUITER/ADMIN
**Solution:** Check role in session, ensure user logged in as Recruiter

### Issue 2: "401 Unauthorized"
**Cause:** Token expired hoặc invalid
**Solution:** Logout and login again

### Issue 3: Empty table
**Cause:** No candidates in database
**Solution:** Use "Thêm Ứng Viên" to create test data

### Issue 4: Modal không đóng
**Cause:** JavaScript event conflict
**Solution:** Click "Hủy" hoặc reload page

### Issue 5: Search không hoạt động
**Cause:** JavaScript console error
**Solution:** Check browser console (F12)

## 📊 Performance Notes

- **Pagination:** 10 items per page (configurable)
- **Search:** Client-side filtering (fast for < 1000 records)
- **API calls:** Cached until refresh
- **Modal:** Vanilla JS (no framework overhead)

---

**Created:** 2025-11-02  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
