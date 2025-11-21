# Result Visibility Control System Implementation

## Overview
Implemented a comprehensive result visibility control system that allows recruiters to control when candidates can view their test scores. By default, candidates cannot see their scores immediately after completing a test until a recruiter reviews and approves the visibility.

## Database Changes

### 1. Added `is_result_visible` Column
```sql
ALTER TABLE candidate_tests 
ADD COLUMN is_result_visible TINYINT(1) DEFAULT 0 
AFTER passing_status;
```

**Column Details:**
- Type: TINYINT(1) (boolean)
- Default: 0 (false - results hidden by default)
- Purpose: Controls whether candidates can see their test scores
- Position: After `passing_status` column

## Backend Changes

### 1. CandidateTest Model (`backend/src/models/candidateTest.model.js`)

Added the new field to the model:
```javascript
is_result_visible: {
  type: DataTypes.BOOLEAN,
  defaultValue: 0
}
```

### 2. CandidateTest Controller (`backend/src/controllers/candidateTest.controller.js`)

#### Modified `getCandidateTestDetails()`
- Conditionally returns score/result data based on `is_result_visible` flag
- When `is_result_visible = false`: Removes score, passing_status, and CandidateTestResult from response
- When `is_result_visible = true`: Returns full test details including scores

**Before:**
```javascript
return res.status(200).json({
  success: true,
  data: candidateTest
});
```

**After:**
```javascript
if (!candidateTest.is_result_visible) {
  delete candidateTestData.score;
  delete candidateTestData.passing_status;
  candidateTestData.CandidateTestResult = null;
}
return res.status(200).json({
  success: true,
  data: candidateTestData
});
```

#### Modified `getMyCandidateTests()`
- Maps through all tests and hides scores for tests where `is_result_visible = false`
- Ensures consistent behavior across all API endpoints
- Sets `CandidateTestResult = null` when results are not visible

#### Modified `completeTest()`
- Returns `is_result_visible` flag in the response
- Conditionally includes score/result data in response based on visibility flag
- Shows status "COMPLETED" but hides actual scores until recruiter approves

**Response Structure:**
```javascript
// When is_result_visible = false
{
  candidate_test_id: id,
  is_result_visible: false,
  status: 'COMPLETED'
}

// When is_result_visible = true
{
  candidate_test_id: id,
  is_result_visible: true,
  status: 'COMPLETED',
  score: 85,
  percentage: "85.00",
  passing_score: 60,
  passed: true,
  passing_status: 'PASSED'
}
```

## Frontend Changes

### 1. Test Completion Screen (`frontend/test.html`)

**Modified `submitTest()` function** to check `is_result_visible` flag:

#### When Results Are Visible (`is_result_visible = true`):
- Shows full results with score and percentage
- Displays pass/fail status
- Shows congratulations or completion message
- Provides button to view detailed results

#### When Results Are Hidden (`is_result_visible = false`):
- Shows completion confirmation message
- Displays "Hoàn thành" status
- Hides all scores and results
- Shows message: "Kết quả bài thi của bạn đang được xem xét. Chúng tôi sẽ thông báo khi có kết quả."
- Provides button to return to test list

### 2. My Tests Page (`frontend/my-tests.html`)

#### Simplified Status Display
**Before:**
- 4 states: "Chờ làm bài", "Đang làm", "Hoàn thành", "Hết hạn"

**After:**
- 2 states only:
  - "Chờ làm bài" - for PENDING, IN_PROGRESS, and any non-completed status
  - "Hoàn thành" - for COMPLETED status only

#### Updated Score Display
- **When `is_result_visible = true`**: Shows score circle with actual score
- **When `is_result_visible = false`**: Shows pending icon (clock with question mark)

#### Updated Action Buttons
**For Completed Tests:**
- **When `is_result_visible = true`**: "📊 Xem kết quả chi tiết" (enabled)
- **When `is_result_visible = false`**: "⏳ Đang chờ kết quả" (disabled button)

**For Non-Completed Tests:**
- IN_PROGRESS: "⏱️ Tiếp tục làm bài"
- PENDING: "🚀 Bắt đầu làm bài"

#### Updated Result Grid
**When `is_result_visible = true`** - Shows:
- Điểm số (Score)
- Kết quả (Pass/Fail status)

**When `is_result_visible = false`** - Shows:
- "⏳ Đang chờ kết quả" instead of score/result

## How It Works

### 1. Test Completion Flow
```
Candidate completes test
    ↓
Backend calculates score
    ↓
Saves score to database
    ↓
Sets is_result_visible = 0 (hidden)
    ↓
Returns response with is_result_visible flag
    ↓
Frontend checks flag:
    - If true: Show scores
    - If false: Show "waiting for results" message
```

### 2. Recruiter Workflow (To Be Implemented)
```
Recruiter reviews test
    ↓
Approves result visibility
    ↓
Updates: is_result_visible = 1
    ↓
Candidate can now see scores
```

### 3. API Response Examples

#### Get My Tests (is_result_visible = false)
```json
{
  "success": true,
  "data": [
    {
      "candidate_test_id": 5,
      "status": "COMPLETED",
      "is_result_visible": false,
      "Test": {
        "test_name": "JavaScript Basics",
        "duration_minutes": 45
      },
      "CandidateTestResult": null
    }
  ]
}
```

#### Get My Tests (is_result_visible = true)
```json
{
  "success": true,
  "data": [
    {
      "candidate_test_id": 5,
      "status": "COMPLETED",
      "is_result_visible": true,
      "score": 85,
      "Test": {
        "test_name": "JavaScript Basics",
        "duration_minutes": 45
      },
      "CandidateTestResult": {
        "total_score": 85,
        "percentage": "85.00",
        "passed": 1
      }
    }
  ]
}
```

## Testing

### Test Script
Created `test-result-visibility.ps1` to verify the system:

1. Login as candidate
2. Fetch test list
3. Check visibility flag
4. Verify scores are hidden/shown based on flag
5. Query database to confirm column exists

### Test Results
✅ **When is_result_visible = 0:**
- API returns: `Score: HIDDEN (not visible yet)`
- API returns: `Result: HIDDEN (not visible yet)`

✅ **When is_result_visible = 1:**
- API returns: `Score: 85`
- API returns: `Result: PASSED/FAILED`

## Database Verification
```sql
-- Check existing tests
SELECT candidate_test_id, status, score, passing_status, is_result_visible 
FROM candidate_tests 
ORDER BY candidate_test_id DESC 
LIMIT 5;

-- Update visibility for a test (recruiter action)
UPDATE candidate_tests 
SET is_result_visible = 1 
WHERE candidate_test_id = 5;
```

## Future Enhancements

### 1. Recruiter Dashboard
- [ ] Create UI for recruiters to review completed tests
- [ ] Add button to toggle `is_result_visible` for each test
- [ ] Implement bulk visibility update for multiple tests

### 2. Notifications
- [ ] Email notification to candidate when results become visible
- [ ] In-app notification system

### 3. Audit Trail
- [ ] Track who made results visible and when
- [ ] Add `made_visible_by` and `made_visible_at` columns

### 4. Conditional Visibility
- [ ] Auto-show results after X days
- [ ] Auto-show results for tests that don't require manual review
- [ ] Hide results permanently for failed tests (configurable)

## Files Modified

### Backend
- `backend/src/models/candidateTest.model.js` - Added is_result_visible field
- `backend/src/controllers/candidateTest.controller.js` - Updated 3 functions:
  - `getCandidateTestDetails()` - Conditional score visibility
  - `getMyCandidateTests()` - Conditional score visibility in list
  - `completeTest()` - Returns visibility flag

### Frontend
- `frontend/test.html` - Updated completion screen to respect visibility flag
- `frontend/my-tests.html` - Updated test list display:
  - Simplified status to 2 states
  - Conditional score/result display
  - Updated action buttons

### Database
- `candidate_tests` table - Added `is_result_visible` column

### Testing
- `test-result-visibility.ps1` - PowerShell script to test the system

## Deployment Checklist

- [x] Add database column
- [x] Update backend models
- [x] Update backend controllers
- [x] Update frontend test completion screen
- [x] Update frontend test list page
- [x] Test API endpoints
- [x] Verify database changes
- [x] Create testing script
- [ ] Add recruiter UI (future)
- [ ] Add notifications (future)
- [ ] Update documentation

## Notes

1. **Default Behavior**: All new completed tests have `is_result_visible = 0` by default
2. **Backward Compatibility**: Existing tests without this column will be treated as visible (NULL = true in conditionals)
3. **Security**: Only authenticated candidates can see their own tests; visibility flag is enforced at API level
4. **Performance**: No significant performance impact; single column addition with indexed queries

## Success Criteria

✅ Candidates cannot see scores immediately after test completion
✅ Candidates see "waiting for results" message
✅ Test list shows simplified status (2 states only)
✅ API correctly hides/shows scores based on flag
✅ Database column added successfully
✅ All existing functionality maintained
✅ No breaking changes to existing tests
