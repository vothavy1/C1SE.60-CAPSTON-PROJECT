# ✅ APPLY SYSTEM - HƯỚNG DẪN SỬ DỤNG

## 📋 Tổng Quan

Hệ thống Apply CV cho phép:
- **Ứng viên**: Nộp CV trực tiếp mà không cần đăng ký/đăng nhập
- **Nhà tuyển dụng**: Xem danh sách ứng viên, tải CV, cập nhật trạng thái (Pass/Fail)

---

## 🗂️ CẤU TRÚC HỆ THỐNG

### 1. Database Schema
```sql
-- Bảng candidates (đã có sẵn, được cập nhật)
candidates:
  - candidate_id (PK)
  - first_name
  - last_name  
  - email (unique)
  - phone
  - company_name
  - status: ENUM('NEW', 'SCREENING', 'TESTING', 'INTERVIEWING', 'OFFERED', 'HIRED', 'REJECTED')
  - created_at
  - updated_at

-- Bảng candidate_resumes (lưu file CV)
candidate_resumes:
  - resume_id (PK)
  - candidate_id (FK)
  - resume_type (CV)
  - file_path (/uploads/cv/filename.pdf)
  - file_name (original filename)
  - uploaded_at
```

### 2. Backend API Endpoints

#### POST /api/apply (Public)
**Mô tả**: Nộp CV ứng tuyển
**Auth**: Không cần (public)
**Content-Type**: multipart/form-data
**Body**:
- first_name: string (required)
- last_name: string (required)
- email: string (required)
- phone: string (required)
- company_name: string (optional)
- cv: file (required, .pdf/.doc/.docx, max 5MB)

**Response**:
```json
{
  "success": true,
  "message": "Nộp CV thành công! Chúng tôi sẽ liên hệ với bạn sớm.",
  "data": {
    "candidate_id": 14,
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@test.com",
    "cv_uploaded": true
  }
}
```

#### GET /api/candidates
**Mô tả**: Lấy danh sách ứng viên
**Auth**: Bearer token (RECRUITER/ADMIN)
**Query params**:
- search: string (tìm kiếm theo tên, email, phone)
- status: string (filter theo trạng thái)
- page: number
- limit: number

**Response**:
```json
{
  "success": true,
  "count": 25,
  "total_pages": 2,
  "current_page": 1,
  "data": [
    {
      "candidate_id": 1,
      "first_name": "Nguyen",
      "last_name": "Van A",
      "email": "nguyenvana@test.com",
      "phone": "0912345678",
      "company_name": "ABC Company",
      "status": "NEW",
      "created_at": "2025-11-06T10:30:00.000Z",
      "CandidateResumes": [
        {
          "resume_id": 1,
          "file_path": "/uploads/cv/resume-123.pdf",
          "file_name": "CV_NguyenVanA.pdf",
          "uploaded_at": "2025-11-06T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

#### PUT /api/candidates/:id/status
**Mô tả**: Cập nhật trạng thái ứng viên
**Auth**: Bearer token (RECRUITER/ADMIN)
**Body**:
```json
{
  "status": "HIRED",
  "notes": "Ứng viên xuất sắc"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái từ NEW sang HIRED",
  "data": {
    "candidate_id": 1,
    "full_name": "Nguyen Van A",
    "old_status": "NEW",
    "new_status": "HIRED",
    "updated_at": "2025-11-06T11:00:00.000Z"
  }
}
```

#### GET /api/candidates/:id/cv
**Mô tả**: Tải CV của ứng viên
**Auth**: Bearer token (RECRUITER/ADMIN)
**Response**: File download (PDF/DOC)

---

## 🎨 FRONTEND PAGES

### 1. apply.html (Public - Không cần login)
**URL**: http://localhost:3000/apply.html

**Chức năng**:
- Form nhập thông tin: Họ, Tên, Email, Phone, Company
- Upload CV (PDF/DOC/DOCX, max 5MB)
- Drag & drop file upload
- Submit CV → Lưu vào database

**Cách dùng**:
1. Mở http://localhost:3000/apply.html
2. Điền đầy đủ thông tin cá nhân
3. Click vào box hoặc drag & drop file CV
4. Nhấn "Gửi CV Ứng Tuyển"
5. Thành công → Hiển thị thông báo xanh

**Link từ**:
- index.html (Login page) có nút "Nộp CV ngay →"
- register.html có nút "Nộp CV →"

---

### 2. candidate-management.html (Recruiter Only)
**URL**: http://localhost:3000/candidate-management.html

**Chức năng**:
- Hiển thị danh sách tất cả ứng viên
- Thống kê: Tổng, Mới, Pass, Fail
- Search theo tên/email/phone
- Filter theo trạng thái
- 3 nút action cho mỗi ứng viên:
  - **📄 CV**: Xem/tải file CV
  - **✓ Pass**: Đánh dấu HIRED
  - **✗ Fail**: Đánh dấu REJECTED

**Cách dùng**:
1. Login với tài khoản Recruiter
2. Mở http://localhost:3000/candidate-management.html
3. Xem danh sách ứng viên
4. Click "📄 CV" để mở CV trong tab mới
5. Click "✓ Pass" để chấp nhận ứng viên
6. Click "✗ Fail" để từ chối ứng viên
7. Danh sách tự động reload sau khi cập nhật

---

## 🧪 TESTING

### Test 1: Public Apply (Không cần login)
```bash
# Mở browser
http://localhost:3000/apply.html

# Fill form
First name: Nguyen
Last name: Van Test
Email: test@example.com
Phone: 0912345678
Company: Test Corp

# Upload CV file (any PDF)
# Click Submit
# Expect: Success message
```

### Test 2: Recruiter View Candidates
```bash
# Login as recruiter
http://localhost:3000/index.html
Email: recruiter.vy@gmail.com
Password: 123456

# Open management page
http://localhost:3000/candidate-management.html

# Should see:
- Statistics cards (Total, New, Pass, Fail)
- Table with all candidates
- CV/Pass/Fail buttons
```

### Test 3: Update Status
```bash
# On candidate-management.html
1. Click "✓ Pass" on any candidate
2. Confirm dialog
3. See success alert
4. Table refreshes, status changed to "Đã tuyển"

# Try Fail
1. Click "✗ Fail" on another candidate  
2. Confirm dialog
3. Status changes to "Từ chối"
```

### Test 4: Download CV
```bash
# On candidate-management.html
1. Click "📄 CV" button
2. New tab opens with CV file
3. File downloads automatically
```

---

## 📁 FILES CREATED/MODIFIED

### Backend
```
✅ backend/src/controllers/apply.controller.js (NEW)
   - applyJob() - Handle CV upload
   - getCandidates() - List candidates with CV
   - updateCandidateStatus() - Update Pass/Fail
   - getCandidateCV() - Download CV file

✅ backend/src/routes/apply.routes.js (NEW)
   - POST /apply (public)
   - GET /candidates (auth)
   - PUT /candidates/:id/status (auth)
   - GET /candidates/:id/cv (auth)

✅ backend/src/routes/index.js (MODIFIED)
   - Register apply routes

✅ backend/uploads/cv/ (Directory for CV files)
```

### Frontend
```
✅ frontend/apply.html (NEW)
   - Public apply form
   - File upload with drag & drop
   - Form validation
   - Success message

✅ frontend/candidate-management.html (NEW)
   - Simple candidate management UI
   - View/Download CV
   - Pass/Fail buttons
   - Real-time status update

✅ frontend/index.html (MODIFIED)
   - Added link to apply.html

✅ frontend/register.html (MODIFIED)
   - Added link to apply.html
```

### Database
```
✅ database/init/03-add-apply-system.sql (NEW)
   - Migration script (already run)
   - Adds columns: phone, company_name
   - Status already exists with proper ENUM values
```

### Test Scripts
```
✅ test-apply-simple.ps1
   - Quick test script
   - Check backend status
   - List recruiters
   - Manual test guide
```

---

## 🔐 SECURITY

### Public Access
- `/api/apply` - Anyone can submit CV
- No authentication required for applying
- File validation: Only PDF, DOC, DOCX
- Max file size: 5MB

### Protected Routes
- All other endpoints require JWT token
- Only RECRUITER and ADMIN roles can:
  - View candidates list
  - Download CVs
  - Update candidate status

### File Security
- Files stored in `backend/uploads/cv/`
- Unique filenames (timestamp + random)
- Direct file access blocked (served via API only)

---

## 🎯 WORKFLOW

### Ứng Viên (Candidate Flow)
```
1. Visit website (no account needed)
2. Open apply.html
3. Fill form + upload CV
4. Submit
5. Receive confirmation
6. Wait for company contact
```

### Nhà Tuyển Dụng (Recruiter Flow)
```
1. Login to system
2. Open candidate-management.html
3. View all applications
4. Download and review CVs
5. Mark candidates as:
   - NEW (default)
   - SCREENING (reviewing)
   - TESTING (send test)
   - INTERVIEWING (schedule interview)
   - OFFERED (make offer)
   - HIRED (accept, Pass) ✓
   - REJECTED (reject, Fail) ✗
6. System tracks all status changes
```

---

## ✅ CHECKLIST

- [x] Database migration completed
- [x] Backend API endpoints working
- [x] File upload with multer configured
- [x] Public apply form created
- [x] Recruiter management page created
- [x] CV download functionality
- [x] Status update (Pass/Fail)
- [x] Links added to login/register pages
- [x] Security: Auth middleware applied
- [x] Test script created

---

## 🚀 READY TO USE!

Hệ thống Apply đã sẵn sàng. Bạn có thể:

1. **Thử nghiệm ngay**: Mở http://localhost:3000/apply.html
2. **Quản lý ứng viên**: Login → http://localhost:3000/candidate-management.html
3. **Xem candidate đã có**: http://localhost:3000/candidate-list.html (full features)

Tất cả API đã hoạt động, frontend đã connect, database đã cập nhật! 🎉
