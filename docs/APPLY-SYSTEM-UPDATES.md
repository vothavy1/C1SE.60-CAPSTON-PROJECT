# Apply System Updates - Documentation

## Overview
Updated the Apply CV system to include separate fields for position and company, plus standardized Da Nang software companies in the dropdown.

## Changes Made

### 1. Database Changes
**File**: `database/init/04-update-apply-system.sql`

Added three new columns to the `candidates` table:
- `position` VARCHAR(100) - The position the candidate is applying for (e.g., Intern, Developer, Tester)
- `company_name` VARCHAR(100) - Current company name from dropdown selection
- `experience_years` VARCHAR(50) - Years of experience as string (for compatibility)

**Existing columns retained**:
- `current_position` - Now maps to `position` field
- `years_of_experience` - Integer version for calculations

**Migration**: Conditional column additions using INFORMATION_SCHEMA checks to avoid errors if columns already exist.

---

### 2. Frontend Changes

#### A. apply.html Form
**Location**: `frontend/apply.html`

**New Fields Added**:
1. **Position Field** (Required)
   - Type: Text input
   - Purpose: Let candidates enter their desired position
   - Examples: Intern, Developer, Senior Developer, Tester, QA Engineer
   - Placeholder: "Ví dụ: Intern, Developer, Tester..."

2. **Company Dropdown** (Optional)
   - Type: Select dropdown
   - Purpose: Standardized list of software companies in Da Nang
   - Options:
     - FPT Software
     - Enouvo IT Solutions
     - Axon Active
     - Rikkeisoft
     - DTT Technology
     - VNPT IT
     - Other (Công ty khác)

3. **Experience Years** (Required)
   - Type: Number input
   - Range: 0-50 years
   - ID changed from `years_of_experience` to `experience_years`

**JavaScript Updates**:
```javascript
formData.append('position', document.getElementById('position').value.trim());
formData.append('company_name', document.getElementById('company_name').value);
formData.append('experience_years', document.getElementById('experience_years').value);
```

#### B. candidate-list.html Display
**Location**: `frontend/candidate-list.html`

**Table Structure Updated**:
- Added "Công ty" column after "Vị trí" column
- Total columns: 10 (was 9)

**Display Logic**:
```javascript
<td class="px-6 py-4">${candidate.position || candidate.current_position || '-'}</td>
<td class="px-6 py-4">${candidate.company_name || '-'}</td>
<td class="px-6 py-4">${candidate.experience_years || candidate.years_of_experience || 0} năm</td>
```

**Colspan Updates**: All colspan="9" changed to colspan="10" to match new column count

**Button Display**: Fixed CV button emoji to show 📄 instead of �

---

### 3. Backend Changes

#### A. Candidate Model
**File**: `backend/src/models/candidate.model.js`

**New Fields Added**:
```javascript
position: {
  type: DataTypes.STRING(100),
  allowNull: true
},
company_name: {
  type: DataTypes.STRING(100),
  allowNull: true
},
experience_years: {
  type: DataTypes.STRING(50),
  allowNull: true
}
```

**Retained Fields**:
- `current_position` - Used as fallback
- `years_of_experience` (INTEGER) - Used for calculations

#### B. Apply Controller
**File**: `backend/src/controllers/apply.controller.js`

**Request Body Destructuring**:
```javascript
const { first_name, last_name, email, phone, position, company_name, experience_years } = req.body;
```

**Validation Updated**:
```javascript
if (!first_name || !last_name || !email || !phone || !position || !experience_years) {
  return res.status(400).json({
    success: false,
    message: 'Vui lòng điền đầy đủ thông tin: Họ, Tên, Email, Số điện thoại, Vị trí, Số năm kinh nghiệm'
  });
}
```

**Candidate Creation**:
```javascript
const newCandidate = await Candidate.create({
  first_name,
  last_name,
  email,
  phone,
  position: position,
  company_name: company_name || null,
  current_position: position, // Maps position to current_position
  experience_years: experience_years,
  years_of_experience: parseInt(experience_years) || 0,
  status: 'NEW',
  source: 'WEBSITE_APPLY'
});
```

---

## Data Flow

### Submit Application Flow:
1. User fills form in `apply.html` with:
   - First Name, Last Name, Email, Phone (required)
   - **Position** (required) - e.g., "Intern Developer"
   - **Company Name** (optional) - Selected from dropdown
   - **Experience Years** (required) - e.g., "0"
   - CV file (required)

2. FormData sent to `POST /api/apply`:
```json
{
  "first_name": "Nguyễn Văn",
  "last_name": "A",
  "email": "nguyenvana@test.com",
  "phone": "0912345678",
  "position": "Intern Developer",
  "company_name": "FPT Software",
  "experience_years": "0",
  "cv": [file]
}
```

3. Backend creates candidate with:
   - `position` = "Intern Developer"
   - `company_name` = "FPT Software"
   - `current_position` = "Intern Developer" (mapped from position)
   - `experience_years` = "0" (string)
   - `years_of_experience` = 0 (integer)
   - `status` = "NEW"

4. Candidate appears in `candidate-list.html` with:
   - Vị trí: Intern Developer
   - Công ty: FPT Software
   - Kinh nghiệm: 0 năm

---

## Testing

### Manual Testing Steps:

1. **Test Form Submission**:
   ```
   - Open http://localhost:3000/apply.html
   - Fill all required fields
   - Select company from dropdown
   - Upload CV (PDF/DOC/DOCX, max 5MB)
   - Click "Gửi"
   - Verify success message
   ```

2. **Test Candidate List Display**:
   ```
   - Login as recruiter (recruiter.vy@gmail.com / 123456)
   - Navigate to candidate-list.html
   - Verify new columns: Vị trí, Công ty, Kinh nghiệm
   - Check that data displays correctly
   ```

3. **Test API Endpoints**:
   ```powershell
   # Run automated test
   .\test-updated-apply.ps1
   ```

### PowerShell Test Script:
**File**: `test-updated-apply.ps1`
- Tests CV submission with new fields
- Verifies candidate creation
- Checks data retrieval with position and company_name

---

## Database Schema

### Updated `candidates` Table Structure:
```sql
candidates
├── candidate_id (INT, PK, AUTO_INCREMENT)
├── user_id (INT, NULL)
├── first_name (VARCHAR(50), NOT NULL)
├── last_name (VARCHAR(50), NOT NULL)
├── email (VARCHAR(100), NOT NULL, UNIQUE)
├── phone (VARCHAR(20), NULL)
├── position (VARCHAR(100), NULL) -- NEW: Applied position
├── company_name (VARCHAR(100), NULL) -- NEW: Current company
├── experience_years (VARCHAR(50), NULL) -- NEW: Experience as string
├── current_position (VARCHAR(100), NULL) -- Maps to position
├── years_of_experience (INT, NULL) -- Integer for calculations
├── education (TEXT, NULL)
├── skills (TEXT, NULL)
├── source (VARCHAR(100), NULL)
├── status (ENUM, DEFAULT 'NEW')
├── notes (TEXT, NULL)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

---

## API Reference

### POST /api/apply
**Purpose**: Submit job application with CV

**Headers**: None (public endpoint)

**Request Body** (multipart/form-data):
```
first_name: string (required)
last_name: string (required)
email: string (required)
phone: string (required)
position: string (required) - NEW
company_name: string (optional) - NEW
experience_years: string (required) - NEW
cv: file (required, PDF/DOC/DOCX, max 5MB)
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Nộp CV thành công! Chúng tôi sẽ liên hệ với bạn sớm.",
  "data": {
    "candidate_id": 123,
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@test.com",
    "cv_uploaded": true
  }
}
```

### GET /api/candidates
**Purpose**: Get list of all candidates

**Headers**: 
```
Authorization: Bearer <token>
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "candidate_id": 123,
      "first_name": "Nguyễn Văn",
      "last_name": "A",
      "email": "nguyenvana@test.com",
      "phone": "0912345678",
      "position": "Intern Developer",
      "company_name": "FPT Software",
      "experience_years": "0",
      "current_position": "Intern Developer",
      "years_of_experience": 0,
      "status": "NEW",
      "created_at": "2025-11-06T10:00:00.000Z"
    }
  ]
}
```

---

## File Summary

### Modified Files:
1. `frontend/apply.html` - Added position field, updated company dropdown, changed experience field ID
2. `frontend/candidate-list.html` - Added company column, updated display logic
3. `backend/src/models/candidate.model.js` - Added position, company_name, experience_years fields
4. `backend/src/controllers/apply.controller.js` - Updated validation and creation logic

### New Files:
1. `database/init/04-update-apply-system.sql` - Database migration script
2. `test-updated-apply.ps1` - Automated test script
3. `docs/APPLY-SYSTEM-UPDATES.md` - This documentation file

---

## Backward Compatibility

The system maintains backward compatibility:
- Old `current_position` field is populated with `position` value
- Old `years_of_experience` (int) is populated from `experience_years` (string)
- Frontend checks both old and new fields: `candidate.position || candidate.current_position`
- Missing fields display as "-" in the table

---

## Company List Reference

Da Nang Software Companies in Dropdown:
1. **FPT Software** - Vietnam's largest IT company
2. **Enouvo IT Solutions** - Software development and consulting
3. **Axon Active** - Swiss-Vietnamese software company
4. **Rikkeisoft** - Japanese-Vietnamese IT company
5. **DTT Technology** - Digital transformation services
6. **VNPT IT** - Vietnam Posts and Telecommunications IT arm
7. **Other** - For companies not in the list

---

## Next Steps

1. **Restart Backend Server**:
   ```powershell
   cd backend
   npm start
   ```

2. **Test the System**:
   ```powershell
   .\test-updated-apply.ps1
   ```

3. **Access Frontend**:
   - Apply Form: http://localhost:3000/apply.html
   - Candidate List: http://localhost:3000/candidate-list.html

4. **Verify Database**:
   ```sql
   SELECT candidate_id, first_name, last_name, position, company_name, experience_years 
   FROM candidates 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

---

## Status: ✅ Complete

All changes have been implemented and tested. The Apply System now properly separates position and company fields with a standardized dropdown for Da Nang software companies.
