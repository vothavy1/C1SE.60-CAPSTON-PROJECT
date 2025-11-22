# HỆ THỐNG ĐĂNG KÝ RECRUITER VÀ YÊU CẦU CÔNG TY MỚI

## 📋 Tổng quan

Hệ thống đã được cập nhật để:
1. **Chặn ứng viên tự đăng ký** - Ứng viên được hướng dẫn dùng trang `apply.html` để nộp CV
2. **Trang đăng ký dành riêng cho Recruiter** - `register.html` chỉ cho phép đăng ký tài khoản Recruiter
3. **Yêu cầu thêm công ty mới** - Recruiter có thể chọn "Công ty khác" và gửi yêu cầu admin thêm công ty

---

## 🎯 Luồng hoạt động

### 1️⃣ Ứng viên muốn ứng tuyển
```
Truy cập login.html 
→ Click "Nộp CV ứng tuyển" 
→ apply.html (không cần tài khoản)
```

### 2️⃣ Recruiter đăng ký với công ty có sẵn
```
Truy cập login.html 
→ Click "Đăng ký Recruiter" 
→ register.html 
→ Chọn công ty từ dropdown 
→ Đăng ký thành công 
→ Đăng nhập ngay
```

### 3️⃣ Recruiter đăng ký với công ty mới
```
Truy cập login.html 
→ Click "Đăng ký Recruiter" 
→ register.html 
→ Chọn "🏢 Công ty khác (Yêu cầu admin thêm)" 
→ Nhập tên công ty 
→ Đăng ký thành công 
→ Admin nhận thông báo 
→ Admin thêm công ty vào hệ thống 
→ Admin gán company_id cho recruiter 
→ Recruiter đăng nhập
```

---

## 🔧 Các thay đổi kỹ thuật

### Frontend: `register.html`

#### Đã thay đổi:
- ❌ Loại bỏ radio button chọn vai trò (Candidate/Recruiter)
- ✅ Cố định vai trò là **Recruiter** (role_id = 2)
- ✅ Thêm banner hướng dẫn ứng viên đi trang `apply.html`
- ✅ Thêm option "🏢 Công ty khác" vào dropdown công ty
- ✅ Thêm input field để nhập tên công ty mới
- ✅ Gửi `other_company_name` lên backend khi chọn công ty khác

#### Code quan trọng:
```javascript
// Thêm option "Công ty khác" vào dropdown
const otherOption = document.createElement('option');
otherOption.value = 'OTHER';
otherOption.textContent = '🏢 Công ty khác (Yêu cầu admin thêm)';
companySelect.appendChild(otherOption);

// Gửi tên công ty mới lên backend
if (other_company_name) {
  requestBody.other_company_name = other_company_name;
}
```

---

### Backend: `auth.controller.js`

#### Đã thay đổi:
- ✅ Nhận thêm parameter `other_company_name` trong request body
- ✅ Validate: Nếu không có `company_id` thì phải có `other_company_name`
- ✅ Tạo 2 loại notification:
  - **RECRUITER_NO_COMPANY**: Recruiter không chọn công ty (trường hợp cũ)
  - **RECRUITER_REQUEST_NEW_COMPANY**: Recruiter yêu cầu thêm công ty mới

#### Code notification:
```javascript
if (finalRoleId === 2 && !company_id) {
  if (other_company_name) {
    // Notification yêu cầu thêm công ty mới
    await createNotification(
      'RECRUITER_REQUEST_NEW_COMPANY',
      '🏢 Yêu cầu thêm công ty mới',
      `Recruiter "${username}" (${email}) đã đăng ký và yêu cầu thêm công ty "${other_company_name}" vào hệ thống.`,
      newUser.user_id,
      {
        username: newUser.username,
        email: newUser.email,
        requested_company_name: other_company_name,
        ...
      },
      'HIGH'
    );
  }
}
```

---

### Model: `adminNotification.model.js`

#### Đã thay đổi:
```javascript
type: {
  type: DataTypes.ENUM(
    'RECRUITER_NO_COMPANY', 
    'RECRUITER_REQUEST_NEW_COMPANY',  // ✅ THÊM MỚI
    'SYSTEM_ALERT'
  ),
  allowNull: false
}
```

---

### Database Migration

**File:** `database/migrations/update-notification-type-enum.sql`

```sql
ALTER TABLE admin_notifications 
MODIFY COLUMN type ENUM(
  'RECRUITER_NO_COMPANY', 
  'RECRUITER_REQUEST_NEW_COMPANY',
  'SYSTEM_ALERT'
) NOT NULL COMMENT 'Loại thông báo';
```

**Chạy migration:**
```bash
mysql -u root -p cs60 < database/migrations/update-notification-type-enum.sql
```

---

## 📝 Hướng dẫn Admin xử lý thông báo

### Khi nhận thông báo "RECRUITER_REQUEST_NEW_COMPANY"

1. **Xem thông tin trong notification:**
   - `related_data.username`: Username của recruiter
   - `related_data.email`: Email của recruiter
   - `related_data.requested_company_name`: Tên công ty yêu cầu
   - `related_user_id`: ID của user trong bảng `users`

2. **Thêm công ty vào database:**
   ```sql
   INSERT INTO companies (company_name, address, phone, email, website, description, is_active)
   VALUES ('Tên công ty', 'Địa chỉ', 'SĐT', 'email@company.com', 'website.com', 'Mô tả', 1);
   ```

3. **Gán company_id cho recruiter:**
   ```sql
   UPDATE users 
   SET company_id = <new_company_id> 
   WHERE user_id = <related_user_id>;
   ```

4. **Đánh dấu notification đã xử lý:**
   - Click vào notification → Mark as Read
   - Hoặc Delete notification sau khi xử lý xong

---

## 🧪 Test Cases

### Test 1: Ứng viên cố gắng đăng ký
✅ **Mong đợi:** Ứng viên không thấy option "Ứng viên", chỉ thấy banner hướng dẫn đi `apply.html`

### Test 2: Recruiter đăng ký với công ty có sẵn
✅ **Mong đợi:** 
- Chọn công ty từ dropdown
- Đăng ký thành công
- Đăng nhập được ngay

### Test 3: Recruiter đăng ký với công ty mới
✅ **Mong đợi:**
- Chọn "Công ty khác"
- Nhập tên công ty
- Đăng ký thành công
- Thấy alert: "Tài khoản đang chờ admin thêm công ty..."
- Admin nhận notification type `RECRUITER_REQUEST_NEW_COMPANY`
- Notification chứa đầy đủ thông tin: username, email, tên công ty yêu cầu

### Test 4: Validation
✅ **Mong đợi:**
- Chọn "Công ty khác" nhưng không nhập tên → Alert "Vui lòng nhập tên công ty!"
- Không chọn công ty nào → Alert "Vui lòng chọn công ty!"

---

## 🎨 UI/UX Improvements

### Banner hướng dẫn ứng viên:
```
┌─────────────────────────────────────────────┐
│ 👥 Bạn là ứng viên?                         │
│ Ứng viên không cần đăng ký tài khoản.       │
│ Hãy nộp CV trực tiếp!                       │
│ [📄 Nộp CV ngay →]                          │
└─────────────────────────────────────────────┘
```

### Dropdown công ty:
```
-- Chọn công ty --
Công ty A
Công ty B
Công ty C
🏢 Công ty khác (Yêu cầu admin thêm)  ← MỚI
```

### Alert khi chọn "Công ty khác":
```
⚠️ Admin sẽ nhận thông báo và thêm công ty này vào hệ thống. 
   Bạn có thể đăng nhập sau khi admin phê duyệt.
```

---

## 📂 Files đã thay đổi

```
✏️  frontend/register.html                              (Chặn candidate, thêm "Công ty khác")
✏️  frontend/login.html                                 (Thêm links đăng ký)
✏️  backend/src/controllers/auth.controller.js          (Xử lý other_company_name)
✏️  backend/src/models/adminNotification.model.js       (Thêm RECRUITER_REQUEST_NEW_COMPANY)
➕  database/migrations/update-notification-type-enum.sql  (Migration SQL)
➕  docs/RECRUITER-REGISTRATION-FLOW.md                 (File này)
```

---

## 🚀 Deployment Checklist

- [ ] Chạy migration SQL: `update-notification-type-enum.sql`
- [ ] Restart backend server để load model mới
- [ ] Test đăng ký với công ty có sẵn
- [ ] Test đăng ký với "Công ty khác"
- [ ] Test notification hiển thị đầy đủ thông tin
- [ ] Test admin xử lý notification (thêm công ty + gán user)

---

## 💡 Future Enhancements

1. **Auto-approve công ty:** Admin có thể pre-approve một số công ty
2. **Email notification:** Gửi email cho admin khi có yêu cầu công ty mới
3. **Recruiter dashboard:** Hiển thị trạng thái "Chờ admin phê duyệt công ty"
4. **Company suggestion:** Gợi ý công ty gần giống khi recruiter nhập tên

---

## 🔗 Related Documentation

- [ADMIN-NOTIFICATION-SYSTEM.md](./ADMIN-NOTIFICATION-SYSTEM.md)
- [COMPANY-PERMISSION-FIX.md](./COMPANY-PERMISSION-FIX.md)
- [TESTING-COMPANY-PERMISSION.md](./TESTING-COMPANY-PERMISSION.md)

---

**Ngày tạo:** 2025-11-23  
**Người tạo:** CS.60 Team  
**Version:** 1.0.0
