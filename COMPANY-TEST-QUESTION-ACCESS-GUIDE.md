# 🏢 Hệ thống phân quyền Đề thi và Câu hỏi theo Công ty

## ✅ Đã hoàn thành

### 1. Database Migration
- ✅ Thêm cột `company_id` vào bảng `tests`
- ✅ Thêm cột `company_id` vào bảng `questions`
- ✅ Gán tất cả đề thi và câu hỏi hiện có cho CS60 Company (company_id = 1)

### 2. Models
- ✅ Cập nhật `Test` model với trường `company_id`
- ✅ Cập nhật `Question` model với trường `company_id`

### 3. Controllers - Test Management
- ✅ `getAllTests()`: Recruiter chỉ xem được đề thi của công ty mình
- ✅ `getTestById()`: Kiểm tra quyền truy cập theo company_id
- ✅ `createTest()`: Tự động gán company_id khi tạo đề thi mới
- ✅ `updateTest()`: Chỉ cho phép cập nhật đề thi của công ty mình
- ✅ `deleteTest()`: Chỉ cho phép xóa đề thi của công ty mình

### 4. Controllers - Question Management
- ✅ `getAllQuestions()`: Recruiter chỉ xem được câu hỏi của công ty mình
- ✅ `getQuestionById()`: Kiểm tra quyền truy cập theo company_id
- ✅ `createQuestion()`: Tự động gán company_id khi tạo câu hỏi mới
- ✅ `updateQuestion()`: Chỉ cho phép cập nhật câu hỏi của công ty mình
- ✅ `deleteQuestion()`: Chỉ cho phép xóa câu hỏi của công ty mình

## 🧪 Cách kiểm tra

### Bước 1: Đăng xuất và đăng nhập lại
1. Click nút **"Đăng xuất"** ở góc trên bên phải
2. Đăng nhập lại với tài khoản recruiter của CS60:
   - Email: `recruiter@cs60.com`
   - Password: (mật khẩu bạn đã đặt)

### Bước 2: Kiểm tra Đề thi
1. Vào trang **"Quản lý đề thi"**
2. Bạn chỉ thấy các đề thi có `company_id = 1` (CS60 Company)
3. Thử tạo đề thi mới - sẽ tự động được gán vào CS60 Company

### Bước 3: Kiểm tra Câu hỏi
1. Vào trang **"Quản lý câu hỏi"**
2. Bạn chỉ thấy các câu hỏi có `company_id = 1` (CS60 Company)
3. Thử tạo câu hỏi mới - sẽ tự động được gán vào CS60 Company

### Bước 4: Kiểm tra với công ty khác
1. Tạo tài khoản recruiter mới cho công ty khác:
   - Email: `recruiter@agency.com`
   - Password: (tự đặt)
   - Chọn Role: **Recruiter**
   - Chọn Company: **Recruitment Agency** (company_id = 2)

2. Đăng nhập với tài khoản này
3. Vào "Quản lý đề thi" và "Quản lý câu hỏi"
4. **Kết quả**: Sẽ không thấy dữ liệu (vì chưa có đề thi/câu hỏi nào của company_id = 2)

## 📊 Dữ liệu hiện tại

### Công ty trong hệ thống:
```
company_id = 1: CS60 Company
company_id = 2: Recruitment Agency
company_id = 3: Digital Solutions
```

### Đề thi và Câu hỏi:
- Tất cả 5 đề thi hiện có: `company_id = 1` (CS60)
- Tất cả 19 câu hỏi hiện có: `company_id = 1` (CS60)

## 🔒 Phân quyền theo Role

### ADMIN:
- ✅ Xem tất cả đề thi và câu hỏi của mọi công ty
- ✅ Tạo, sửa, xóa không bị giới hạn theo công ty

### RECRUITER:
- ✅ Chỉ xem đề thi và câu hỏi của công ty mình
- ✅ Chỉ tạo, sửa, xóa đề thi/câu hỏi của công ty mình
- ❌ Không thể truy cập dữ liệu của công ty khác (trả về 403 Forbidden)

### CANDIDATE:
- ❌ Không có quyền truy cập quản lý đề thi/câu hỏi

## 📝 Console Logs để debug

Khi recruiter truy cập, backend sẽ log:
```
👤 User: recruiter@cs60.com, Role: RECRUITER, Company ID: 1
🔒 RECRUITER FILTER APPLIED: Only showing tests with company_id = 1
```

Khi recruiter cố truy cập dữ liệu công ty khác:
```
🚫 ACCESS DENIED: Recruiter company_id=1 tried to access test company_id=2
```

## 🎯 Kết quả mong đợi

✅ Recruiter công ty A **KHÔNG THỂ** xem đề thi/câu hỏi của công ty B
✅ Recruiter công ty A **KHÔNG THỂ** sửa/xóa đề thi/câu hỏi của công ty B
✅ Khi tạo mới, đề thi/câu hỏi tự động được gán vào công ty của recruiter
✅ Admin vẫn có toàn quyền xem và quản lý tất cả

## ⚠️ Lưu ý

1. **Phải đăng xuất và đăng nhập lại** để JWT token mới có `company_id`
2. User cũ đã có `company_id = 1` trong database (đã update ở bước trước)
3. Backend đã được restart với code mới
