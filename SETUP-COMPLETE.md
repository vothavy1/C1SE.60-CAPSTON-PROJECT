# ✅ HỆ THỐNG THÔNG BÁO ADMIN - HOÀN THÀNH

## 🎯 CÀI ĐẶT (2 PHÚT)

### Bước 1: Chạy SQL (QUAN TRỌNG!)
Mở **MySQL Workbench** hoặc **phpMyAdmin**, copy và chạy SQL này:

```sql
USE cs60;

CREATE TABLE IF NOT EXISTS admin_notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('UNAUTHORIZED_CANDIDATE', 'RECRUITER_NO_COMPANY', 'SYSTEM_ALERT') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_user_id INT NULL,
  related_data JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_is_read (is_read),
  FOREIGN KEY (related_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO admin_notifications (type, title, message, priority) 
VALUES ('SYSTEM_ALERT', 'Hệ thống thông báo đã kích hoạt', 
'Hệ thống thông báo admin đã được cài đặt thành công.', 'LOW');
```

### Bước 2: Kiểm tra
1. Mở: http://localhost:3000/admin-login.html
2. Đăng nhập admin
3. Xem icon chuông 🔔 ở header (góc phải)
4. Click vào chuông → Xem thông báo

---

## 🚀 CÁCH HOẠT ĐỘNG

### ❌ Candidate tự đăng ký → BỊ CHẶN
1. User đăng ký role "Candidate" (không chọn company)
2. Đăng nhập → **BỊ CHẶN** với message: "Tài khoản chưa được kích hoạt"
3. Admin nhận thông báo 🔴 CRITICAL
4. Admin gán company cho candidate → OK

### ⚠️ Recruiter chưa company → CẢNH BÁO
1. User đăng ký role "Recruiter" (không chọn company)
2. Đăng nhập → **VÀO ĐƯỢC** nhưng có warning
3. Admin nhận thông báo 🟠 HIGH
4. Admin gán company cho recruiter → Full access

---

## 🧪 TEST NGAY

### Test 1: Candidate bị chặn
```
1. http://localhost:3000/register.html
2. Đăng ký: role=Candidate, company=empty
3. Đăng nhập → ❌ Blocked
4. Admin xem thông báo → Có 1 notification mới
```

### Test 2: Admin xem thông báo
```
1. http://localhost:3000/admin-login.html
2. Login admin
3. Click icon 🔔
4. Xem dropdown notifications
```

---

## 📂 FILES ĐÃ TẠO

```
✅ backend/src/models/adminNotification.model.js
✅ backend/src/controllers/notification.controller.js
✅ backend/src/routes/admin.routes.js (updated)
✅ backend/src/models/index.js (updated)
✅ backend/src/controllers/auth.controller.js (updated)
✅ frontend/admin-dashboard.html (updated với UI notification)
✅ database/INSTALL-NOTIFICATION-SYSTEM.sql
✅ docs/ADMIN-NOTIFICATION-SYSTEM.md
✅ QUICK-START-NOTIFICATIONS.md
✅ TEST-NOTIFICATION-SYSTEM.html
```

---

## 🎨 GIAO DIỆN

- **Icon chuông 🔔**: Header admin dashboard (góc phải)
- **Badge đỏ**: Số thông báo chưa đọc
- **Dropdown**: Click chuông → Panel thông báo
- **Màu sắc**: 
  - 🔴 CRITICAL (Candidate blocked)
  - 🟠 HIGH (Recruiter no company)
  - 🟡 MEDIUM
  - 🔵 LOW

---

## 🔧 API ENDPOINTS

```javascript
GET    /api/admin/notifications              // Lấy tất cả
GET    /api/admin/notifications/unread-count // Đếm chưa đọc
PUT    /api/admin/notifications/:id/read     // Đánh dấu đã đọc
PUT    /api/admin/notifications/read-all     // Đánh dấu tất cả
DELETE /api/admin/notifications/:id          // Xóa 1 cái
DELETE /api/admin/notifications/read         // Xóa đã đọc
```

---

## ❓ TROUBLESHOOTING

**Không thấy icon chuông?**
→ Ctrl+Shift+R (hard refresh)

**Backend lỗi?**
→ Restart backend: `cd backend && npm start`

**SQL lỗi?**
→ Kiểm tra đã chạy trong database `cs60` chưa

**Candidate vẫn vào được?**
→ Check: candidate đã có `company_id` = được admin gán rồi

---

## ✨ XONG!

Hệ thống hoạt động tự động:
- ✅ Candidate tự đăng ký → Bị chặn + Admin nhận thông báo
- ✅ Recruiter chưa company → Cảnh báo + Admin nhận thông báo
- ✅ Real-time badge updates (30 giây)
- ✅ Click thông báo → Xem user detail

**CHỈ CẦN CHẠY SQL LÀ XONG!** 🎉
