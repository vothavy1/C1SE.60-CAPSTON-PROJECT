# 🧪 HƯỚNG DẪN KIỂM TRA PHÂN QUYỀN THEO CÔNG TY

## ✅ CHUẨN BỊ

Backend đã được cập nhật với code mới:
- ✅ Middleware kiểm tra token cũ
- ✅ Controllers từ chối truy cập nếu thiếu company_id
- ✅ Chỉ ADMIN mới xem được tất cả dữ liệu

## 📝 BƯỚC KIỂM TRA

### Bước 1: Đăng xuất tài khoản hiện tại

1. Mở trình duyệt
2. Truy cập `localhost:3000/candidate-list.html`
3. Nhấn nút **"Đăng xuất"** ở góc trên bên phải
4. Hoặc mở Console (F12) và chạy:
   ```javascript
   localStorage.clear();
   location.href = 'index.html';
   ```

### Bước 2: Kiểm tra tài khoản Recruiter CS60

1. Đăng nhập với tài khoản CS60:
   - Email: `recruiter@cs60.com`
   - Password: `123456`

2. Sau khi đăng nhập thành công, truy cập:
   - `localhost:3000/candidate-list.html`

3. **Kiểm tra kết quả:**
   - ✅ **ĐÚNG:** Chỉ thấy ứng viên có cột "Công ty" = **"C1SE 60"**
   - ❌ **SAI:** Nếu thấy ứng viên của "Digital Solutions" hoặc công ty khác

4. Mở Console (F12) và kiểm tra log:
   ```
   👤 User: recruiter, Role: RECRUITER, Company ID: 1
   🔒 RECRUITER FILTER: Only company_id = 1
   ```

### Bước 3: Kiểm tra tài khoản Recruiter Digital

1. **Đăng xuất** tài khoản CS60

2. Đăng nhập với tài khoản Digital:
   - Email: `Digital@cs60.com`
   - Password: `123456`

3. Truy cập `localhost:3000/candidate-list.html`

4. **Kiểm tra kết quả:**
   - ✅ **ĐÚNG:** Chỉ thấy ứng viên có "Công ty" = **"Digital Solutions"**
   - ❌ **SAI:** Nếu thấy ứng viên của "C1SE 60" hoặc công ty khác

5. Kiểm tra Console log:
   ```
   👤 User: Digital, Role: RECRUITER, Company ID: 3
   🔒 RECRUITER FILTER: Only company_id = 3
   ```

### Bước 4: Kiểm tra tài khoản ADMIN (nếu có)

1. Đăng nhập với tài khoản admin
2. Truy cập `localhost:3000/candidate-list.html`
3. **Kiểm tra kết quả:**
   - ✅ **ĐÚNG:** Thấy TẤT CẢ ứng viên của MỌI công ty
   - Console log:
     ```
     👤 User: admin, Role: ADMIN
     👑 ADMIN ACCESS: Showing ALL candidates from ALL companies
     ```

### Bước 5: Test với tài khoản mới

1. Đăng ký tài khoản recruiter mới tại `localhost:3000/register.html`
2. Chọn vai trò: **Nhà tuyển dụng (Recruiter)**
3. **QUAN TRỌNG:** Chọn công ty (ví dụ: CS60 Company)
4. Hoàn tất đăng ký
5. Đăng nhập
6. Kiểm tra xem chỉ thấy dữ liệu của công ty đã chọn

## 🔍 KIỂM TRA BẰNG DATABASE

Mở terminal và chạy:

```powershell
# Xem users và company_id
docker exec -it cs60_mysql mysql -u cs60user -pcs60password -D cs60_recruitment -e "SELECT user_id, username, email, role_id, company_id FROM users WHERE role_id = 2 ORDER BY user_id DESC LIMIT 10;"

# Xem candidates theo company
docker exec -it cs60_mysql mysql -u cs60user -pcs60password -D cs60_recruitment -e "SELECT candidate_id, first_name, last_name, company_id FROM candidates ORDER BY company_id;"
```

**Kết quả mong đợi:**
- Tất cả recruiters đều có `company_id` (không NULL)
- Candidates được phân bổ vào các công ty khác nhau

## ⚠️ CÁC LỖI CÓ THỂ GẶP

### Lỗi 1: "Token cũ không hợp lệ"

**Triệu chứng:**
```
⚠️ TOKEN CŨ KHÔNG HỢP LỆ!
Vui lòng đăng xuất và đăng nhập lại
```

**Giải pháp:**
1. Nhấn OK
2. Hệ thống tự động đăng xuất
3. Đăng nhập lại

### Lỗi 2: "Tài khoản recruiter chưa được gán vào công ty"

**Triệu chứng:**
```json
{
  "success": false,
  "message": "Tài khoản recruiter chưa được gán vào công ty",
  "error_code": "NO_COMPANY"
}
```

**Giải pháp:**
Cập nhật company_id trong database:
```sql
UPDATE users 
SET company_id = 1 
WHERE username = 'your_username' AND role_id = 2;
```

### Lỗi 3: Vẫn thấy dữ liệu của tất cả công ty

**Nguyên nhân:**
- Chưa đăng xuất và đăng nhập lại
- Token cũ vẫn còn trong localStorage
- Code backend chưa được khởi động lại

**Giải pháp:**
1. Clear localStorage:
   ```javascript
   localStorage.clear();
   ```
2. Đăng nhập lại
3. Kiểm tra backend đã restart với code mới

## ✅ CHECKLIST HOÀN THÀNH

- [ ] Backend đã restart với code mới
- [ ] Đăng xuất tài khoản cũ
- [ ] Đăng nhập lại
- [ ] Recruiter CS60 chỉ thấy dữ liệu CS60
- [ ] Recruiter Digital chỉ thấy dữ liệu Digital
- [ ] Admin thấy tất cả (nếu có)
- [ ] Tài khoản mới đăng ký hoạt động đúng

## 📊 KẾT QUẢ MONG ĐỢI

| Tài khoản | Email | Company ID | Thấy candidates của |
|-----------|-------|------------|---------------------|
| recruiter | recruiter@cs60.com | 1 | Chỉ CS60 (company_id=1) |
| Digital | Digital@cs60.com | 3 | Chỉ Digital (company_id=3) |
| admin | admin@cs60.com | NULL | TẤT CẢ công ty |

---

**Nếu tất cả đều PASS:** 🎉 Phân quyền hoạt động đúng!

**Nếu có lỗi:** Liên hệ hoặc kiểm tra lại code và database.
