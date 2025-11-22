# 🎯 HƯỚNG DẪN TEST ADMIN DASHBOARD

## 📌 Thông Tin Truy Cập

### **Frontend URL:**
```
http://localhost:3000/admin-dashboard.html
```

### **Backend API:**
```
http://localhost:5000/api/admin
```

---

## 🔐 Tài Khoản Test

### **Admin Account:**
- **Email:** admin@cs60.com
- **Password:** admin123
- **Role:** ADMIN

*(Hoặc sử dụng tài khoản admin khác trong database của bạn)*

---

## 📋 Các Bước Test

### **Bước 1: Đăng Nhập**
1. Truy cập: `http://localhost:3000/login.html`
2. Nhập email và password admin
3. Sau khi đăng nhập thành công, hệ thống sẽ tự động redirect đến admin dashboard

### **Bước 2: Xem Dashboard**
1. Truy cập trực tiếp: `http://localhost:3000/admin-dashboard.html`
2. Kiểm tra các thống kê hiển thị:
   - **Total Recruiters** - Số lượng recruiters
   - **Total Candidates** - Số lượng candidates  
   - **Total Tests** - Tổng số bài test

### **Bước 3: Quản Lý Users**
1. Xem danh sách users trong bảng
2. Kiểm tra thông tin:
   - ID, Username, Email
   - Role badges (ADMIN/RECRUITER/CANDIDATE)
   - Company
   - Status (Active/Inactive)

### **Bước 4: Test Actions**
1. **View User:** Click nút "View" để xem chi tiết user
2. **Delete User:** Click nút "Delete" để xóa user (có xác nhận)
3. **Refresh:** Click nút "Refresh" để tải lại dữ liệu

---

## 🔍 API Endpoints Test

### **1. Get Dashboard Stats**
```bash
GET http://localhost:5000/api/admin/stats
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "recruiters": 5,
    "candidates": 20,
    "tests": 15
  }
}
```

### **2. Get All Users**
```bash
GET http://localhost:5000/api/admin/users
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 1,
      "username": "admin",
      "email": "admin@cs60.com",
      "role_name": "ADMIN",
      "company_name": null,
      "is_active": 1,
      "created_at": "2024-01-01"
    }
  ]
}
```

### **3. Delete User**
```bash
DELETE http://localhost:5000/api/admin/users/:id
Headers: Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 🚨 Lưu Ý Quan Trọng

### **Authentication:**
- ✅ Cần đăng nhập với tài khoản **ADMIN**
- ✅ Token được lưu trong `localStorage.getItem('token')`
- ❌ Non-admin users sẽ bị redirect về index.html

### **Permissions:**
- Chỉ ADMIN mới có quyền truy cập
- Admin không thể xóa chính mình
- Tất cả actions đều có xác nhận

### **Auto-Refresh:**
- Dashboard tự động refresh mỗi 30 giây
- Manual refresh bằng nút "Refresh"

---

## 🛠️ Troubleshooting

### **Lỗi 401 Unauthorized:**
- Token hết hạn hoặc không hợp lệ
- Đăng xuất và đăng nhập lại

### **Lỗi 403 Forbidden:**
- User không có role ADMIN
- Kiểm tra role trong database

### **Dashboard trống:**
- Kiểm tra console log (F12)
- Verify API endpoints đang chạy
- Check CORS configuration

### **Cannot delete user:**
- Không thể xóa chính mình
- User không tồn tại
- Check server logs

---

## 📊 Features Đã Hoàn Thành

✅ Authentication với JWT  
✅ Role-based access control (ADMIN only)  
✅ Dashboard statistics (Recruiters, Candidates, Tests)  
✅ User management table với dynamic rendering  
✅ View user details  
✅ Delete user với confirmation  
✅ Auto-refresh every 30 seconds  
✅ Manual refresh button  
✅ Last update timestamp  
✅ Loading states  
✅ Error handling  
✅ Responsive design  
✅ Professional Light Mode theme  

---

## 🎨 Giao Diện

- **Theme:** Professional Light Mode
- **Sidebar:** Dark Blue (#1e293b)
- **Cards:** White với shadows
- **Typography:** Hierarchical với màu đậm nhạt phù hợp
- **Badges:** Color-coded theo role và status
- **Buttons:** Gradient với hover effects

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Backend server đang chạy: `http://localhost:5000`
2. Frontend server đang chạy: `http://localhost:3000`
3. Database connection OK
4. Token trong localStorage hợp lệ
5. Role trong database là 'ADMIN'

---

**🚀 READY TO TEST!**
