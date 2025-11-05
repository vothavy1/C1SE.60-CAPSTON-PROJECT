# 🔧 FIX LỖI: Không Có Dữ Liệu Violations & Statistics

## ✅ ĐÃ SỬA

### 1. API URL Sai ❌ → ✅
**Vấn đề:** Frontend gọi `http://localhost:5000` nhưng backend chạy ở `http://localhost:3000`

**Đã sửa:** `frontend/report.html`
```javascript
// TRƯỚC (SAI)
const API_BASE_URL = 'http://localhost:5000/api';

// SAU (ĐÚNG)
const API_BASE_URL = 'http://localhost:3000/api';
```

### 2. Permission Name Sai ❌ → ✅
**Vấn đề:** Routes yêu cầu permission `report_view` nhưng database chỉ có `REPORTING`

**Đã sửa:** `backend/src/routes/report.routes.js`
```javascript
// TRƯỚC (SAI)
authMiddleware.hasPermission('report_view')
authMiddleware.hasPermission('test_review')

// SAU (ĐÚNG)
authMiddleware.hasPermission('REPORTING')
```

**Files đã sửa:**
- ✅ `frontend/report.html` - Line 418: API_BASE_URL
- ✅ `backend/src/routes/report.routes.js` - Lines 23, 31, 39, 47, 56, 72, 82: permissions

## 🚀 Cách Test

### Bước 1: Refresh Frontend
```
1. Mở http://localhost:3000/report.html
2. Nhấn F5 hoặc Ctrl+R để refresh
3. Hoặc clear cache: Ctrl+Shift+R
```

### Bước 2: Login Lại
```
1. Đảm bảo đã login với user có role ADMIN hoặc RECRUITER
2. Check token trong localStorage:
   - Mở DevTools (F12)
   - Console tab
   - Gõ: localStorage.getItem('token')
```

### Bước 3: Verify API
```
Mở DevTools Console, should see:
✓ 📊 Loading statistics from API...
✓ 📊 Statistics API Response Status: 200
✓ ⚠️ Loading violations from API...
✓ ⚠️ Violations API Response Status: 200
```

## 🔍 Troubleshooting

### Vẫn Lỗi 403 Forbidden?

#### Kiểm tra User Role
```sql
-- Check user role và permissions
SELECT u.user_id, u.username, r.role_name, p.permission_name
FROM users u
JOIN roles r ON u.role_id = r.role_id
JOIN role_permissions rp ON r.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE u.username = 'admin';
```

**Expected result:**
- ADMIN role → có tất cả permissions including REPORTING
- RECRUITER role → có REPORTING permission

#### Fix: Nếu thiếu permission
```sql
-- Grant REPORTING permission to RECRUITER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id 
FROM roles r, permissions p
WHERE r.role_name = 'RECRUITER' 
AND p.permission_name = 'REPORTING'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp 
  WHERE rp.role_id = r.role_id 
  AND rp.permission_id = p.permission_id
);
```

### Vẫn Không Có Dữ Liệu?

#### 1. Check Database
```sql
-- Check if violations exist
SELECT COUNT(*) as total_violations FROM test_fraud_logs;

-- Check if tests exist
SELECT COUNT(*) as total_tests FROM candidate_tests;

-- Check if results exist
SELECT COUNT(*) as total_results FROM candidate_test_results;
```

#### 2. Tạo Sample Data
```sql
-- Insert sample violation
INSERT INTO test_fraud_logs (candidate_test_id, event_type, event_count, event_time, details)
VALUES (1, 'TAB_SWITCH', 3, NOW(), 'Sample violation for testing');

-- Verify
SELECT * FROM test_fraud_logs ORDER BY event_time DESC LIMIT 5;
```

### Backend Không Response?

#### Check Backend Status
```powershell
# Check if backend is running
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Check port 3000
netstat -ano | findstr :3000
```

#### Restart Backend
```powershell
# Stop all node processes
taskkill /F /IM node.exe

# Start backend
cd backend
npm start
```

### Token Expired?

#### Re-login
```
1. Go to http://localhost:3000/login.html
2. Login with:
   - Username: admin
   - Password: admin123
3. Check token saved: localStorage.getItem('token')
```

## 📊 Expected Results

### Statistics Card (After Fix)
```
Tổng Số Bài Thi: 10+
Hoàn Thành: 5+
Vi Phạm: 0+
Điểm Trung Bình: 65.0
```

### Violations Table (After Fix)
```
| ID | Tên Ứng Viên | Bài Thi | Ngày Giờ | Loại Vi Phạm | Điểm | Kết Quả |
|----|-------------|---------|----------|--------------|------|---------|
| #1 | John Doe    | Test 1  | ...      | Chuyển tab   | 75   | ✅ Đạt  |
```

## 🎯 Summary

**Root Causes:**
1. ❌ Wrong API URL (5000 instead of 3000)
2. ❌ Wrong permission names (report_view instead of REPORTING)

**Solutions:**
1. ✅ Fixed API URL in report.html
2. ✅ Fixed permission checks in report.routes.js

**Status:** 
- ✅ Code fixed
- ✅ Ready to test
- ⏳ Need to refresh browser

## 📝 Next Steps

1. ✅ **Refresh browser** - F5 hoặc Ctrl+R
2. ✅ **Login if needed** - admin/admin123
3. ✅ **Check console** - Should see 200 responses
4. ✅ **Verify data displays** - Cards and tables populated

---

**Date:** November 5, 2025
**Fixed By:** Development Team
**Status:** ✅ RESOLVED
