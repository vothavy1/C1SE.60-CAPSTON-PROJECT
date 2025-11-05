# Backend Exam Submission Routes - Final Alignment

## ✅ Current Status

All code has been fixed to match the existing database schema. **NO database changes were made**.

---

## 📋 Database Schema (Verified)

### `candidate_tests` table
```sql
candidate_test_id       int PRIMARY KEY AUTO_INCREMENT
candidate_id            int NOT NULL
test_id                 int NOT NULL
application_id          int
start_time              timestamp
end_time                timestamp
status                  enum('ASSIGNED','IN_PROGRESS','COMPLETED','EXPIRED')
score                   int
passing_status          enum('PASSED','FAILED','PENDING')
created_at              timestamp DEFAULT CURRENT_TIMESTAMP
```

### `candidate_test_answers` table
```sql
answer_id               int PRIMARY KEY AUTO_INCREMENT
candidate_test_id       int NOT NULL
question_id             int NOT NULL
selected_options        varchar(255)    -- ✅ STRING, not INT
text_answer             text
code_answer             text
is_correct              tinyint(1) DEFAULT 0
score_earned            decimal(5,2)
submitted_at            timestamp DEFAULT CURRENT_TIMESTAMP
```

**❌ NO `created_at` or `updated_at` columns**

---

## 🔧 Files Fixed

### 1️⃣ `backend/src/routes/candidateTest.routes.js`
✅ All routes correctly defined:

```javascript
// Self-assign route
router.post('/self-assign', authMiddleware.verifyToken, candidateTestController.selfAssignTest);

// Test flow routes
router.post('/:id/start', authMiddleware.verifyToken, candidateTestController.startTest);
router.post('/:id/answers', authMiddleware.verifyToken, candidateTestController.submitAnswer);
router.post('/:id/complete', authMiddleware.verifyToken, candidateTestController.completeTest);
```

**Full URLs:**
- `POST /api/candidate-tests/self-assign`
- `POST /api/candidate-tests/:id/start`
- `POST /api/candidate-tests/:id/answers` ← Must be `/answers` (plural)
- `POST /api/candidate-tests/:id/complete`

---

### 2️⃣ `backend/src/models/candidateTestAnswer.model.js`
✅ Model matches database exactly:

```javascript
const CandidateTestAnswer = sequelize.define('CandidateTestAnswer', {
  answer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  candidate_test_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  selected_options: {              // ✅ Matches DB column name
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'selected_options'
  },
  text_answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  code_answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: 0
  },
  score_earned: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'score_earned'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    field: 'submitted_at'
  }
}, {
  tableName: 'candidate_test_answers',
  timestamps: false  // ✅ NO timestamps
});
```

**Key fixes:**
- ✅ Uses `selected_options` (STRING) not `selected_option_id` (INTEGER)
- ✅ Includes `code_answer` field
- ✅ Uses `score_earned` not `score`
- ✅ Uses `submitted_at` not `created_at`
- ✅ `timestamps: false` - no automatic created_at/updated_at

---

### 3️⃣ `backend/src/controllers/candidateTest.controller.js`

#### **startTest()**
✅ Fixed to use correct columns and authentication:

```javascript
exports.startTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.user_id;
    
    // Verify candidate ownership
    const candidate = await Candidate.findOne({
      where: { user_id: userId },
      transaction: t
    });
    
    // Find test with status ASSIGNED or IN_PROGRESS
    const candidateTest = await CandidateTest.findOne({
      where: {
        candidate_test_id: id,
        candidate_id: candidate.candidate_id,
        status: { [Op.in]: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      transaction: t
    });
    
    // Update test status
    await candidateTest.update({
      status: 'IN_PROGRESS',
      start_time: new Date(),
      end_time: new Date(Date.now() + candidateTest.Test.duration_minutes * 60000)
    }, { transaction: t });
    
    // ... return questions
  } catch (error) {
    console.error('❌ Error starting test:', error.message);
    console.error(error.stack);
    // ... error response
  }
};
```

**Key fixes:**
- ✅ Uses `req.user` for authentication
- ✅ Verifies candidate ownership
- ✅ Checks for `ASSIGNED` or `IN_PROGRESS` status
- ✅ Only updates `status`, `start_time`, `end_time`
- ✅ Added `console.error()` for debugging

---

#### **submitAnswer()**
✅ Fixed to use correct column names:

```javascript
exports.submitAnswer = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { question_id, selected_option_id, text_answer, code_answer } = req.body;
    
    // Verify candidate ownership
    const userId = req.user.userId || req.user.user_id;
    const candidate = await Candidate.findOne({ where: { user_id: userId } });
    
    // Convert selected_option_id to string for selected_options column
    const selectedOptions = selected_option_id ? String(selected_option_id) : null;
    
    // Create or update answer
    const answer = await CandidateTestAnswer.create({
      candidate_test_id: id,
      question_id,
      selected_options: selectedOptions,  // ✅ STRING column
      text_answer: text_answer || null,
      code_answer: code_answer || null,
      is_correct: isCorrect !== null ? isCorrect : 0,
      submitted_at: new Date()             // ✅ Set timestamp
    }, { transaction: t });
    
    // ... success response
  } catch (error) {
    console.error('❌ Error submitting answer:', error.message);
    console.error(error.stack);
    // ... error response
  }
};
```

**Key fixes:**
- ✅ Uses `selected_options` (STRING) not `selected_option_id` (INTEGER)
- ✅ Converts integer to string: `String(selected_option_id)`
- ✅ Supports `code_answer` for coding questions
- ✅ Allows NULL for essay questions
- ✅ Sets `submitted_at` timestamp
- ✅ Added `console.error()` for debugging

---

#### **completeTest()**
✅ Fixed to use correct columns:

```javascript
exports.completeTest = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Verify candidate ownership
    const userId = req.user.userId || req.user.user_id;
    const candidate = await Candidate.findOne({ where: { user_id: userId } });
    
    // Calculate score from answers
    // ...
    
    // Update test status - only columns that exist
    await candidateTest.update({
      status: 'COMPLETED',
      score: Math.round(percentageScore),
      passing_status: isPassing ? 'PASSED' : 'PENDING'
      // ❌ NO completed_at column
    }, { transaction: t });
    
    // Create or update result
    // ...
    
  } catch (error) {
    console.error('❌ Error completing test:', error.message);
    console.error(error.stack);
    // ... error response
  }
};
```

**Key fixes:**
- ✅ Only updates columns that exist in DB
- ✅ Uses `passing_status` enum
- ✅ No reference to `completed_at` or `updated_at`
- ✅ Added `console.error()` for debugging

---

### 4️⃣ `frontend/test.html`
✅ Updated to use correct endpoint:

```javascript
// BEFORE
const answerResponse = await fetch(`${API_BASE_URL}/candidate-tests/${candidateTestId}/answer`, ...);

// AFTER
const answerResponse = await fetch(`${API_BASE_URL}/candidate-tests/${candidateTestId}/answers`, ...);
```

---

## 🚀 Restart Instructions

**⚠️ CRITICAL: Backend MUST be restarted for changes to take effect!**

### Option 1: Use restart script
```powershell
.\restart-backend.ps1
```

This will:
1. Stop existing backend processes
2. Start backend in new window
3. Test all routes
4. Show status of each route

### Option 2: Manual restart
```powershell
# Stop backend (Ctrl+C in terminal)
cd backend
npm start
```

---

## 🧪 Testing Checklist

After restarting backend:

### 1. Test Start
- [ ] Open: http://localhost:3000/exam.html
- [ ] Login: `havy@test.com` / `123456`
- [ ] Click "Làm bài thi"
- [ ] Should see questions without 500 error
- [ ] Check backend console for any errors

### 2. Test Submit Answer (Multiple Choice)
- [ ] Select an answer
- [ ] Click next question
- [ ] Should submit without 404 error
- [ ] Backend should log: `✅ Answer submitted for question X`

### 3. Test Submit Answer (Essay)
- [ ] Type text answer
- [ ] Click next question
- [ ] Should submit without error
- [ ] Answer should save with `text_answer` field

### 4. Test Complete
- [ ] Click "Nộp bài"
- [ ] Should complete without 500 error
- [ ] Should redirect to results
- [ ] Backend should log: `✅ Candidate Test ID X completed`

---

## 🐛 Debugging

### If you still see 404 errors:

**Check 1: Routes are registered**
```powershell
# Test if route exists
curl -X POST http://localhost:5000/api/candidate-tests/1/answers -H "Authorization: Bearer TOKEN"

# If 404, routes not registered
# If 401/403/500, routes ARE registered (auth/logic error)
```

**Check 2: Backend is using new code**
```powershell
# Look for this in backend console when starting:
# "Server running on port 5000"
# "✅ Candidate X self-assigned test Y"  (from new code)
```

**Check 3: Model is correct**
```powershell
# In backend console, you should see Sequelize loading models
# Look for: "Executing (default): SELECT * FROM candidate_test_answers"
```

### If you see 500 errors:

**Check backend console for:**
```
❌ Error submitting answer: <error message>
    at <stack trace>
```

**Common issues:**
- Column name mismatch → Check model field names
- NULL constraint violation → Allow NULL in model
- Data type mismatch → STRING vs INTEGER

---

## ✅ Verification

Run this SQL to verify data is being saved correctly:

```sql
-- Check last submitted answer
SELECT * FROM candidate_test_answers 
ORDER BY answer_id DESC LIMIT 1;

-- Should show:
-- selected_options: '95' (string)
-- text_answer: NULL or 'essay text'
-- code_answer: NULL or 'code'
-- submitted_at: '2025-11-03 14:30:00'
```

---

## 📝 Summary

### What was fixed:
1. ✅ Route path: `/answer` → `/answers`
2. ✅ Model field: `selected_option_id` → `selected_options`
3. ✅ Data type: INTEGER → STRING
4. ✅ Timestamps: Disabled automatic timestamps
5. ✅ Removed: References to non-existent columns
6. ✅ Added: Proper error logging with `console.error()`
7. ✅ Added: Candidate ownership verification

### What was NOT changed:
- ❌ NO database schema modifications
- ❌ NO migrations run
- ❌ NO new columns created

### Result:
✅ All code now matches existing database schema exactly!

**Next step: Restart backend with `.\restart-backend.ps1`**
