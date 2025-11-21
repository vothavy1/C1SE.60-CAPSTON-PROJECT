# 📄 Hướng Dẫn: Thêm Ứng Viên với Upload CV

## 🎯 Tổng Quan

Chức năng thêm ứng viên đã được cập nhật với các tính năng:
- ✅ Upload CV/Resume (PDF only)
- ✅ Trạng thái tự động là "NEW"
- ✅ Nguồn ứng tuyển: Facebook, TikTok, Workshop, LinkedIn, Website, Giới thiệu, Khác
- ✅ Validation file (type, size)
- ✅ Lưu file vào server
- ✅ Lưu metadata vào database

## 📝 Changes Summary

### 1. Frontend (`candidate-list.html`)

#### ❌ Đã XÓA:
```html
<!-- Dropdown chọn trạng thái -->
<select id="status">
  <option value="NEW">Mới</option>
  <option value="SCREENING">Sàng lọc</option>
  ...
</select>
```

#### ✅ Đã THÊM:

**A. Nguồn ứng tuyển (Updated):**
```html
<select id="source" required>
  <option value="">Chọn nguồn</option>
  <option value="Facebook">Facebook</option>
  <option value="TikTok">TikTok</option>
  <option value="Workshop">Workshop</option>
  <option value="LinkedIn">LinkedIn</option>
  <option value="Website">Website</option>
  <option value="Referral">Giới thiệu</option>
  <option value="Other">Khác</option>
</select>
```

**B. Upload CV:**
```html
<input type="file" 
       id="resumeFile" 
       accept=".pdf" 
       class="..." />
<p class="text-xs text-gray-400">
  Chỉ chấp nhận file PDF, tối đa 5MB
</p>
```

**C. Info Message:**
```html
<div class="text-sm text-yellow-300 bg-yellow-900/20 p-3 rounded-lg">
  ℹ️ Trạng thái sẽ tự động được đặt là <strong>"Mới"</strong>
</div>
```

**D. Form Submit với FormData:**
```javascript
// Validate file
if (resumeFile) {
  if (resumeFile.type !== 'application/pdf') {
    alert('❌ Chỉ chấp nhận file PDF!');
    return;
  }
  if (resumeFile.size > 5 * 1024 * 1024) {
    alert('❌ File không được vượt quá 5MB!');
    return;
  }
}

// Use FormData for file upload
const formData = new FormData();
formData.append('first_name', ...);
formData.append('last_name', ...);
formData.append('email', ...);
formData.append('source', ...);
formData.append('status', 'NEW'); // Always NEW

if (resumeFile) {
  formData.append('resume', resumeFile);
}

// Send with proper headers
const token = localStorage.getItem('auth_token');
response = await fetch(`${API_BASE_URL}/candidates`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type for FormData
  },
  body: formData
});
```

### 2. Backend

#### A. Route (`candidate.routes.js`)

**Multer Configuration:**
```javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/cv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});
```

**Route with Multer:**
```javascript
router.post(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('candidate_create'),
  upload.single('resume'), // Handle file upload
  candidateController.createCandidate
);
```

#### B. Controller (`candidate.controller.js`)

**File Upload Handling:**
```javascript
// Validate required fields
if (!first_name || !last_name || !email || !source) {
  return res.status(400).json({
    success: false,
    message: 'Missing required fields'
  });
}

// Create candidate with status = 'NEW'
const candidate = await Candidate.create({
  first_name,
  last_name,
  email,
  source,
  status: 'NEW', // Always NEW
  ...
}, { transaction: t });

// Handle resume upload if file is present
let resumeData = null;
if (req.file) {
  const resumeFileName = req.file.filename;
  const resumeFilePath = `/uploads/cv/${resumeFileName}`;
  
  resumeData = await CandidateResume.create({
    candidate_id: candidate.candidate_id,
    file_name: req.file.originalname,
    file_path: resumeFilePath,
    file_size: req.file.size,
    file_type: req.file.mimetype,
    is_primary: true
  }, { transaction: t });
}

await t.commit();
```

**Error Handling - Cleanup:**
```javascript
catch (error) {
  await t.rollback();
  
  // Clean up uploaded file if exists
  if (req.file && req.file.path) {
    try {
      fs.unlinkSync(req.file.path);
      logger.info(`Cleaned up uploaded file`);
    } catch (cleanupError) {
      logger.error(`Failed to cleanup file`);
    }
  }
  
  return res.status(500).json({ error: error.message });
}
```

### 3. Database

#### Table: `candidate_resumes`

```sql
CREATE TABLE candidate_resumes (
  resume_id INT PRIMARY KEY AUTO_INCREMENT,
  candidate_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_primary BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id)
);
```

#### Sample Data After Upload:
```
resume_id: 1
candidate_id: 123
file_name: "John-Doe-Resume.pdf"
file_path: "/uploads/cv/John-Doe-Resume-1699123456789-987654321.pdf"
file_type: "application/pdf"
file_size: 245678
uploaded_at: "2025-11-03 10:30:00"
is_primary: 1
```

## 🔒 Security & Validation

### Client-side Validation (Frontend)
```javascript
// File type check
if (resumeFile.type !== 'application/pdf') {
  alert('❌ Chỉ chấp nhận file PDF!');
  return;
}

// File size check
if (resumeFile.size > 5 * 1024 * 1024) {
  alert('❌ File không được vượt quá 5MB!');
  return;
}
```

### Server-side Validation (Backend)
```javascript
// Multer fileFilter
fileFilter: function (req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
}

// Size limit
limits: { fileSize: 5 * 1024 * 1024 }

// Required fields
if (!first_name || !last_name || !email || !source) {
  return res.status(400).json({
    message: 'Missing required fields'
  });
}
```

### Authentication
```javascript
// Only RECRUITER and ADMIN can create candidates
router.post(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.hasPermission('candidate_create'),
  ...
);
```

## 📂 File Structure

```
backend/
├── uploads/
│   └── cv/
│       ├── README.md
│       └── John-Doe-Resume-1699123456789-987654321.pdf
├── src/
│   ├── routes/
│   │   └── candidate.routes.js (multer config)
│   ├── controllers/
│   │   └── candidate.controller.js (file handling)
│   └── models/
│       └── candidateResume.model.js
```

## 🧪 Testing Guide

### 1. Manual Testing

**A. Test với CV:**
```
1. Login với RECRUITER account
2. Vào "Danh sách ứng viên"
3. Click "Thêm Ứng Viên"
4. Điền form:
   - Họ: John
   - Tên: Doe
   - Email: john.doe@example.com
   - Nguồn: Facebook
   - Chọn file PDF (< 5MB)
5. Click "Lưu"
6. ✅ Expect: "Đã thêm ứng viên thành công! 📄 CV đã được upload"
```

**B. Test không có CV:**
```
1-4. Same as above
5. Không chọn file
6. Click "Lưu"
7. ✅ Expect: "Đã thêm ứng viên thành công!"
```

**C. Test validation:**
```
Test Case 1: File không phải PDF
- Chọn .docx file
- ✅ Expect: "Chỉ chấp nhận file PDF!"

Test Case 2: File quá lớn
- Chọn PDF > 5MB
- ✅ Expect: "File không được vượt quá 5MB!"

Test Case 3: Missing required fields
- Không điền email
- ✅ Expect: Backend returns 400 error
```

### 2. Database Testing

Run SQL script:
```bash
mysql -u root -p123456 -h localhost -P 3307 cs60_recruitment < test-candidate-cv-upload.sql
```

Or manually:
```sql
-- Check latest candidates
SELECT * FROM candidates ORDER BY created_at DESC LIMIT 5;

-- Check uploaded resumes
SELECT * FROM candidate_resumes ORDER BY uploaded_at DESC LIMIT 5;

-- Check candidates with resumes
SELECT c.*, cr.file_name, cr.file_path
FROM candidates c
LEFT JOIN candidate_resumes cr ON c.candidate_id = cr.candidate_id
WHERE cr.is_primary = 1
ORDER BY c.created_at DESC;
```

### 3. File System Testing

```powershell
# Check if files are uploaded
Get-ChildItem "d:\CAPSTON C1SE.60\CS.60\backend\uploads\cv\"

# Check file sizes
Get-ChildItem "d:\CAPSTON C1SE.60\CS.60\backend\uploads\cv\" | 
  Select-Object Name, Length, CreationTime | 
  Format-Table
```

### 4. API Testing (PowerShell)

```powershell
# Login first
$loginBody = @{
    username = "recruiter1"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method Post -Body $loginBody -ContentType "application/json"

$token = $loginResponse.token

# Create candidate with CV
$boundary = [System.Guid]::NewGuid().ToString()
$filePath = "C:\path\to\resume.pdf"
$fileBytes = [System.IO.File]::ReadAllBytes($filePath)
$fileEnc = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes)

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"first_name`"`r`n",
    "John",
    "--$boundary",
    "Content-Disposition: form-data; name=`"last_name`"`r`n",
    "Doe",
    "--$boundary",
    "Content-Disposition: form-data; name=`"email`"`r`n",
    "john.doe@example.com",
    "--$boundary",
    "Content-Disposition: form-data; name=`"source`"`r`n",
    "Facebook",
    "--$boundary",
    "Content-Disposition: form-data; name=`"resume`"; filename=`"resume.pdf`"",
    "Content-Type: application/pdf`r`n",
    $fileEnc,
    "--$boundary--"
) -join "`r`n"

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/candidates" `
  -Method Post `
  -Headers @{
    Authorization = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
  } `
  -Body $bodyLines

Write-Host "Response:" $response
```

## 🐛 Troubleshooting

### Issue 1: "Only PDF files are allowed!"
**Cause:** File type không phải PDF
**Solution:** Chỉ chọn file .pdf

### Issue 2: "File không được vượt quá 5MB"
**Cause:** File quá lớn
**Solution:** Compress PDF hoặc chọn file khác

### Issue 3: File upload nhưng không lưu vào DB
**Cause:** Transaction rollback do lỗi khác
**Solution:** Check backend logs, fix validation errors

### Issue 4: "ENOENT: no such file or directory"
**Cause:** Thư mục uploads/cv chưa tồn tại
**Solution:** Backend tự tạo thư mục, hoặc tạo manual:
```bash
mkdir -p backend/uploads/cv
```

### Issue 5: 403 Forbidden
**Cause:** User không có quyền candidate_create
**Solution:** Check role permissions in database

## 📊 Monitoring

### Check Upload Statistics
```sql
SELECT 
    DATE(uploaded_at) as upload_date,
    COUNT(*) as total_uploads,
    ROUND(AVG(file_size) / 1024, 2) as avg_size_kb,
    MAX(file_size) / 1024 / 1024 as max_size_mb
FROM candidate_resumes
GROUP BY DATE(uploaded_at)
ORDER BY upload_date DESC;
```

### Check Disk Usage
```powershell
$dir = "d:\CAPSTON C1SE.60\CS.60\backend\uploads\cv"
$totalSize = (Get-ChildItem $dir -Recurse | Measure-Object -Property Length -Sum).Sum
Write-Host "Total CV uploads: $([math]::Round($totalSize/1MB, 2)) MB"
```

## 🚀 Future Enhancements

- [ ] Support multiple file formats (DOC, DOCX)
- [ ] Resume parsing (extract text for search)
- [ ] Thumbnail preview
- [ ] Direct download from candidate list
- [ ] Multiple resumes per candidate
- [ ] Resume version history
- [ ] Automatic backup to cloud storage

---

**Updated:** 2025-11-03  
**Version:** 1.1.0  
**Status:** ✅ Production Ready
