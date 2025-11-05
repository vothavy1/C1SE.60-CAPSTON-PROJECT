# Reports Directory

This directory stores JSON files for the report system:

- `violations.json` - Records of test violations (tab switches, camera issues)
- `activity_logs.json` - Candidate activity logs during tests
- `notifications.json` - Notifications sent to candidates

## File Structure

### violations.json
```json
[
  {
    "id": "uuid",
    "candidateTestId": 123,
    "testId": 456,
    "candidateId": 789,
    "violationType": "tab_switch",
    "description": "Candidate switched tabs",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {}
  }
]
```

### activity_logs.json
```json
[
  {
    "id": "uuid",
    "candidateTestId": 123,
    "candidateId": 789,
    "activityType": "test_start",
    "description": "Test started",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "metadata": {}
  }
]
```

### notifications.json
```json
[
  {
    "id": "uuid",
    "candidateId": 789,
    "testId": 456,
    "type": "violation_warning",
    "message": "You have exceeded the maximum violations",
    "read": false,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
]
```
