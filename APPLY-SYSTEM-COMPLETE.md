# ✅ HỆ THỐNG APPLY CV ĐÃ HOÀN THÀNH

## 📋 Tổng Quan

Hệ thống Apply CV cho phép ứng viên nộp CV trực tiếp **không cần đăng nhập**, và Recruiter/Admin quản lý ứng viên với đầy đủ chức năng Pass/Fail.

---

## 🗄️ 1. Database Changes

### Migration Script: `database/init/03-add-apply-system.sql`

**Columns Added to `candidates` table:**
- `phone` VARCHAR(20) - Số điện thoại
- `company_name` VARCHAR(255) - Tên công ty hiện tại
- `status` ENUM - Trạng thái ứng viên:
  - NEW (Mới)
  - SCREENING (Sàng lọc)
  - TESTING (Đang test)
  - INTERVIEWING (Phỏng vấn)
  - OFFERED (Đã offer)
  - HIRED (Đã tuyển / Pass)
  - REJECTED (Từ chối / Fail)
- `updated_at` TIMESTAMP - Thời gian cập nhật

**Index Added:**
- `idx_candidate_status` on `status` column

---

## 🔧 2. Backend API

### File Structure:
```
backend/src/
├── controllers/
│   └── apply.controller.js   (NEW)
└── routes/
    └── apply.routes.js        (NEW)
```

### Endpoints Created:

#### 📤 POST `/api/apply` (Public)
**Purpose**: Upload CV và tạo hồ sơ ứng viên

**Request**: `multipart/form-data`
```javascript
{
  first_name: string,    // required
  last_name: string,     // required
  email: string,         // required
  phone: string,         // required
  company_name: string,  // optional
  cv: file              // required (.pdf, .doc, .docx, max 5MB)
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Nộp CV thành công!",
  "data": {
    "candidate_id": 14,
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "cv_uploaded": true
  }
}
```

---

#### 📋 GET `/api/candidates` (Recruiter/Admin)
**Purpose**: Lấy danh sách ứng viên

**Query Params**:
- `status`: Filter by status (optional)
- `search`: Search by name, email, phone (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response**:
```json
{
  "success": true,
  "count": 15,
  "total_pages": 1,
  "current_page": 1,
  "data": [
    {
      "candidate_id": 1,
      "first_name": "Nguyen",
      "last_name": "Van A",
      "email": "nguyenvana@test.com",
      "phone": "0912345678",
      "company_name": "ABC Corp",
      "status": "NEW",
      "created_at": "2025-11-06T10:00:00.000Z",
      "CandidateResumes": [
        {
          "resume_id": 1,
          "file_path": "/uploads/cv/cv-1699999999-123456789.pdf",
          "file_name": "NguyenVanA_CV.pdf"
        }
      ]
    }
  ]
}
```

---

#### ✏️ PUT `/api/candidates/:id/status` (Recruiter/Admin)
**Purpose**: Cập nhật trạng thái ứng viên (Pass/Fail)

**Request Body**:
```json
{
  "status": "HIRED",  // or "REJECTED"
  "notes": "Optional notes"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái từ 'NEW' sang 'HIRED'",
  "data": {
    "candidate_id": 1,
    "full_name": "Nguyen Van A",
    "old_status": "NEW",
    "new_status": "HIRED"
  }
}
```

---

#### 📄 GET `/api/candidates/:id/cv` (Recruiter/Admin)
**Purpose**: Tải xuống/Xem CV của ứng viên

**Response**: File download (PDF/DOC/DOCX)

---

## 🎨 3. Frontend Pages

### 📝 `apply.html` - Trang Apply CV (Public)

**URL**: `http://localhost:3000/apply.html`

**Features**:
- ✅ Form upload CV (drag & drop support)
- ✅ Validate file type (.pdf, .doc, .docx)
- ✅ Validate file size (max 5MB)
- ✅ Success message after submission
- ✅ No authentication required
- ✅ Responsive design với Tailwind CSS

**Fields**:
- Họ (first_name) *
- Tên (last_name) *
- Email *
- Số điện thoại *
- Công ty hiện tại (optional)
- Upload CV *

---

### 👥 `candidate-management.html` - Quản Lý Ứng Viên (Recruiter/Admin)

**URL**: `http://localhost:3000/candidate-management.html`

**Features**:
- ✅ Statistics cards (Tổng, Mới, Pass, Fail)
- ✅ Search by name/email/phone
- ✅ Filter by status
- ✅ Table view with actions:
  - **📄 CV** - Xem/Tải CV
  - **✓ Pass** - Cập nhật status = HIRED
  - **✗ Fail** - Cập nhật status = REJECTED
- ✅ Real-time reload after status update
- ✅ Protected route (requires login)

**Status Badges**:
- NEW: Blue badge
- SCREENING: Yellow badge
- TESTING: Purple badge
- INTERVIEWING: Indigo badge
- OFFERED: Cyan badge
- HIRED: Green badge (Pass)
- REJECTED: Red badge (Fail)

---

## 🔗 4. Integration Points

### Updated Pages:
1. **`index.html`** (Login page)
   - Added link: "Ứng tuyển công việc? Nộp CV ngay →"

2. **`register.html`** (Register page)
   - Added link: "Chỉ muốn ứng tuyển? Nộp CV →"

3. **`backend/src/routes/index.js`**
   - Registered apply routes at root level

---

## 🧪 5. Testing

### Test Script: `test-apply-system.ps1`

**Run**:
```powershell
cd "d:\CAPSTON C1SE.60\CS.60"
.\test-apply-system.ps1
```

### Manual Testing:

#### Test Apply Form:
1. Open: `http://localhost:3000/apply.html`
2. Fill in form:
   - Họ: Nguyễn
   - Tên: Văn A
   - Email: test@example.com
   - Phone: 0912345678
   - Upload test CV (PDF)
3. Click "Gửi CV Ứng Tuyển"
4. Should see success message

#### Test Candidate Management:
1. Login as Recruiter at `http://localhost:3000/index.html`
2. Go to: `http://localhost:3000/candidate-management.html`
3. Should see list of candidates
4. Click **📄 CV** to view/download CV
5. Click **✓ Pass** to mark as HIRED
6. Click **✗ Fail** to mark as REJECTED
7. List auto-refreshes after status change

---

## 📊 6. File Upload Configuration

### Multer Settings:
- **Upload Directory**: `backend/uploads/cv/`
- **Allowed Types**: `.pdf`, `.doc`, `.docx`
- **Max File Size**: 5MB
- **Filename Format**: `originalname-timestamp-random.ext`

### Storage Path in DB:
```
/uploads/cv/NguyenVanA_CV-1699999999-123456789.pdf
```

---

## 🔐 7. Security & Permissions

### Public Endpoints:
- `POST /api/apply` - Anyone can apply

### Protected Endpoints (Recruiter/Admin only):
- `GET /api/candidates`
- `PUT /api/candidates/:id/status`
- `GET /api/candidates/:id/cv`

### Authorization Middleware:
```javascript
authenticate, authorize(['ADMIN', 'RECRUITER'])
```

---

## 📁 8. Files Created/Modified

### New Files:
```
backend/src/controllers/apply.controller.js
backend/src/routes/apply.routes.js
database/init/03-add-apply-system.sql
frontend/apply.html
frontend/candidate-management.html
test-apply-system.ps1
```

### Modified Files:
```
backend/src/routes/index.js
frontend/index.html
frontend/register.html
```

---

## 🚀 9. Deployment URLs

### Frontend:
- Apply form: `http://localhost:3000/apply.html`
- Candidate management: `http://localhost:3000/candidate-management.html`

### Backend API:
- Base URL: `http://localhost:5000/api`
- Apply endpoint: `http://localhost:5000/api/apply`
- Candidates endpoint: `http://localhost:5000/api/candidates`

---

## ✅ 10. Checklist

- ✅ Database migration executed
- ✅ Backend controllers created
- ✅ Backend routes registered
- ✅ API endpoints working
- ✅ Frontend apply form created
- ✅ Frontend management page created
- ✅ File upload with multer working
- ✅ CV storage directory created
- ✅ Status update functionality working
- ✅ CV download/view working
- ✅ Links added to login/register pages
- ✅ Test script created
- ✅ Documentation completed

---

## 🎉 System Ready!

Hệ thống Apply CV đã sẵn sàng sử dụng. Người dùng có thể:
1. **Apply** CV qua `apply.html` (không cần login)
2. **Recruiter** xem danh sách và quản lý ứng viên qua `candidate-management.html`
3. **Pass/Fail** ứng viên với 1 click
4. **View/Download** CV của ứng viên
