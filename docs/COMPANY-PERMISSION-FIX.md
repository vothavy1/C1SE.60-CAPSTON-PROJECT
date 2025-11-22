# 🔐 HỆ THỐNG PHÂN QUYỀN THEO CÔNG TY - ĐÃ SỬA

## 📋 Tóm tắt vấn đề

**VẤN ĐỀ:** Khi đăng ký tài khoản recruiter mới và đăng nhập, vẫn thấy dữ liệu của TẤT CẢ công ty thay vì chỉ công ty của mình.

**NGUYÊN NHÂN:** 
1. Token cũ không có `company_id`
2. Middleware không kiểm tra đủ chặt chẽ
3. Controllers không từ chối truy cập khi thiếu `company_id`

## ✅ CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. **Middleware Authentication** (`auth.middleware.js`)

#### Trước:
```javascript
// Chỉ cảnh báo nếu thiếu company_id, không từ chối
if (userRole === 'RECRUITER' && !decoded.company_id && user.company_id) {
  logger.warn('Token cũ thiếu company_id');
}
```

#### Sau:
```javascript
// BẮT BUỘC từ chối token cũ thiếu company_id
if (userRole === 'RECRUITER') {
  // Check token cũ
  if (!decoded.company_id && user.company_id) {
    return res.status(401).json({ 
      message: 'Token cũ không hợp lệ. Vui lòng đăng xuất và đăng nhập lại',
      error_code: 'OLD_TOKEN'
    });
  }
  
  // Check user không có company_id trong database
  if (!user.company_id) {
    return res.status(403).json({ 
      message: 'Tài khoản recruiter chưa được gán vào công ty',
      error_code: 'NO_COMPANY'
    });
  }
}
```

### 2. **Candidate Controller** (`candidate.controller.js`)

#### API: `GET /api/candidates` (Lấy danh sách)

**Trước:**
```javascript
if (userRole === 'RECRUITER') {
  if (req.user.company_id) {
    whereClause.company_id = req.user.company_id;
  } else {
    // Chỉ cảnh báo
    console.warn('No company_id');
  }
}
```

**Sau:**
```javascript
if (userRole === 'RECRUITER') {
  if (!req.user.company_id) {
    return res.status(403).json({
      message: 'Tài khoản recruiter chưa được gán vào công ty',
      error_code: 'NO_COMPANY'
    });
  }
  // BẮT BUỘC lọc theo company_id
  whereClause.company_id = req.user.company_id;
  
} else if (userRole === 'ADMIN') {
  // CHỈ ADMIN mới xem tất cả
  console.log('ADMIN: Showing ALL candidates');
  
} else {
  // Các role khác KHÔNG có quyền
  return res.status(403).json({
    message: 'Bạn không có quyền truy cập danh sách ứng viên'
  });
}
```

#### Các API khác đã được cập nhật tương tự:
- ✅ `GET /api/candidates/:id` - Xem chi tiết
- ✅ `PUT /api/candidates/:id` - Chỉnh sửa
- ✅ `DELETE /api/candidates/:id` - Xóa
- ✅ `GET /api/candidates/:id/cv` - Xem CV
- ✅ `GET /api/candidates/:id/cv/download` - Tải CV

### 3. **Frontend** (`candidate-list.html`)

Thêm xử lý cho lỗi token cũ:

```javascript
if (response.status === 401 || response.status === 403) {
  const errorData = await response.json().catch(() => ({}));
  if (errorData.error_code === 'OLD_TOKEN') {
    alert('⚠️ TOKEN CŨ KHÔNG HỢP LỆ!\n\nVUI LÒNG ĐĂNG XUẤT VÀ ĐĂNG NHẬP LẠI!');
    logout();
  }
}
```

## 🎯 PHÂN QUYỀN MỚI

| Vai trò | Xem tất cả | Xem công ty mình | Chỉnh sửa | Xóa |
|---------|------------|------------------|-----------|-----|
| **ADMIN** | ✅ Tất cả công ty | ✅ | ✅ | ✅ |
| **RECRUITER** | ❌ Bị chặn | ✅ Chỉ công ty mình | ✅ Chỉ công ty mình | ✅ Chỉ công ty mình |
| **CANDIDATE** | ❌ Bị chặn | ❌ | ❌ | ❌ |

## 📝 HƯỚNG DẪN SỬ DỤNG

### Cho Recruiter:

1. **Đăng ký tài khoản mới:**
   - Truy cập `localhost:3000/register.html`
   - Chọn vai trò "Nhà tuyển dụng (Recruiter)"
   - **QUAN TRỌNG:** Chọn công ty của bạn từ dropdown
   - Hoàn tất đăng ký

2. **Đăng nhập:**
   - Truy cập `localhost:3000/login.html`
   - Đăng nhập bằng email và mật khẩu
   - Token mới sẽ có `company_id`

3. **Xem danh sách ứng viên:**
   - Truy cập `localhost:3000/candidate-list.html`
   - **CHỈ thấy ứng viên của công ty bạn**
   - Không thấy ứng viên của công ty khác

### Nếu gặp lỗi "Token cũ":

1. **Nhấn nút "Đăng xuất"** hoặc `logout()`
2. **Đăng nhập lại**
3. Token mới sẽ có `company_id` đầy đủ

## 🧪 KIỂM TRA

### Test với Database:

```sql
-- Xem users và company_id
SELECT user_id, username, email, role_id, company_id 
FROM users 
WHERE role_id = 2 
ORDER BY user_id DESC;

-- Xem candidates theo công ty
SELECT candidate_id, first_name, last_name, email, company_id 
FROM candidates 
ORDER BY company_id, candidate_id;

-- Xem companies
SELECT company_id, companyName, companyCode 
FROM companies;
```

### Test với API:

1. **Login và lấy token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@cs60.com","password":"123456"}'
```

2. **Lấy danh sách candidates:**
```bash
curl http://localhost:5000/api/candidates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **Kết quả mong đợi:**
   - Recruiter của CS60 (company_id=1) chỉ thấy candidates có company_id=1
   - Recruiter của Digital (company_id=3) chỉ thấy candidates có company_id=3
   - Admin thấy TẤT CẢ

## ⚠️ LƯU Ý

1. **Token lifetime:** Token có thời hạn (thường 24h), sau đó cần login lại
2. **Database consistency:** Đảm bảo mọi recruiter đều có company_id
3. **Registration:** Khi đăng ký recruiter, BẮT BUỘC chọn công ty

## 🔄 CẬP NHẬT SAU NÀY

Nếu cần cập nhật company_id cho user cũ:

```sql
UPDATE users 
SET company_id = 1 
WHERE username = 'recruiter_name' AND role_id = 2;
```

---

**Ngày cập nhật:** 22/11/2025  
**Phiên bản:** 2.0  
**Trạng thái:** ✅ Đã hoàn thành và kiểm tra
