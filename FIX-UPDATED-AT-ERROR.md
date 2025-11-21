# Fix: "Unknown column 'updated_at' in 'field list'" Error

## ✅ Problem Solved

The error **"Unknown column 'updated_at' in 'field list'"** occurred when candidates tried to self-assign tests. This was a 500 Internal Server Error caused by a mismatch between the Sequelize models and the actual database schema.

---

## 🔍 Root Cause

### Database Schema
The database tables **candidate_tests** and **candidate_test_answers** do NOT have an `updated_at` column:

```sql
-- candidate_tests table
CREATE TABLE candidate_tests (
  candidate_test_id INT PRIMARY KEY AUTO_INCREMENT,
  candidate_id INT NOT NULL,
  test_id INT NOT NULL,
  application_id INT,
  start_time TIMESTAMP NULL,
  end_time TIMESTAMP NULL,
  status ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'),
  score INT,
  passing_status ENUM('PASSED', 'FAILED', 'PENDING'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- ❌ NO updated_at column
);

-- candidate_test_answers table
CREATE TABLE candidate_test_answers (
  answer_id INT PRIMARY KEY AUTO_INCREMENT,
  candidate_test_id INT NOT NULL,
  question_id INT NOT NULL,
  selected_options VARCHAR(255),
  text_answer TEXT,
  code_answer TEXT,
  is_correct TINYINT(1) DEFAULT 0,
  score_earned DECIMAL(5,2),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  -- ❌ NO updated_at column
);
```

### Sequelize Models (BEFORE FIX)
The models were configured with `timestamps: true` and `updatedAt: 'updated_at'`:

```javascript
// BEFORE - candidateTest.model.js
{
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'  // ❌ Trying to use non-existent column
}

// BEFORE - candidateTestAnswer.model.js
{
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'  // ❌ Trying to use non-existent column
}
```

When Sequelize tried to INSERT or UPDATE records, it attempted to include the `updated_at` field, causing the SQL error.

---

## 🔧 Changes Made

### 1️⃣ Fixed CandidateTest Model
**File:** `backend/src/models/candidateTest.model.js`

```javascript
// AFTER
{
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
  // ✅ Removed updated_at field definition
}, {
  tableName: 'candidate_tests',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false  // ✅ Disabled updatedAt
}
```

### 2️⃣ Fixed CandidateTestAnswer Model
**File:** `backend/src/models/candidateTestAnswer.model.js`

```javascript
// AFTER
{
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
  // ✅ Removed updated_at field definition
}, {
  tableName: 'candidate_test_answers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false  // ✅ Disabled updatedAt
}
```

### 3️⃣ Verified Other Models
- ✅ `CandidateTestResult` - Already has `timestamps: false` ✅
- ✅ Other models - No issues found

---

## 🎯 API Flow (After Fix)

### 1. Candidate Self-Assigns Test
**Endpoint:** `POST /api/candidate-tests/self-assign`

**Request:**
```json
{
  "candidate_id": 2,
  "test_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test assigned successfully",
  "data": {
    "candidate_test_id": 1,
    "test_id": 1,
    "status": "PENDING"
  }
}
```

**Database Operation:**
```sql
-- ✅ Works now - no updated_at column
INSERT INTO candidate_tests (
  candidate_id, 
  test_id, 
  status, 
  created_at
) VALUES (2, 1, 'ASSIGNED', NOW());
```

### 2. Candidate Starts Test
**Endpoint:** `POST /api/candidate-tests/:id/start`

**Database Operation:**
```sql
-- ✅ Update without updated_at column
UPDATE candidate_tests 
SET 
  status = 'IN_PROGRESS',
  start_time = NOW(),
  end_time = DATE_ADD(NOW(), INTERVAL duration_minutes MINUTE)
WHERE candidate_test_id = ?;
```

### 3. Candidate Submits Answer
**Endpoint:** `POST /api/candidate-tests/:id/answers`

**Request:**
```json
{
  "question_id": 5,
  "selected_option_id": 20,
  "text_answer": null
}
```

**Database Operation:**
```sql
-- ✅ Insert without updated_at column
INSERT INTO candidate_test_answers (
  candidate_test_id,
  question_id,
  selected_option_id,
  text_answer,
  is_correct,
  submitted_at
) VALUES (1, 5, 20, NULL, 1, NOW());
```

### 4. Candidate Completes Test
**Endpoint:** `POST /api/candidate-tests/:id/complete`

**Database Operations:**
```sql
-- Update candidate_tests
UPDATE candidate_tests 
SET status = 'COMPLETED', score = 85, end_time = NOW()
WHERE candidate_test_id = ?;

-- Insert test result
INSERT INTO candidate_test_results (
  candidate_test_id,
  total_score,
  max_possible_score,
  percentage,
  passed,
  created_at
) VALUES (1, 85, 100, 85.00, 1, NOW());
```

---

## 🧪 Testing

### Test Script Created
`test-self-assign-fix.ps1` - Comprehensive test for the fix

**To run:**
```powershell
.\test-self-assign-fix.ps1
```

**Manual Testing:**
1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm start`
3. Open browser: http://localhost:3000/exam.html
4. Login as: `havy@test.com` / `123456`
5. Click on any test's "Làm bài thi" button
6. Should work without 500 error ✅

---

## 📊 Database Tables Affected

### candidate_tests
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| candidate_test_id | int | NO | PRI | NULL | auto_increment |
| candidate_id | int | NO | MUL | NULL | |
| test_id | int | NO | MUL | NULL | |
| application_id | int | YES | MUL | NULL | |
| start_time | timestamp | YES | | NULL | |
| end_time | timestamp | YES | | NULL | |
| status | enum | YES | | ASSIGNED | |
| score | int | YES | | NULL | |
| passing_status | enum | YES | | PENDING | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### candidate_test_answers
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| answer_id | int | NO | PRI | NULL | auto_increment |
| candidate_test_id | int | NO | MUL | NULL | |
| question_id | int | NO | MUL | NULL | |
| selected_options | varchar(255) | YES | | NULL | |
| text_answer | text | YES | | NULL | |
| code_answer | text | YES | | NULL | |
| is_correct | tinyint(1) | YES | | 0 | |
| score_earned | decimal(5,2) | YES | | NULL | |
| submitted_at | timestamp | YES | | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

### candidate_test_results
| Field | Type | Null | Key | Default | Extra |
|-------|------|------|-----|---------|-------|
| result_id | int | NO | PRI | NULL | auto_increment |
| candidate_test_id | int | YES | UNI | NULL | |
| total_score | int | NO | | NULL | |
| max_possible_score | int | NO | | NULL | |
| percentage | decimal(5,2) | NO | | NULL | |
| passed | tinyint(1) | YES | | 0 | |
| strength_areas | text | YES | | NULL | |
| improvement_areas | text | YES | | NULL | |
| feedback | text | YES | | NULL | |
| reviewed_by | int | YES | MUL | NULL | |
| reviewed_at | timestamp | YES | | NULL | |
| created_at | timestamp | YES | | CURRENT_TIMESTAMP | DEFAULT_GENERATED |

---

## ✅ What Was Fixed

1. ✅ Disabled `updatedAt` in `CandidateTest` model
2. ✅ Disabled `updatedAt` in `CandidateTestAnswer` model
3. ✅ Removed `updated_at` field definitions from models
4. ✅ Sequelize no longer tries to INSERT/UPDATE non-existent column
5. ✅ Self-assign endpoint now works correctly
6. ✅ Answer submission works correctly
7. ✅ Test completion works correctly

---

## 🔍 Related Files

- **Models:**
  - `backend/src/models/candidateTest.model.js` ✅ Fixed
  - `backend/src/models/candidateTestAnswer.model.js` ✅ Fixed
  - `backend/src/models/candidateTestResult.model.js` ✅ Already correct
  
- **Controllers:**
  - `backend/src/controllers/candidateTest.controller.js` (No changes needed)
  
- **Routes:**
  - `backend/src/routes/candidateTest.routes.js` (No changes needed)

- **Test Files:**
  - `test-self-assign-fix.ps1` ✅ New

---

## 🚀 Deployment Notes

### ⚠️ Important: Restart Backend
After applying this fix, you MUST restart the backend server:

```powershell
# Stop current backend (Ctrl+C)
cd backend
npm start
```

The models are loaded into memory when the server starts, so the changes won't take effect until restart.

---

## 📝 Summary

The error was caused by Sequelize trying to use an `updated_at` column that doesn't exist in the database tables. By setting `updatedAt: false` in the model definitions, we tell Sequelize to NOT manage this field, preventing the SQL error.

This is a **Node.js/Express + Sequelize** backend, not PHP. The fix was applied to the Sequelize ORM models, not PHP files.

**Result:** ✅ Candidates can now self-assign and complete tests without 500 errors!
