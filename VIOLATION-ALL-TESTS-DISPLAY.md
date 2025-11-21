# ✅ VIOLATION REPORTING - ALL TESTS DISPLAY

## 📋 Thay Đổi Đã Thực Hiện

### 1. **Backend API Modification**
File: `backend/src/controllers/report.controller.js`

#### Thay đổi chức năng `getViolations`:
- **Trước**: Chỉ hiển thị các bài test CÓ vi phạm (query từ `test_fraud_logs`)
- **Sau**: Hiển thị TẤT CẢ bài test đã hoàn thành (query từ `candidate_tests` với LEFT JOIN)

```javascript
// OLD APPROACH (chỉ vi phạm):
const fraudLogs = await TestFraudLog.findAll({ ... });

// NEW APPROACH (tất cả tests):
const candidateTests = await CandidateTest.findAll({
  where: { status: 'COMPLETED' },
  include: [
    { model: Test },
    { model: Candidate },
    { model: CandidateTestResult },
    { model: TestFraudLog, required: false } // LEFT JOIN!
  ]
});
```

#### Response Format:
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "candidate_test_id": 26,
      "candidate_name": "User -",
      "test_name": "FPT Shop",
      "violation_type": "NONE",              // ← "NONE" cho test sạch
      "violation_count": 0,
      "has_violations": false,               // ← Flag rõ ràng
      "violation_summary": "✓ Clean test - no violations"
    },
    {
      "candidate_test_id": 1,
      "violation_type": "TAB_SWITCH",        // ← Loại vi phạm cụ thể
      "violation_count": 1,
      "has_violations": true,
      "violation_summary": "1 violation(s) detected"
    }
  ]
}
```

---

## 🧪 Kết Quả Test

### API Response:
```
Total Tests: 25
├── Tests WITH violations: 5
│   ├── candidate_test_id 1: TAB_SWITCH (3 times)
│   ├── candidate_test_id 3: COPY_PASTE (1 time)
│   ├── candidate_test_id 5: TAB_SWITCH (2 times)
│   ├── candidate_test_id 7: SCREENSHOT (1 time)
│   └── candidate_test_id 9: MULTIPLE_WINDOWS (1 time)
│
└── Tests WITHOUT violations: 20
    ├── candidate_test_id 4, 6, 8, 10-26
    └── All showing violation_type: "NONE"
```

### Test Script:
```powershell
# Test file: test-api-direct.ps1
.\test-api-direct.ps1

# Output:
Status Code: 200
Total Tests: 25
Tests WITH violations: 5
Tests WITHOUT violations: 20
```

---

## 📊 Database Schema

### Tables Used:
1. **candidate_tests** (base table)
   - Contains all test attempts
   - Filter: `status = 'COMPLETED'`

2. **test_fraud_logs** (joined table)
   - Contains violation records
   - LEFT JOIN ensures tests without violations still appear

3. **candidates** (user info)
   - Provides candidate name and email

4. **tests** (test info)
   - Provides test name

5. **candidate_test_results** (scoring)
   - Provides score and pass/fail status

### Query Logic:
```sql
SELECT 
  ct.*,
  c.first_name, c.last_name, c.email,
  t.test_name,
  tfl.event_type, tfl.event_count,
  ctr.total_score, ctr.percentage, ctr.passed
FROM candidate_tests ct
LEFT JOIN test_fraud_logs tfl ON ct.candidate_test_id = tfl.candidate_test_id
LEFT JOIN candidates c ON ct.candidate_id = c.candidate_id
LEFT JOIN tests t ON ct.test_id = t.test_id
LEFT JOIN candidate_test_results ctr ON ct.candidate_test_id = ctr.candidate_test_id
WHERE ct.status = 'COMPLETED'
ORDER BY ct.end_time DESC;
```

---

## 🎯 Features

### 1. **Complete Test List**
- ✅ Shows ALL completed tests
- ✅ Includes tests with NO violations
- ✅ Includes tests WITH violations

### 2. **Clear Indicators**
- `violation_type`: "NONE" | "TAB_SWITCH" | "COPY_PASTE" | etc.
- `has_violations`: boolean flag
- `violation_count`: number of violations
- `violation_summary`: human-readable description

### 3. **Frontend Ready**
- Can filter by violation status
- Can search by candidate name
- Can sort by violation count
- Can display icons: ✅ (clean) vs ⚠️ (violation)

---

## 🔐 Security

### Access Control:
- **ADMIN**: Full access to all reports ✅
- **RECRUITER**: Full access to all reports ✅
- **CANDIDATE**: Blocked (403 Forbidden) ❌

### Permission Required:
```javascript
router.get('/violations', 
  authenticate, 
  authorize(['REPORTING']),  // ← Only ADMIN & RECRUITER have this
  reportController.getViolations
);
```

---

## 📝 API Endpoints

### GET /api/reports/violations
**Description**: Get all completed candidate tests with violation info

**Headers**:
```
Authorization: Bearer <token>
```

**Query Parameters** (optional):
- `violationType`: Filter by specific violation type
- `candidateTestId`: Filter by specific test attempt
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response**:
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": 1,
      "log_id": 1,
      "candidate_test_id": 1,
      "candidate_name": "User -",
      "candidate_email": "havy@test.com",
      "test_name": "FPT Shop",
      "violation_type": "TAB_SWITCH",
      "event_count": 3,
      "has_violations": true,
      "violation_count": 1,
      "violation_summary": "1 violation(s) detected",
      "score": 20,
      "percentage": "20.00",
      "status": "fail"
    }
  ]
}
```

---

## 🎨 Frontend Implementation Suggestions

### Display Table:
```html
<table>
  <thead>
    <tr>
      <th>Status</th>
      <th>Candidate</th>
      <th>Test</th>
      <th>Violation Type</th>
      <th>Count</th>
      <th>Score</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr ng-repeat="test in violations">
      <td>
        <span ng-if="test.has_violations" class="text-red-500">⚠️</span>
        <span ng-if="!test.has_violations" class="text-green-500">✅</span>
      </td>
      <td>{{ test.candidate_name }}</td>
      <td>{{ test.test_name }}</td>
      <td>
        <span ng-if="test.violation_type == 'NONE'" class="text-gray-400">
          No violations
        </span>
        <span ng-if="test.violation_type != 'NONE'" class="text-red-600">
          {{ test.violation_type }}
        </span>
      </td>
      <td>{{ test.violation_count }}</td>
      <td>{{ test.score }}</td>
      <td>
        <button ng-click="viewDetails(test.candidate_test_id)">
          View Details
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

### Filtering:
```javascript
// Show only violations
$scope.showViolationsOnly = function() {
  $scope.filteredViolations = $scope.violations.filter(
    v => v.has_violations === true
  );
};

// Show all tests
$scope.showAllTests = function() {
  $scope.filteredViolations = $scope.violations;
};

// Count summary
$scope.summary = {
  total: $scope.violations.length,
  withViolations: $scope.violations.filter(v => v.has_violations).length,
  clean: $scope.violations.filter(v => !v.has_violations).length
};
```

---

## ✅ Testing

### Test Scripts Created:
1. `test-all-violations.ps1` - Full API test with login
2. `test-violations-quick.ps1` - Quick test with saved token
3. `test-api-direct.ps1` - Direct API test with detailed output

### How to Test:
```powershell
# Quick test
cd "d:\CAPSTON C1SE.60\CS.60"
.\test-api-direct.ps1

# Expected output:
# Status Code: 200
# Total Tests: 25
# Tests WITH violations: 5
# Tests WITHOUT violations: 20
```

---

## 📚 Related Files

### Modified:
- `backend/src/controllers/report.controller.js` - Main logic change

### Test Scripts:
- `test-all-violations.ps1`
- `test-violations-quick.ps1`
- `test-api-direct.ps1`

### Documentation:
- `VIOLATION-REPORTING-DATABASE-INTEGRATION.md`
- `VIOLATION-REPORTING-CHECKLIST.md`
- `TOM-TAT-THAY-DOI-VIET.md`

---

## 🎉 Completed!

**Status**: ✅ WORKING

All candidate tests (with and without violations) are now displayed in the violations report. The API correctly returns 25 completed tests, with 5 showing violations and 20 showing clean status.

**Next Steps**:
1. Update frontend to display the new data format
2. Add filtering UI (show all / show violations only)
3. Add icons for visual distinction (✅ vs ⚠️)
4. Consider adding export functionality for reports
