# 📧 HỆ THỐNG GỬI EMAIL TỰ ĐỘNG CHO ỨNG VIÊN

## 📋 TỔNG QUAN

Hệ thống tự động gửi email khi nhà tuyển dụng duyệt CV (PASS/FAIL):

### ✅ PASS - Ứng viên được chấp nhận
- **Tự động tạo tài khoản** với username và password ngẫu nhiên
- **Gửi email thông báo đậu CV** kèm thông tin đăng nhập
- Email chứa: Username, Password, link đăng nhập, hướng dẫn bước tiếp theo

### ❌ FAIL - Ứng viên bị từ chối
- **Gửi email thông báo từ chối** một cách lịch sự
- Email khuyến khích ứng viên thử lại trong tương lai

---

## 🔧 CÀI ĐẶT

### 1. Cài đặt package nodemailer

```bash
cd backend
npm install
```

Package `nodemailer` và `uuid` đã được thêm vào `package.json`.

### 2. Cấu hình SMTP trong file `.env`

File `.env` đã được cấu hình với Gmail SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vothavy1@dtu.edu.vn
SMTP_PASSWORD=uslj ngpj zywrrk zj
SMTP_FROM="CS.60 Tuyển Dụng" <vothavy1@dtu.edu.vn>
FRONTEND_URL=http://localhost:5500
```

**⚠️ LƯU Ý**: 
- `SMTP_PASSWORD` là **App Password** của Gmail (không phải mật khẩu thường)
- Đảm bảo đã bật **2-Step Verification** và tạo **App Password** trên Gmail

### 3. Cấu trúc file đã tạo

```
backend/src/
├── services/
│   ├── email.service.js       # Service gửi email
│   └── account.service.js     # Service tạo tài khoản tự động
└── controllers/
    └── apply.controller.js    # Controller đã được cập nhật
```

---

## 🚀 CÁCH SỬ DỤNG

### API Endpoint: Duyệt CV

**PUT** `/api/candidates/:id/status`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "status": "HIRED",
  "notes": "Ứng viên xuất sắc, đạt yêu cầu"
}
```

**Các trạng thái hợp lệ:**
- `NEW` - Mới nộp CV
- `SCREENING` - Đang sàng lọc
- `TESTING` - Đang làm bài test
- `INTERVIEWING` - Đang phỏng vấn
- `OFFERED` - Đã offer (PASS - gửi email + tạo tài khoản)
- `HIRED` - Đã tuyển (PASS - gửi email + tạo tài khoản)
- `REJECTED` - Từ chối (FAIL - gửi email từ chối)

---

## 📨 NỘI DUNG EMAIL MẪU

### ✅ Email PASS (Được chấp nhận)

**Subject:** 🎉 Chúc mừng! CV của bạn đã được chấp nhận

**Nội dung:**
- Thông báo đậu CV
- Thông tin đăng nhập (Username & Password)
- Cảnh báo đổi mật khẩu sau khi đăng nhập
- Hướng dẫn các bước tiếp theo
- Link đăng nhập vào hệ thống

### ❌ Email FAIL (Bị từ chối)

**Subject:** Thông báo về đơn ứng tuyển của bạn

**Nội dung:**
- Thông báo từ chối lịch sự
- Giải thích lý do có thể (không phù hợp yêu cầu hiện tại)
- Khuyến khích ứng viên thử lại trong tương lai
- Lời chúc thành công

---

## 🔐 TỰ ĐỘNG TẠO TÀI KHOẢN

### Quy tắc tạo Username
- Format: `<phần trước @ trong email><số ngẫu nhiên 3 chữ số>`
- Ví dụ: `vothavy1@dtu.edu.vn` → `vothavy1456`

### Quy tắc tạo Password
- Độ dài: 10 ký tự
- Bao gồm: Chữ hoa + chữ thường + số + ký tự đặc biệt (@#$%)
- Ví dụ: `Ab3@xY9#mK`

### Role mặc định
- User được tạo với role: **CANDIDATE**
- Có quyền truy cập hệ thống để làm bài test và xem kết quả

---

## 📊 RESPONSE API

### Success Response - PASS (HIRED/OFFERED)

```json
{
  "success": true,
  "message": "Đã tạo tài khoản và gửi email thông báo",
  "data": {
    "candidate_id": 123,
    "full_name": "Vo Tha Vy",
    "email": "vothavy1@dtu.edu.vn",
    "old_status": "SCREENING",
    "new_status": "HIRED",
    "updated_at": "2025-11-07T10:30:00.000Z",
    "email_sent": true,
    "account_created": true,
    "username": "vothavy1456"
  }
}
```

### Success Response - FAIL (REJECTED)

```json
{
  "success": true,
  "message": "Đã gửi email thông báo từ chối",
  "data": {
    "candidate_id": 124,
    "full_name": "Nguyen Van A",
    "email": "nguyenvana@example.com",
    "old_status": "SCREENING",
    "new_status": "REJECTED",
    "updated_at": "2025-11-07T10:35:00.000Z",
    "email_sent": true
  }
}
```

---

## 🧪 TEST SYSTEM

### 1. Test gửi email PASS

```bash
# PowerShell
$token = "your_token_here"
$candidateId = 1

$body = @{
    status = "HIRED"
    notes = "Test email system - PASS"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/$candidateId/status" `
  -Method PUT `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body
```

### 2. Test gửi email FAIL

```bash
# PowerShell
$token = "your_token_here"
$candidateId = 2

$body = @{
    status = "REJECTED"
    notes = "Test email system - FAIL"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/candidates/$candidateId/status" `
  -Method PUT `
  -Headers @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" } `
  -Body $body
```

---

## 🐛 TROUBLESHOOTING

### Lỗi: Email không được gửi

**Kiểm tra:**
1. SMTP credentials trong `.env` có đúng không
2. Gmail App Password đã được tạo chưa
3. Kiểm tra logs: `backend/logs/error.log`
4. Kiểm tra console log khi chạy backend

### Lỗi: Account không được tạo

**Kiểm tra:**
1. Candidate đã có `user_id` chưa (không tạo nếu đã có)
2. Email đã tồn tại trong bảng `users` chưa
3. Kiểm tra logs: `backend/logs/combined.log`

### Lỗi: nodemailer not found

**Giải pháp:**
```bash
cd backend
npm install nodemailer uuid
```

---

## 📝 LOGS

Hệ thống log chi tiết tại:
- `backend/logs/error.log` - Chỉ lỗi
- `backend/logs/combined.log` - Tất cả logs

**Log entries:**
- ✅ Email sent successfully
- ❌ Email failed to send
- 📝 Account created
- 🎉 Candidate PASSED
- ❌ Candidate REJECTED

---

## 🔒 BẢO MẬT

### App Password Gmail
1. Truy cập: https://myaccount.google.com/security
2. Bật **2-Step Verification**
3. Vào **App passwords**
4. Chọn **Mail** và **Other**
5. Copy password (không có khoảng trắng) vào `.env`

### Lưu ý bảo mật
- **Không commit file `.env`** lên Git
- Password được hash bằng bcrypt trước khi lưu DB
- Email chứa password chỉ gửi 1 lần duy nhất

---

## 🎯 WORKFLOW HOÀN CHỈNH

```
1. Ứng viên nộp CV
   ↓
2. Nhà tuyển dụng xem CV
   ↓
3. Nhà tuyển dụng quyết định:
   
   ✅ PASS (HIRED/OFFERED)
   ├─ Hệ thống kiểm tra: Candidate đã có user_id chưa?
   │  ├─ Chưa: Tạo tài khoản mới
   │  │  ├─ Generate username từ email
   │  │  ├─ Generate random password
   │  │  ├─ Hash password và lưu DB
   │  │  └─ Link user_id với candidate
   │  └─ Đã có: Bỏ qua tạo tài khoản
   ├─ Gửi email thông báo đậu CV + thông tin đăng nhập
   └─ Response: account_created: true, email_sent: true
   
   ❌ FAIL (REJECTED)
   ├─ Gửi email thông báo từ chối lịch sự
   └─ Response: email_sent: true
   
4. Ứng viên nhận email
   ↓
5. PASS: Đăng nhập và làm bài test
   FAIL: Có thể ứng tuyển lại sau
```

---

## 👨‍💻 DEVELOPER NOTES

### Services đã tạo

**1. email.service.js**
- `sendApprovalEmail(email, name, username, password)` - Gửi email đậu
- `sendRejectionEmail(email, name, position)` - Gửi email trượt
- `sendNotificationEmail(to, subject, html)` - Gửi email tổng quát

**2. account.service.js**
- `generateRandomPassword()` - Tạo password ngẫu nhiên
- `generateUsername(email)` - Tạo username từ email
- `createCandidateAccount(candidate)` - Tạo tài khoản tự động
- `needsAccountCreation(candidate)` - Kiểm tra cần tạo tài khoản không

### Controller đã cập nhật

**apply.controller.js**
- Hàm `updateCandidateStatus` đã được nâng cấp
- Tích hợp email service và account service
- Xử lý lỗi email riêng biệt (không ảnh hưởng update status)

---

## ✨ FEATURES

- ✅ Tự động tạo tài khoản khi PASS
- ✅ Gửi email thông báo kèm credentials
- ✅ Gửi email từ chối lịch sự khi FAIL
- ✅ HTML email đẹp mắt, responsive
- ✅ Log chi tiết toàn bộ quá trình
- ✅ Xử lý lỗi không ảnh hưởng update status
- ✅ Kiểm tra duplicate account
- ✅ Password mạnh và an toàn
- ✅ Username unique tự động

---

## 📞 HỖ TRỢ

Nếu gặp vấn đề, kiểm tra:
1. Console log backend
2. File `backend/logs/error.log`
3. Gmail SMTP settings
4. Network connectivity

**Liên hệ:** vothavy1@dtu.edu.vn

---

**🎉 Hệ thống đã sẵn sàng sử dụng!**
