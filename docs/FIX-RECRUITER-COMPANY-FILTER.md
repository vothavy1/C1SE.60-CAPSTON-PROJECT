# 🔧 HƯỚNG DẪN SỬA LỖI - RECRUITER THẤY DỮ LIỆU TẤT CẢ CÔNG TY

## ❌ Vấn Đề
Khi đăng nhập lần đầu với tài khoản Recruiter công ty B, bạn thấy dữ liệu của tất cả công ty (A, B, C...) thay vì chỉ công ty B.

## 🔍 Nguyên Nhân
Token cũ không chứa `company_id`, nên backend không thể filter dữ liệu theo công ty.

## ✅ GIẢI PHÁP - THỰC HIỆN THEO THỨ TỰ

### **Bước 1: Kiểm tra Token có Company ID không**
1. Mở trình duyệt và truy cập: **http://localhost:3000/debug-token.html**
2. Xem phần "Company ID Check":
   - ✅ Nếu thấy **"RECRUITER CÓ COMPANY_ID"** → Token đã đúng, không cần làm gì
   - ❌ Nếu thấy **"RECRUITER KHÔNG CÓ COMPANY_ID"** → Làm Bước 2

### **Bước 2: Force Logout để xóa Token cũ**
1. Truy cập: **http://localhost:3000/force-logout.html**
2. Click nút **"Đăng Xuất Hoàn Toàn"**
3. Đợi 2 giây để tự động chuyển sang trang đăng nhập

### **Bước 3: Đăng nhập lại**
1. Đăng nhập với tài khoản Recruiter công ty B
2. Sau khi đăng nhập thành công, token mới sẽ có `company_id`

### **Bước 4: Kiểm tra lại**
1. Vào lại: **http://localhost:3000/debug-token.html**
2. Xác nhận thấy **"✅ RECRUITER CÓ COMPANY_ID: [số]"**
3. Vào trang Report: **http://localhost:3000/report.html**
4. Bây giờ chỉ thấy dữ liệu của công ty B thôi!

---

## 🐛 Nếu Tính Năng XÓA Báo Cáo Không Hoạt Động

### **Cách Test:**
1. Đăng nhập với tài khoản **ADMIN** (không phải Recruiter)
2. Vào trang Report: http://localhost:3000/report.html
3. Click nút **"Xóa"** ở một báo cáo bất kỳ
4. Mở **Console** (F12 → tab Console)
5. Xem logs:
   - `🗑️ Deleting report XX...`
   - `📡 Response status: 200` hoặc `403/404/500`

### **Nếu thấy lỗi 403 (Forbidden):**
- Bạn không phải ADMIN
- Chỉ ADMIN mới được xóa/sửa báo cáo

### **Nếu thấy lỗi 404 (Not Found):**
- Report ID không tồn tại trong database
- Có thể đã bị xóa rồi

### **Nếu thấy lỗi 500 (Server Error):**
- Kiểm tra backend console để xem lỗi chi tiết

---

## 📋 CHECKLIST - Làm Theo Thứ Tự

- [ ] 1. Mở http://localhost:3000/debug-token.html
- [ ] 2. Kiểm tra có company_id không
- [ ] 3. Nếu không có → Vào http://localhost:3000/force-logout.html
- [ ] 4. Click "Đăng Xuất Hoàn Toàn"
- [ ] 5. Đăng nhập lại
- [ ] 6. Kiểm tra lại debug-token.html → Phải thấy company_id
- [ ] 7. Vào report.html → Chỉ thấy dữ liệu công ty mình
- [ ] 8. Test xóa báo cáo (chỉ ADMIN)

---

## 🔐 Tài Khoản Test

### ADMIN
- Email: admin@cs60.vn
- Password: admin123

### RECRUITER Công ty A
- Email: recruiter_a@company-a.com
- Password: (tùy theo DB của bạn)

### RECRUITER Công ty B
- Email: recruiter_b@company-b.com  
- Password: (tùy theo DB của bạn)

---

## 💡 Lưu Ý Quan Trọng

1. **Token cũ = Không có company_id**
   - Token được tạo trước khi thêm company_id vào JWT
   - Phải logout và login lại để có token mới

2. **Backend đã có Company Filter**
   - Code backend đã check company_id
   - Nhưng nếu token không có company_id → không filter được

3. **Recruiter vs Admin**
   - Recruiter: Chỉ xem dữ liệu công ty mình
   - Admin: Xem tất cả công ty

4. **Tính năng Xóa/Sửa**
   - Chỉ ADMIN mới được xóa/sửa báo cáo
   - Recruiter chỉ được XEM

---

## 🆘 Vẫn Chưa Được?

Nếu làm theo tất cả các bước trên mà vẫn thấy dữ liệu sai, hãy:

1. Mở Console (F12)
2. Vào tab Console
3. Copy toàn bộ logs khi load trang report.html
4. Gửi cho developer để debug

---

**Tạo bởi:** CS60 Recruitment System  
**Ngày:** 24/11/2025
