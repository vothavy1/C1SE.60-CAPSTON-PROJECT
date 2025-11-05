# 🔧 Fix: "Không thể khởi tạo hồ sơ ứng viên"

## ❌ Lỗi Gặp Phải
Khi click "Làm bài thi" xuất hiện thông báo:
**"Không thể khởi tạo hồ sơ ứng viên. Vui lòng đăng xuất và đăng nhập lại."**

## 🔍 Nguyên Nhân
User chưa có record trong bảng `candidates`, và việc tạo tự động thất bại.

## ✅ Giải Pháp Đã Implement

### 1. **Improved Error Handling**
Code đã được cập nhật để:
- ✅ Log chi tiết mọi bước
- ✅ Hiển thị lỗi cụ thể trong console
- ✅ Retry nếu candidate đã tồn tại
- ✅ Xử lý race condition

### 2. **Frontend Changes (exam.html)**

```javascript
// ✅ MỚI: Xử lý đầy đủ các trường hợp
if (candidateResponse.ok) {
  const candidateData = await candidateResponse.json();
  candidateId = candidateData.data?.candidate_id;
  console.log('✅ Found existing candidate:', candidateId);
  
} else if (candidateResponse.status === 404) {
  console.log('📝 Creating candidate profile for user:', session.userId);
  
  const createResponse = await fetch(...);
  
  if (createResponse.ok) {
    candidateId = ...;
    console.log('✅ Created candidate profile:', candidateId);
    
  } else {
    // ✅ Log chi tiết lỗi
    const errorData = await createResponse.json().catch(() => ({}));
    console.error('❌ Failed to create candidate:', errorData);
    
    // ✅ Nếu đã tồn tại, thử lấy lại
    if (errorData.message?.includes('already has a candidate profile')) {
      const retryResponse = await fetch(...);
      if (retryResponse.ok) {
        candidateId = ...;
        console.log('✅ Got candidate on retry:', candidateId);
      }
    }
  }
}
```

## 🧪 Cách Debug

### Bước 1: Mở Console (F12)
```
Nhấn F12 → Tab Console
```

### Bước 2: Clear localStorage
```javascript
localStorage.clear();
location.reload();
```

### Bước 3: Login lại
```
Đăng nhập với tài khoản candidate
```

### Bước 4: Click "Làm bài thi" và xem logs
```javascript
// Các logs mong đợi:
✅ Session valid: 1 CANDIDATE
📝 Creating candidate profile for user: 1
✅ Created candidate profile: 1

// Hoặc nếu đã có:
✅ Found existing candidate: 1
```

### Bước 5: Nếu có lỗi
Check logs trong console để xem lỗi cụ thể:
```javascript
❌ Failed to create candidate: 400 { message: "..." }
```

## 🛠️ Manual Fix (Nếu Cần)

### Option 1: Dùng SQL Script
```powershell
# Chạy script kiểm tra
cd "d:\CAPSTON C1SE.60\CS.60"
mysql -u root -p cs60_recruitment < database/check-candidate-profiles.sql
```

### Option 2: Dùng PowerShell Test Script
```powershell
cd "d:\CAPSTON C1SE.60\CS.60"
.\test-candidate-profile.ps1
```

Script sẽ:
1. Login với credentials
2. Check candidate profile
3. Tự động tạo nếu chưa có
4. Hiển thị kết quả

### Option 3: Manual SQL Insert
```sql
-- Thay USER_ID = 1 bằng user_id thật
INSERT INTO candidates (
    user_id, 
    first_name, 
    last_name, 
    email, 
    status, 
    created_at
) VALUES (
    1,                          -- user_id
    'Test User',                -- first_name
    '',                         -- last_name
    'user@example.com',         -- email
    'ACTIVE',                   -- status
    NOW()                       -- created_at
);
```

## 📊 Kiểm Tra Database

### Check user tồn tại:
```sql
SELECT user_id, username, email, full_name 
FROM users 
WHERE user_id = 1;
```

### Check candidate profile:
```sql
SELECT candidate_id, user_id, first_name, email, status
FROM candidates
WHERE user_id = 1;
```

### Check users CHƯA có candidate:
```sql
SELECT u.user_id, u.username, u.email, r.role_name
FROM users u
LEFT JOIN roles r ON u.role_id = r.role_id
LEFT JOIN candidates c ON u.user_id = c.user_id
WHERE c.candidate_id IS NULL
AND r.role_name = 'CANDIDATE';
```

## 🎯 Expected Flow

### Lần Đầu (Chưa có candidate):
```
1. Click "Làm bài thi"
   ↓
2. Check session ✅
   ↓
3. GET /candidates/by-user/1
   → 404 Not Found
   ↓
4. POST /candidates/self-register
   {
     user_id: 1,
     first_name: "User",
     email: "user@example.com",
     status: "ACTIVE"
   }
   ↓
5. ✅ Candidate created
   candidate_id: 1
   ↓
6. POST /candidate-tests/assign
   {
     candidate_id: 1,
     test_id: 5
   }
   ↓
7. ✅ Redirect to test.html
```

### Lần Sau (Đã có candidate):
```
1. Click "Làm bài thi"
   ↓
2. Check session ✅
   ↓
3. GET /candidates/by-user/1
   → 200 OK
   {
     candidate_id: 1,
     first_name: "User",
     ...
   }
   ↓
4. Skip create step
   ↓
5. POST /candidate-tests/assign
   ↓
6. ✅ Redirect to test.html
```

## ⚠️ Common Issues

### Issue 1: API returns 500
**Check**: Backend logs
```bash
cd backend
cat logs/app.log | grep -i error
```

### Issue 2: API returns 401
**Check**: Token expired
```javascript
// Console:
localStorage.getItem('auth_token')
// If null, login again
```

### Issue 3: Duplicate candidate
**Check**: Database
```sql
SELECT * FROM candidates WHERE user_id = 1;
-- Should return only 1 row
```

### Issue 4: Race condition
**Scenario**: Nếu click 2 lần liên tục

**Solution**: Code đã xử lý bằng retry logic

## 📝 Testing Checklist

- [ ] Clear localStorage
- [ ] Login fresh
- [ ] Open Console (F12)
- [ ] Click "Làm bài thi"
- [ ] Check console logs
- [ ] Verify candidate created in DB
- [ ] Test can start test
- [ ] Test second click (should skip create)

## 🚀 If Everything Fails

### Last Resort:
```powershell
# 1. Stop servers
Ctrl+C

# 2. Clear all data
cd "d:\CAPSTON C1SE.60\CS.60"
mysql -u root -p cs60_recruitment -e "DELETE FROM candidates WHERE user_id = 1;"

# 3. Clear browser data
# F12 → Application → Clear storage

# 4. Restart servers
.\start-all.ps1

# 5. Login and try again
```

## 📞 Support

Nếu vẫn gặp lỗi, cung cấp:
1. Console logs (F12)
2. Backend logs (`backend/logs/app.log`)
3. Database query result:
   ```sql
   SELECT * FROM users WHERE user_id = 1;
   SELECT * FROM candidates WHERE user_id = 1;
   ```

## ✅ Success Indicators

Khi thành công, bạn sẽ thấy:
```
✅ Session valid: 1 CANDIDATE
✅ Found existing candidate: 1
(hoặc)
📝 Creating candidate profile for user: 1
✅ Created candidate profile: 1
```

Và được redirect đến trang làm bài test!
