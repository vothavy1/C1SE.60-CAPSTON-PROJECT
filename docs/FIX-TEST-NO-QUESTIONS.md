# 🔧 HƯỚNG DẪN SỬA LỖI: ĐỀ THI KHÔNG CÓ CÂU HỎI

## ❌ VẤN ĐỀ

- Ứng viên vào làm bài test nhưng **không thấy câu hỏi**
- Hiển thị: "⚠️ Đề thi chưa có câu hỏi"
- Recruiter không sửa được câu hỏi

## 🔍 NGUYÊN NHÂN

1. **Test chưa có câu hỏi** - Bảng `test_questions` trống cho test_id này
2. **Câu hỏi có company_id khác** - Recruiter không thấy câu hỏi của company khác
3. **Câu hỏi có company_id NULL** - Bị filter ra

## ✅ GIẢI PHÁP

### BƯỚC 1: Kiểm tra test có câu hỏi chưa

```sql
SELECT 
    t.test_id,
    t.test_name,
    t.company_id as test_company,
    COUNT(tq.question_id) as question_count
FROM tests t
LEFT JOIN test_questions tq ON t.test_id = tq.test_id
WHERE t.test_id = 32
GROUP BY t.test_id;
```

**Kết quả mong đợi:**
- `question_count > 0` = Có câu hỏi ✅
- `question_count = 0` = Không có câu hỏi ❌

### BƯỚC 2: Fix câu hỏi NULL company_id

```sql
-- Update tất cả questions chưa có company_id về CS60 (company 1)
UPDATE questions 
SET company_id = 1 
WHERE company_id IS NULL OR company_id = 0;
```

### BƯỚC 3: Thêm câu hỏi vào test (Recruiter làm trên UI)

**Cách 1: Qua trang Edit Test**

1. Đăng nhập với tài khoản Recruiter
2. Vào **Quản lý Đề Thi** → Tìm test cần sửa
3. Click **Sửa** (Edit)
4. Tại phần **"Thêm câu hỏi vào đề thi"**:
   - Chọn câu hỏi từ danh sách
   - Click **"Thêm"**
5. Click **"Cập nhật đề thi"**

**Cách 2: SQL trực tiếp (Emergency)**

```sql
-- VÍ DỤ: Thêm câu hỏi ID 1, 2, 3 vào test 32
INSERT INTO test_questions (test_id, question_id, question_order, score_weight)
VALUES 
    (32, 1, 1, 1),
    (32, 2, 2, 1),
    (32, 3, 3, 1);
```

**Lưu ý:** Chỉ thêm câu hỏi **cùng company_id** với test!

## 🛠️ KIỂM TRA SAU KHI SỬA

### 1. Kiểm tra test đã có câu hỏi

```sql
SELECT 
    tq.test_id,
    tq.question_id,
    tq.question_order,
    q.question_text,
    q.company_id
FROM test_questions tq
JOIN questions q ON tq.question_id = q.question_id
WHERE tq.test_id = 32
ORDER BY tq.question_order;
```

### 2. Test trên UI

1. **Recruiter:**
   - Vào edit test → Phải thấy danh sách câu hỏi
   - Có thể thêm/xóa câu hỏi

2. **Candidate:**
   - Start test → Phải thấy câu hỏi
   - Có thể trả lời và submit

## 🚨 VẤN ĐỀ THƯỜNG GẶP

### Q: Recruiter không thấy câu hỏi để thêm vào test?

**A:** Kiểm tra company_id:

```sql
-- Xem câu hỏi của công ty recruiter
SELECT 
    q.question_id,
    q.question_text,
    q.company_id,
    c.companyName
FROM questions q
LEFT JOIN companies c ON q.company_id = c.company_id
WHERE q.company_id = 3  -- Thay 3 bằng company_id của recruiter
LIMIT 10;
```

Nếu không có câu hỏi → **Tạo câu hỏi mới** cho company đó!

### Q: Recruiter không sửa được câu hỏi?

**A:** Kiểm tra permission:

```sql
SELECT 
    q.question_id,
    q.question_text,
    q.company_id as question_company,
    u.username,
    u.company_id as user_company
FROM questions q
CROSS JOIN users u
WHERE q.question_id = 123  -- ID câu hỏi muốn sửa
  AND u.email = 'recruiter@company.com';  -- Email recruiter
```

**Lỗi:** `question_company ≠ user_company` → Không có quyền sửa!

**Fix:** Đổi company_id của câu hỏi hoặc tạo câu hỏi mới.

### Q: Candidate vẫn không thấy câu hỏi sau khi thêm?

**A:** Có thể candidate đã start test **trước khi thêm câu hỏi**!

**Fix:**

```sql
-- Reset test để candidate có thể làm lại
UPDATE candidate_tests
SET status = 'ASSIGNED',
    start_time = NULL,
    end_time = NULL
WHERE candidate_test_id = 35;  -- ID của candidate test

-- Xóa answers cũ
DELETE FROM candidate_test_answers
WHERE candidate_test_id = 35;
```

## 📝 CHECKLIST SỬA LỖI

- [ ] Kiểm tra test có câu hỏi chưa
- [ ] Update questions NULL company_id
- [ ] Thêm câu hỏi vào test qua UI hoặc SQL
- [ ] Verify questions đã xuất hiện
- [ ] Test với candidate account
- [ ] Kiểm tra backend logs (không có errors)
- [ ] Verify recruiter có thể sửa câu hỏi

## 🎯 NGĂN CHẶN LỖI TRONG TƯƠNG LAI

### 1. Validate khi tạo test

Frontend nên check: **Test phải có ít nhất 1 câu hỏi** trước khi publish!

### 2. Auto-assign company_id

Khi recruiter tạo câu hỏi → Tự động set `company_id = req.user.company_id`

### 3. Warning UI

Hiển thị warning nếu test không có câu hỏi:
```
⚠️ Đề thi này chưa có câu hỏi! Vui lòng thêm ít nhất 1 câu hỏi trước khi gửi cho ứng viên.
```

---

**Ngày cập nhật:** 2025-11-22
**Người viết:** AI Assistant
