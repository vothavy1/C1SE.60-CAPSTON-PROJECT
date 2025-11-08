# 📋 Apply System - Quick Start

## Tính Năng
✅ Ứng viên nộp CV không cần đăng ký  
✅ Nhà tuyển dụng xem danh sách và quản lý  
✅ Tải CV, cập nhật trạng thái Pass/Fail  

## 🚀 Sử Dụng Nhanh

### 1. Ứng Viên Nộp CV
```
URL: http://localhost:3000/apply.html

Bước:
1. Điền họ, tên, email, phone
2. Upload CV (PDF/DOC, max 5MB)
3. Click "Gửi CV"
4. Nhận thông báo thành công
```

### 2. Nhà Tuyển Dụng Quản Lý
```
Login: http://localhost:3000/index.html
Management: http://localhost:3000/candidate-management.html

Chức năng:
- Xem danh sách ứng viên
- Tải CV về
- Đánh dấu Pass/Fail
- Tìm kiếm và lọc
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /api/apply | ❌ Public | Nộp CV |
| GET | /api/candidates | ✅ Recruiter | Danh sách ứng viên |
| PUT | /api/candidates/:id/status | ✅ Recruiter | Cập nhật trạng thái |
| GET | /api/candidates/:id/cv | ✅ Recruiter | Tải CV |

## 📁 Files

### Backend
- `backend/src/controllers/apply.controller.js` - Main logic
- `backend/src/routes/apply.routes.js` - Routes
- `backend/uploads/cv/` - CV storage

### Frontend  
- `frontend/apply.html` - Public form
- `frontend/candidate-management.html` - Management UI

### Database
- `database/init/03-add-apply-system.sql` - Migration

## ✅ Status Flow
```
NEW → SCREENING → TESTING → INTERVIEWING → OFFERED → HIRED ✓
                                                   ↓ REJECTED ✗
```

## 🧪 Test
```powershell
.\test-apply-simple.ps1
```

Chi tiết: Xem `docs/APPLY-SYSTEM-GUIDE.md`
