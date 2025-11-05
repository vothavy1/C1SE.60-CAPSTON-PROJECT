# 🔒 Session Management - Clean & Secure

## ✅ Đã Chuẩn Hóa Session Key

### Quyết Định Kiến Trúc
**Dùng JWT Token + localStorage** thay vì express-session vì:
- ✅ Stateless - không cần lưu session trên server
- ✅ Scalable - dễ mở rộng với nhiều server
- ✅ Mobile-friendly - token có thể dùng cho mobile app
- ✅ Không mất khi restart server

### Key Duy Nhất: `userId`
**Loại bỏ sự không nhất quán** giữa `user_id` và `userId`

```javascript
// ✅ CHUẨN - Chỉ dùng userId
const session = {
  userId: 1,           // CHỈ key này thôi
  username: "john",
  fullName: "John Doe",
  email: "john@example.com",
  role: "CANDIDATE",
  loginAt: Date.now()
};
```

## 📋 Changes Log

### 1. Backend - auth.controller.js
**Chuẩn hóa API response**

```javascript
// ❌ TRƯỚC:
return res.status(200).json({
  success: true,
  data: {
    user: {
      id: user.user_id,  // ❌ Không nhất quán
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.Role?.role_name
    },
    token
  }
});

// ✅ SAU:
return res.status(200).json({
  success: true,
  data: {
    user: {
      userId: user.user_id,  // ✅ Chuẩn hóa thành userId
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.Role?.role_name
    },
    token
  }
});
```

### 2. Frontend - index.html
**Lưu session với key chuẩn**

```javascript
// ❌ TRƯỚC:
localStorage.setItem('session_user', JSON.stringify({
  name: user.username,
  role: user.role,
  user_id: user.id,   // ❌ Sai key
  userId: user.id,     // ❌ Duplicate
  email: user.email
}));

// ✅ SAU:
localStorage.setItem('session_user', JSON.stringify({
  userId: user.userId,      // ✅ CHỈ userId duy nhất
  username: user.username,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  loginAt: Date.now()
}));

console.log('✅ User logged in:', user.userId, user.role);
```

### 3. Frontend - exam.html
**Kiểm tra session đúng cách**

```javascript
// ❌ TRƯỚC:
const session = JSON.parse(localStorage.getItem('session_user') || 'null');
if (!session || !session.user_id) {  // ❌ Sai key
  alert('Phiên đăng nhập đã hết hạn');
  window.location.href = 'index.html';
  return;
}

// ✅ SAU:
const session = JSON.parse(localStorage.getItem('session_user') || 'null');
const authToken = localStorage.getItem('auth_token');

if (!session || !session.userId || !authToken) {  // ✅ Check đúng key + token
  alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  localStorage.clear();  // ✅ Clear hết để cleanup
  window.location.href = 'index.html';
  return;
}

console.log('✅ Session valid:', session.userId, session.role);
```

**Sử dụng userId trong API calls**

```javascript
// ❌ TRƯỚC:
fetch(`${API_BASE_URL}/candidates/by-user/${session.user_id}`, ...)  // ❌ Sai key

// ✅ SAU:
fetch(`${API_BASE_URL}/candidates/by-user/${session.userId}`, ...)   // ✅ Đúng key
```

### 4. Backend - candidate.controller.js
**Thêm logging chi tiết**

```javascript
// ✅ Logging khi tạo candidate profile
if (user_id) {
  logger.info(`✅ Created candidate profile for user_id: ${user_id}, candidate_id: ${candidate.candidate_id}`);
} else {
  logger.info(`New candidate created: ${candidate.first_name} ${candidate.last_name}`);
}
```

## 🔐 Security Measures

### 1. Auth Middleware Protected
Route `/candidates/self-register` **YÊU CẦU authentication**:

```javascript
router.post(
  '/self-register',
  authMiddleware.verifyToken,  // ✅ Bắt buộc có token
  candidateController.createCandidate
);
```

### 2. Double Check
Kiểm tra cả `session` và `authToken`:

```javascript
if (!session || !session.userId || !authToken) {
  // Redirect to login
}
```

### 3. Auto Cleanup
Clear toàn bộ localStorage khi session invalid:

```javascript
localStorage.clear();  // ✅ Xóa sạch
```

## 📊 Session Flow

### Login Flow
```
1. User login at index.html
   ↓
2. POST /api/auth/login
   ↓
3. Backend returns:
   {
     user: { userId, username, email, role },
     token: "jwt_token_here"
   }
   ↓
4. Frontend saves:
   - localStorage.setItem('auth_token', token)
   - localStorage.setItem('session_user', JSON.stringify({
       userId,        ← CHỈ key này
       username,
       fullName,
       email,
       role,
       loginAt
     }))
   ↓
5. Redirect based on role:
   - RECRUITER → recruiter.html
   - CANDIDATE → exam.html
```

### Session Check Flow
```
1. User visits exam.html
   ↓
2. Check localStorage:
   - session_user exists?
   - session.userId exists?
   - auth_token exists?
   ↓
3. If ANY missing:
   - localStorage.clear()
   - Redirect to index.html
   ↓
4. If all valid:
   - console.log('✅ Session valid')
   - Continue to page
```

### API Call Flow
```
1. User clicks "Làm bài thi"
   ↓
2. Check session.userId ✅
   ↓
3. GET /api/candidates/by-user/{session.userId}
   Headers: { Authorization: Bearer {token} }
   ↓
4. If 404 (no candidate):
   - POST /api/candidates/self-register
   - Body: { user_id: session.userId, ... }
   ↓
5. Get candidate_id
   ↓
6. POST /api/candidate-tests/assign
   - Body: { candidate_id, test_id }
```

## 🧪 Testing Checklist

### 1. Clear Old Data
```javascript
// Trong Console (F12)
localStorage.clear();
location.reload();
```

### 2. Fresh Login
```
→ Go to: http://localhost:3000/index.html
→ Login with credentials
→ Check Console: "✅ User logged in: 1 CANDIDATE"
```

### 3. Check Session
```javascript
// Console:
console.log(JSON.parse(localStorage.getItem('session_user')));

// Expected output:
{
  userId: 1,         // ✅ Có userId
  username: "...",
  fullName: "...",
  email: "...",
  role: "CANDIDATE",
  loginAt: 1730559600000
}

// ❌ KHÔNG được có:
{
  user_id: 1,       // ❌ Key sai
  id: 1             // ❌ Key sai
}
```

### 4. Navigate to Exam
```
→ Click "Xem danh sách đề thi"
→ Check Console: "✅ Session valid: 1 CANDIDATE"
→ NO alert "Phiên đăng nhập đã hết hạn"
```

### 5. Click "Làm bài thi"
```
→ Check Console: "📝 Creating candidate profile for user: 1"
→ Or: "✅ Candidate found: 1"
→ Redirect to test.html with candidateTestId
```

### 6. Backend Logs
```bash
tail -f backend/logs/app.log

# Expected:
[INFO] User logged in: john CANDIDATE
[INFO] ✅ Created candidate profile for user_id: 1, candidate_id: 1
[INFO] Test ID 5 assigned to Candidate ID 1
```

## ❌ Common Errors & Solutions

### Error 1: "Phiên đăng nhập đã hết hạn"
**Cause**: Old session format in localStorage

**Solution**:
```javascript
localStorage.clear();
// Login lại
```

### Error 2: "Cannot read property 'userId' of null"
**Cause**: Session object không tồn tại

**Solution**: Check `session_user` có tồn tại không:
```javascript
const session = JSON.parse(localStorage.getItem('session_user') || 'null');
if (!session) {
  // Redirect to login
}
```

### Error 3: "Không tìm thấy hồ sơ ứng viên"
**Cause**: Candidate profile chưa được tạo

**Solution**: Code đã tự động tạo, check backend logs:
```bash
grep "Created candidate" backend/logs/app.log
```

### Error 4: API returns 401 Unauthorized
**Cause**: Token expired hoặc invalid

**Solution**:
```javascript
// Check token existence
const token = localStorage.getItem('auth_token');
console.log('Token:', token ? 'exists' : 'missing');

// If missing, clear and re-login
if (!token) {
  localStorage.clear();
  window.location.href = 'index.html';
}
```

## 🎯 Benefits

### 1. Consistency ✅
- **1 key duy nhất**: `userId` trong toàn bộ hệ thống
- Không còn confusion giữa `user_id`, `userId`, `id`

### 2. Maintainability ✅
- Dễ đọc, dễ debug
- Clear convention: camelCase cho JavaScript

### 3. Security ✅
- Check cả session và token
- Auto cleanup khi invalid
- Protected API endpoints

### 4. Debugging ✅
- Console logs rõ ràng
- Backend logs chi tiết
- Easy to trace issues

## 📝 Coding Standards

### JavaScript Convention
```javascript
// ✅ GOOD: camelCase cho JS
const userId = 1;
const fullName = "John";
const loginAt = Date.now();

// ❌ BAD: snake_case
const user_id = 1;
const full_name = "John";
```

### API Response Convention
```javascript
// ✅ GOOD: Consistent keys
{
  success: true,
  data: {
    userId: 1,
    username: "john",
    fullName: "John Doe"
  }
}

// ❌ BAD: Mixed conventions
{
  success: true,
  data: {
    user_id: 1,      // snake_case
    username: "john", // camelCase
    fullName: "John"  // camelCase
  }
}
```

## 🚀 Deployment Notes

### Environment Variables
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

### Production Considerations
1. **Token expiry**: Hiện tại là 7 days, có thể giảm xuống 1 day
2. **Refresh token**: Có thể implement refresh token mechanism
3. **HTTPS**: Bắt buộc dùng HTTPS trong production
4. **CORS**: Configure đúng CORS cho domain thật

## ✅ Conclusion

**Trước**: Lỗi "Phiên hết hạn" do key không nhất quán
**Sau**: Session ổn định với key chuẩn `userId`

**Next Steps**:
1. Clear localStorage và test lại toàn bộ flow
2. Monitor backend logs để đảm bảo không có lỗi
3. Test trên nhiều browser khác nhau
4. Consider implementing refresh token cho production
