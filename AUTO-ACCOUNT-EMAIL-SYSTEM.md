# Hệ Thống Tự Động Tạo Tài Khoản & Gửi Email

## 📋 Tổng Quan

Hệ thống tự động tạo tài khoản và gửi email cho ứng viên khi nhà tuyển dụng phê duyệt CV.

## 🎯 Chức Năng

### 1. Tự Động Tạo Tài Khoản
- **Username**: Email của ứng viên
- **Password**: Random 10 ký tự (chữ hoa + chữ thường + số + ký tự đặc biệt)
- **Role**: Candidate (role_id = 4)
- **Status**: Active (is_active = true)

### 2. Tự Động Gửi Email
Khi nhà tuyển dụng cập nhật trạng thái CV:

#### ✅ CV ĐƯỢC DUYỆT (HIRED/OFFERED)
- Tạo tài khoản mới (nếu chưa có)
- Gửi email chúc mừng kèm:
  - Thông tin đăng nhập
  - Link đăng nhập: http://localhost:3000/login
  - Hướng dẫn các bước tiếp theo

#### ❌ CV BỊ TỪ CHỐI (REJECTED)
- Gửi email thông báo từ chối
- Khuyến khích ứng tuyển lại trong tương lai

## 🔧 Cấu Hình

### File `.env`
```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vothavy1@dtu.edu.vn
SMTP_PASSWORD=usljngpjzywrrkzj
SMTP_FROM='CS60 Recruitment' <vothavy1@dtu.edu.vn>
FRONTEND_URL=http://localhost:3000
```

## 📝 Ví Dụ Mật Khẩu Random

```
Ed0Bol%lSK
Yz68pIk%OR
9HS%f0jo%G
%QS9i6zDCj
z3v$BPJ3ap
```

**Đặc điểm:**
- Độ dài: 10 ký tự
- Bao gồm: A-Z, a-z, 0-9, @#$%
- Bảo mật cao

## 📧 Mẫu Email Phê Duyệt

### Subject
```
🎉 Chúc mừng! CV của bạn đã được chấp nhận
```

### Nội dung chính
```
Xin chào [Tên ứng viên],

Chúng tôi rất vui mừng thông báo rằng CV của bạn đã được chấp nhận!

🔐 Thông tin đăng nhập của bạn:
👤 Tên đăng nhập: [email@example.com]
🔑 Mật khẩu: [Ed0Bol%lSK]

⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu!

Các bước tiếp theo:
1. Đăng nhập vào hệ thống
2. Hoàn thiện hồ sơ cá nhân
3. Làm các bài test đánh giá năng lực (nếu có)
4. Chờ thông báo về các vòng phỏng vấn tiếp theo

[Nút: Đăng nhập ngay]
```

## 🚀 Cách Sử Dụng

### Bước 1: Nhà tuyển dụng đăng nhập
```
URL: http://localhost:3000/login
Username: recruiter_test
Password: Test123456
```

### Bước 2: Xem danh sách ứng viên
```
URL: http://localhost:3000/candidate-management.html
```

### Bước 3: Phê duyệt CV
1. Tìm ứng viên cần phê duyệt
2. Click nút "Phê duyệt" hoặc đổi status sang "HIRED"
3. Hệ thống tự động:
   - ✓ Tạo tài khoản (username = email)
   - ✓ Tạo mật khẩu random
   - ✓ Gửi email thông báo

### Bước 4: Ứng viên nhận email và đăng nhập
1. Kiểm tra email
2. Lấy thông tin đăng nhập
3. Truy cập: http://localhost:3000/login
4. Đăng nhập với email và mật khẩu đã nhận

## 🔍 Test Chức Năng

### Test 1: Generate Random Password
```bash
cd backend
node test-auto-account-email.js
```

### Test 2: Test SMTP Connection
```bash
cd backend
node test-smtp-direct.js
```

### Test 3: Phê duyệt CV thực tế
1. Vào trang quản lý ứng viên
2. Chọn 1 ứng viên
3. Đổi status sang "HIRED"
4. Kiểm tra:
   - Console backend: Xem log tạo account
   - Email: Kiểm tra inbox ứng viên
   - Database: Xem bảng `users` có thêm record mới

## 📊 Database

### Bảng `users`
```sql
SELECT user_id, username, email, full_name, role_id, is_active 
FROM users 
WHERE role_id = 4 
ORDER BY created_at DESC 
LIMIT 5;
```

### Bảng `candidates`
```sql
SELECT candidate_id, first_name, last_name, email, user_id, status 
FROM candidates 
WHERE status IN ('HIRED', 'OFFERED') 
ORDER BY updated_at DESC;
```

## 🐛 Troubleshooting

### Email không được gửi
**Kiểm tra:**
1. Backend logs: `backend/logs/error.log`
2. SMTP config trong `.env`
3. Gmail App Password còn hợp lệ
4. Restart backend sau khi sửa `.env`

**Fix:**
```bash
# Restart backend
Get-Process node | Stop-Process -Force
cd backend
npm start
```

### Tài khoản không được tạo
**Kiểm tra:**
1. Ứng viên đã có `user_id` chưa
2. Email đã tồn tại trong bảng `users` chưa
3. Backend logs

**Query kiểm tra:**
```sql
-- Kiểm tra ứng viên có tài khoản chưa
SELECT c.candidate_id, c.email, c.user_id, u.username 
FROM candidates c 
LEFT JOIN users u ON c.user_id = u.user_id 
WHERE c.email = 'test@example.com';
```

### Email đến spam
**Giải pháp:**
1. Kiểm tra spam folder
2. Đánh dấu email không phải spam
3. Thêm sender vào danh bạ

## 📝 Code Reference

### Files liên quan:
- `backend/src/services/account.service.js` - Tạo tài khoản
- `backend/src/services/email.service.js` - Gửi email
- `backend/src/controllers/apply.controller.js` - Logic phê duyệt
- `backend/.env` - Cấu hình

### API Endpoint:
```
PUT /api/candidates/:id/status
Body: { status: "HIRED" | "REJECTED" }
```

## ✅ Checklist Triển Khai

- [x] Cấu hình SMTP trong `.env`
- [x] Test SMTP connection
- [x] Test tạo mật khẩu random
- [x] Test gửi email
- [x] Test tạo tài khoản tự động
- [x] Test quy trình phê duyệt CV
- [x] Kiểm tra email đến inbox
- [x] Kiểm tra ứng viên đăng nhập được

## 🎉 Kết Luận

Hệ thống đã hoàn chỉnh và sẵn sàng sử dụng! Nhà tuyển dụng chỉ cần click "Phê duyệt", phần còn lại hệ thống tự động xử lý.
