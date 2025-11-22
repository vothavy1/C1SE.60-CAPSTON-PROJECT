# 🔔 HƯỚNG DẪN NHANH - Hệ thống Thông báo Admin

## ⚡ CÀI ĐẶT NHANH (3 BƯỚC)

### 1️⃣ Chạy SQL này trong MySQL:

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
```

### 2️⃣ Restart Backend

```powershell
cd backend
npm start
```

### 3️⃣ Kiểm tra Admin Dashboard

- Đăng nhập admin: `http://localhost:3000/admin-login.html`
- Xem icon chuông 🔔 ở góc phải trên
- Badge đỏ hiển thị số thông báo chưa đọc

---

## 🎯 CÁCH HOẠT ĐỘNG

### ❌ Candidate TỰ đăng ký → BỊ CHẶN

1. User đăng ký role "Candidate" → tạo tài khoản `company_id=NULL`
2. Khi đăng nhập → **BỊ CHẶN HOÀN TOÀN** ❌
3. Admin nhận thông báo **CRITICAL** 🔴
4. Admin gán `company_id` cho candidate → Được phép vào ✅

### ⚠️ Recruiter CHƯA CÓ COMPANY → CẢNH BÁO

1. Recruiter đăng ký nhưng không chọn company → `company_id=NULL`
2. Khi đăng nhập → **VẪN VÀO ĐƯỢC** nhưng nhận cảnh báo ⚠️
3. Admin nhận thông báo **HIGH** 🟠
4. Admin gán `company_id` → Hoạt động bình thường ✅

---

## 📱 CÁCH SỬ DỤNG ADMIN DASHBOARD

### Xem thông báo
- Click icon 🔔 → Dropdown hiển thị
- Thông báo chưa đọc có nền xanh
- Badge đỏ = số thông báo chưa đọc

### Đánh dấu đã đọc
- Click "Đánh dấu đã đọc" trên từng thông báo
- Hoặc "Đọc tất cả" để đánh dấu hết

### Xem user liên quan
- Click "Xem User" → Tự động mở Recruiters/Candidates
- Hiển thị modal với chi tiết user

### Xóa thông báo
- "Xóa" → Xóa từng thông báo
- "Xóa đã đọc" → Xóa tất cả đã đọc

---

## 🧪 TEST NHANH

### Test Candidate bị chặn:
```
1. Đăng ký tại: http://localhost:3000/register.html
2. Chọn role "Candidate", để trống Company
3. Đăng nhập → ❌ BỊ CHẶN
4. Admin nhận thông báo 🔴 CRITICAL
5. Admin vào Candidates → Edit → Gán Company
6. Đăng nhập lại → ✅ OK
```

### Test Recruiter cảnh báo:
```
1. Đăng ký role "Recruiter", để trống Company
2. Đăng nhập → ✅ VÀO ĐƯỢC nhưng có cảnh báo
3. Admin nhận thông báo 🟠 HIGH
4. Admin vào Recruiters → Edit → Chọn Company
5. Recruiter làm việc bình thường → ✅ OK
```

---

## 🎨 MÀU SẮC THÔNG BÁO

- 🔴 **CRITICAL** - Đỏ (Candidate bị chặn)
- 🟠 **HIGH** - Cam (Recruiter cần gán company)
- 🟡 **MEDIUM** - Vàng (Cảnh báo thông thường)
- 🔵 **LOW** - Xanh (Thông tin hệ thống)

---

## ❓ TROUBLESHOOTING

**Không thấy icon chuông?**
→ Hard refresh: `Ctrl + Shift + R`

**Badge không cập nhật?**
→ Đợi 30 giây (auto-refresh) hoặc reload trang

**Candidate vẫn vào được?**
→ Kiểm tra đã gán `company_id` chưa. Nếu có rồi thì OK.

**Thông báo không hiển thị?**
→ Kiểm tra đã chạy SQL tạo bảng `admin_notifications` chưa

---

## 📋 CHECKLIST CÀI ĐẶT

- [ ] Đã chạy SQL tạo bảng `admin_notifications`
- [ ] Backend đã restart và không có lỗi
- [ ] Admin dashboard hiển thị icon 🔔
- [ ] Test candidate tự đăng ký → bị chặn
- [ ] Test recruiter chưa company → có cảnh báo
- [ ] Thông báo hiển thị trong dropdown
- [ ] Badge đỏ cập nhật đúng số lượng

---

**✅ DONE! Hệ thống hoạt động!**

📖 Xem chi tiết: `docs/ADMIN-NOTIFICATION-SYSTEM.md`
