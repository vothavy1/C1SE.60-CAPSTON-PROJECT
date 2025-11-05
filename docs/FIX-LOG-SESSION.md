# 🐛 Fix Log - Session & Candidate Issues

## Ngày: 2025-11-02

## ❌ Lỗi Gặp Phải:
**"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại"**

## 🔍 Nguyên Nhân:

### 1. **Session lưu sai key**
- ❌ Frontend lưu: `userId` (camelCase)
- ❌ Code check: `user_id` (snake_case)
- ✅ **Fix**: Lưu cả 2 format để tương thích

### 2. **User không có candidate profile**
- ❌ User đăng nhập nhưng không có record trong bảng `candidates`
- ❌ API `/candidates/by-user/:userId` trả về 404
- ✅ **Fix**: Tự động tạo candidate profile nếu chưa có

## ✅ Các File Đã Sửa:

### 1. `frontend/index.html` - Fix session storage
**Dòng 143-150**:
```javascript
// TRƯỚC:
localStorage.setItem('session_user', JSON.stringify({
  name: user.username || user.fullName || userInput,
  role: user.role,
  userId: user.id,  // ❌ Sai key
  email: user.email,
  loginAt: Date.now()
}));

// SAU:
localStorage.setItem('session_user', JSON.stringify({
  name: user.username || user.fullName || user.full_name || userInput,
  role: user.role,
  user_id: user.id || user.user_id,  // ✅ Thêm user_id
  userId: user.id || user.user_id,    // ✅ Giữ userId để tương thích
  email: user.email,
  loginAt: Date.now()
}));
```

### 2. `frontend/exam.html` - Auto-create candidate
**Dòng 310-340**:
```javascript
// Kiểm tra candidate profile
let candidateId;
const candidateResponse = await fetch(`${API_BASE_URL}/candidates/by-user/${session.user_id}`, {
  headers: getAuthHeaders()
});

if (candidateResponse.ok) {
  const candidateData = await candidateResponse.json();
  candidateId = candidateData.data?.candidate_id;
} else if (candidateResponse.status === 404) {
  // ✅ TỰ ĐỘNG TẠO CANDIDATE NẾU CHƯA CÓ
  console.log('Creating candidate profile for user:', session.user_id);
  
  const createCandidateResponse = await fetch(`${API_BASE_URL}/candidates/self-register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      user_id: session.user_id,
      first_name: session.name || 'User',
      last_name: '',
      email: session.email || '',
      status: 'ACTIVE'
    })
  });

  if (createCandidateResponse.ok) {
    const newCandidate = await createCandidateResponse.json();
    candidateId = newCandidate.data?.candidate_id;
    console.log('Created candidate profile:', candidateId);
  }
}
```

### 3. `backend/src/routes/candidate.routes.js` - Self-register route
**Dòng 24-29**:
```javascript
// ✅ THÊM ROUTE MỚI cho user tự tạo candidate profile
router.post(
  '/self-register',
  authMiddleware.verifyToken,
  candidateController.createCandidate
);
```

### 4. `backend/src/controllers/candidate.controller.js` - Support user_id
**Dòng 10-60**:
```javascript
exports.createCandidate = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      user_id,  // ✅ THÊM user_id
      first_name, 
      last_name, 
      email, 
      // ... other fields
      status
    } = req.body;

    // ✅ KIỂM TRA user_id trước
    if (user_id) {
      const existingByUser = await Candidate.findOne({ 
        where: { user_id },
        transaction: t
      });

      if (existingByUser) {
        await t.rollback();
        return res.status(400).json({ 
          success: false, 
          message: 'User already has a candidate profile',
          data: existingByUser
        });
      }
    }

    // Tạo candidate với user_id
    const candidate = await Candidate.create({
      user_id: user_id || null,  // ✅ Lưu user_id
      first_name,
      last_name,
      email,
      // ...
      status: status || 'NEW'
    }, { transaction: t });
```

## 🔄 Luồng Mới:

```
1. User login tại index.html
   ↓
2. Backend trả về: { user: { id, username, email, role }, token }
   ↓
3. Frontend lưu session với ĐÚNG format:
   {
     user_id: user.id,     ← Dùng để check
     userId: user.id,       ← Backward compatible
     name, role, email
   }
   ↓
4. User vào exam.html → Click "Làm bài thi"
   ↓
5. Check session.user_id ✅ (trước đây check userId ❌)
   ↓
6. GET /api/candidates/by-user/{user_id}
   ├─ 200 OK: Đã có candidate → Dùng candidate_id
   └─ 404 Not Found: Chưa có candidate
      ↓
      POST /api/candidates/self-register
      {
        user_id, first_name, last_name, email, status: 'ACTIVE'
      }
      ↓
      Tạo candidate mới → Lấy candidate_id
   ↓
7. POST /api/candidate-tests/assign
   {
     candidate_id,
     test_id
   }
   ↓
8. Nhận candidate_test_id → Redirect test.html
```

## 🧪 Test Lại:

1. **Clear localStorage** (quan trọng!):
```javascript
// Mở Console (F12) và chạy:
localStorage.clear();
```

2. **Login lại** tại `http://localhost:3000/index.html`

3. **Kiểm tra session**:
```javascript
// Console:
console.log(JSON.parse(localStorage.getItem('session_user')));
// Expected: { user_id: 1, userId: 1, name: "...", role: "CANDIDATE", ... }
```

4. **Click "Làm bài thi"**
   - ✅ Không còn lỗi "Phiên hết hạn"
   - ✅ Tự động tạo candidate nếu chưa có
   - ✅ Redirect đến test.html với candidateTestId

5. **Kiểm tra database**:
```sql
-- Xem candidate mới tạo
SELECT * FROM candidates WHERE user_id = 1;

-- Xem candidate_test
SELECT * FROM candidate_tests ORDER BY created_at DESC LIMIT 1;
```

## 📊 Kết Quả Mong Đợi:

### Database: `candidates`
```
candidate_id | user_id | first_name | last_name | email | status
1            | 1       | User       |           | ...   | ACTIVE
```

### Database: `candidate_tests`
```
candidate_test_id | candidate_id | test_id | status   | created_at
1                 | 1            | 5       | ASSIGNED | 2025-11-02 ...
```

### URL sau khi click "Làm bài thi":
```
http://localhost:3000/test.html?testId=5&candidateTestId=1
```

## ⚠️ Lưu Ý:

1. **Phải clear localStorage** sau khi update code
2. **User phải có role CANDIDATE** (role_id = 4)
3. **Test phải có status ACTIVE**
4. **Backend và frontend phải cùng chạy**

## 🎯 Tóm Tắt Fix:
- ✅ Session key: `userId` → `user_id`
- ✅ Auto-create candidate profile
- ✅ Self-register endpoint không cần permission
- ✅ Support `user_id` trong candidate creation

**Status: FIXED** ✅
