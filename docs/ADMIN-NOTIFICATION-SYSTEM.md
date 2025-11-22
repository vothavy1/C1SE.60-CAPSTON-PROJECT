# 🔔 Hệ thống Thông báo Admin

## 📋 Tổng quan

Hệ thống thông báo tự động cho Admin để giám sát các hoạt động bất thường:

### 🎯 Tính năng chính

1. **Chặn Candidate tự đăng ký** ❌
   - Candidate từ bên ngoài tự đăng ký sẽ KHÔNG được phép đăng nhập
   - Admin nhận thông báo ngay lập tức khi có candidate cố gắng đăng nhập
   - Candidate phải được Admin gán công ty (company_id) trước khi được phép vào hệ thống

2. **Cảnh báo Recruiter chưa có công ty** ⚠️
   - Khi Recruiter đăng ký/đăng nhập nhưng chưa có company_id
   - Admin nhận thông báo yêu cầu gán công ty
   - Recruiter vẫn được phép đăng nhập nhưng với quyền hạn chế

3. **Dashboard thông báo** 📊
   - Hiển thị số lượng thông báo chưa đọc (badge đỏ)
   - Phân loại theo mức độ ưu tiên (CRITICAL, HIGH, MEDIUM, LOW)
   - Lọc theo loại thông báo và trạng thái đã đọc/chưa đọc
   - Tự động làm mới mỗi 30 giây

---

## 🚀 Cài đặt

### Bước 1: Tạo bảng database

Chạy file SQL sau trong MySQL Workbench hoặc phpMyAdmin:

```bash
d:\CAPSTON C1SE.60\CS.60\database\INSTALL-NOTIFICATION-SYSTEM.sql
```

Hoặc copy nội dung và execute trong MySQL:

```sql
USE cs60;

CREATE TABLE admin_notifications (
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
  INDEX idx_type (type),
  INDEX idx_created_at (created_at),
  INDEX idx_priority (priority),
  FOREIGN KEY (related_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Bước 2: Khởi động lại backend

```bash
cd d:\CAPSTON C1SE.60\CS.60\backend
npm start
```

Backend đã được cập nhật với:
- Model: `AdminNotification`
- Controller: `notification.controller.js`
- Routes: `/api/admin/notifications/*`

### Bước 3: Kiểm tra frontend

Frontend đã được tích hợp vào `admin-dashboard.html`:
- Icon chuông 🔔 ở header (phía trên bên phải)
- Badge đỏ hiển thị số thông báo chưa đọc
- Dropdown panel khi click vào chuông

---

## 📖 Cách sử dụng

### Cho Admin

1. **Xem thông báo**
   - Click vào icon chuông 🔔 ở header
   - Panel dropdown sẽ hiển thị tất cả thông báo

2. **Đánh dấu đã đọc**
   - Click "Đánh dấu đã đọc" trên từng thông báo
   - Hoặc click "Đọc tất cả" để đánh dấu tất cả

3. **Xem chi tiết user**
   - Click "Xem User" trong thông báo
   - Tự động chuyển đến Recruiters/Candidates section

4. **Xóa thông báo**
   - Click "Xóa" để xóa từng thông báo
   - Click "Xóa đã đọc" để xóa tất cả thông báo đã đọc

### Kịch bản 1: Candidate tự đăng ký

1. User đăng ký với role CANDIDATE từ trang register
2. Backend tạo tài khoản nhưng để `company_id = NULL`
3. **Thông báo được tạo tự động** (priority: HIGH)
4. Khi Candidate cố đăng nhập:
   - ❌ Bị chặn với thông báo: "Tài khoản chưa được kích hoạt bởi Admin"
   - **Thông báo được gửi cho Admin** (priority: CRITICAL)
5. Admin vào Candidates section, chọn candidate, click Edit, gán `company_id`
6. Lần đăng nhập tiếp theo, Candidate được phép vào ✅

### Kịch bản 2: Recruiter chưa có công ty

1. Recruiter đăng ký nhưng không chọn công ty (hoặc bỏ qua)
2. Backend tạo tài khoản với `company_id = NULL`
3. **Thông báo được tạo tự động** (priority: MEDIUM)
4. Khi Recruiter đăng nhập:
   - ✅ Được phép đăng nhập (không bị chặn)
   - Nhưng nhận cảnh báo: "Tài khoản chưa được gán công ty"
   - **Thông báo được gửi cho Admin** (priority: HIGH)
5. Admin vào Recruiters section, chọn recruiter, click Edit, chọn Company
6. Recruiter có thể làm việc bình thường ✅

---

## 🔧 API Endpoints

Tất cả routes yêu cầu authentication với role ADMIN:

```javascript
GET    /api/admin/notifications              // Lấy tất cả thông báo
GET    /api/admin/notifications/unread-count // Đếm thông báo chưa đọc
PUT    /api/admin/notifications/:id/read     // Đánh dấu đã đọc
PUT    /api/admin/notifications/read-all     // Đánh dấu tất cả đã đọc
DELETE /api/admin/notifications/:id          // Xóa thông báo
DELETE /api/admin/notifications/read         // Xóa tất cả đã đọc
```

### Query Parameters

```javascript
// GET /api/admin/notifications
?is_read=true/false  // Lọc theo trạng thái đã đọc
?type=UNAUTHORIZED_CANDIDATE|RECRUITER_NO_COMPANY|SYSTEM_ALERT
?priority=LOW|MEDIUM|HIGH|CRITICAL
?limit=50  // Số lượng thông báo tối đa
```

---

## 🎨 Giao diện

### Notification Bell
- Vị trí: Header, bên phải avatar
- Badge đỏ hiển thị số lượng thông báo chưa đọc
- Tự động cập nhật mỗi 30 giây

### Notification Panel
- Kích thước: 400px width, max 600px height
- Hiển thị dropdown khi click vào chuông
- Tự động đóng khi click bên ngoài

### Màu sắc theo Priority
- 🔴 **CRITICAL**: Viền đỏ, nền đỏ nhạt
- 🟠 **HIGH**: Viền cam, nền cam nhạt
- 🟡 **MEDIUM**: Viền vàng, nền vàng nhạt
- 🔵 **LOW**: Viền xanh, nền xanh nhạt

### Trạng thái thông báo
- **Chưa đọc**: Nền xanh nhạt
- **Đã đọc**: Nền trắng

---

## 🧪 Testing

### Test 1: Candidate tự đăng ký và bị chặn

1. Mở trang register: `http://localhost:3000/register.html`
2. Đăng ký với role "Candidate", để trống Company
3. Đăng nhập với tài khoản vừa tạo
4. Kiểm tra:
   - ❌ Đăng nhập bị chặn
   - ✅ Admin nhận thông báo CRITICAL
   - ✅ Thông báo hiển thị username, email, IP, thời gian

### Test 2: Recruiter chưa có công ty

1. Đăng ký với role "Recruiter", để trống Company
2. Đăng nhập với tài khoản vừa tạo
3. Kiểm tra:
   - ✅ Đăng nhập thành công
   - ⚠️ Nhận cảnh báo "chưa có công ty"
   - ✅ Admin nhận thông báo HIGH
   - ✅ Token vẫn được cấp

### Test 3: Admin gán công ty

1. Admin login: `http://localhost:3000/admin-login.html`
2. Vào Candidates hoặc Recruiters section
3. Click Edit user cần gán company
4. Chọn Company từ dropdown
5. Click "Cập nhật"
6. User đăng nhập lại:
   - ✅ Không còn bị chặn/cảnh báo
   - ✅ Hoạt động bình thường

---

## 📊 Database Schema

```sql
admin_notifications
├── notification_id (PK, AUTO_INCREMENT)
├── type (ENUM)
│   ├── UNAUTHORIZED_CANDIDATE    -- Candidate tự đăng ký
│   ├── RECRUITER_NO_COMPANY     -- Recruiter không có company
│   └── SYSTEM_ALERT             -- Thông báo hệ thống
├── title (VARCHAR 255)
├── message (TEXT)
├── related_user_id (FK -> users.user_id)
├── related_data (JSON)
│   ├── username
│   ├── email
│   ├── ip_address
│   ├── user_agent
│   └── timestamps
├── is_read (BOOLEAN)
├── priority (ENUM: LOW, MEDIUM, HIGH, CRITICAL)
└── created_at (TIMESTAMP)
```

---

## 🔐 Security

- Tất cả API routes yêu cầu JWT token
- Chỉ role ADMIN mới có quyền truy cập
- Candidate bị chặn hoàn toàn nếu chưa có company_id
- Recruiter được đăng nhập nhưng hạn chế chức năng

---

## 🐛 Troubleshooting

### Thông báo không hiển thị
1. Kiểm tra bảng `admin_notifications` đã được tạo chưa
2. Kiểm tra backend log xem có lỗi khi tạo notification không
3. F12 -> Console -> Xem có lỗi fetch API không

### Badge không cập nhật
1. Kiểm tra polling interval (30 giây)
2. Hard refresh: Ctrl + Shift + R
3. Kiểm tra endpoint: `GET /api/admin/notifications/unread-count`

### Candidate vẫn đăng nhập được
1. Kiểm tra logic trong `auth.controller.js` -> `login()`
2. Candidate phải có `company_id = NULL` mới bị chặn
3. Nếu đã có company_id (do admin gán), sẽ được phép vào

---

## 📝 Changelog

### Version 1.0.0 (2025-11-23)
- ✅ Tạo bảng admin_notifications
- ✅ Backend API đầy đủ (CRUD notifications)
- ✅ Frontend notification panel với badge
- ✅ Chặn candidate tự đăng ký
- ✅ Cảnh báo recruiter chưa có company
- ✅ Auto-refresh mỗi 30 giây
- ✅ Phân loại theo priority và type
- ✅ Liên kết trực tiếp đến user từ thông báo

---

## 🎯 Future Enhancements

- [ ] Email notification cho admin
- [ ] Sound alert khi có thông báo mới
- [ ] Filter và search thông báo
- [ ] Export thông báo ra Excel
- [ ] Thống kê thông báo theo thời gian
- [ ] Push notification (Web Push API)

---

## 📧 Support

Nếu có vấn đề, liên hệ:
- Email: admin@cs60.com
- GitHub Issues: [Link to repo]

---

**Developed by CS60 Team** 🚀
