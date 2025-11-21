# CS.60 RECRUITMENT SYSTEM - QUICK START

## ✅ ALL FIXES COMPLETED

### 📦 Fixed Components:
1. ✅ Backend Controller - Added CandidateTest import for deleteTest
2. ✅ Test Model - Added fields: difficulty_level, status, max_attempts, is_randomized, show_results
3. ✅ Database Schema - Updated tests table with new columns
4. ✅ MUI Grid v6 - Migrated all deprecated props to new `size` syntax
5. ✅ QuestionOptions Alias - Added to Question-QuestionOption association
6. ✅ Transaction Support - Added proper transaction handling in deleteTest

### 🗄️ Database Schema Updates:
```sql
ALTER TABLE tests ADD COLUMN difficulty_level ENUM('EASY','MEDIUM','HARD','EXPERT') DEFAULT 'MEDIUM';
ALTER TABLE tests ADD COLUMN status ENUM('DRAFT','ACTIVE','ARCHIVED') DEFAULT 'DRAFT';
ALTER TABLE tests ADD COLUMN max_attempts INT DEFAULT 1;
ALTER TABLE tests ADD COLUMN is_randomized TINYINT(1) DEFAULT 0;
ALTER TABLE tests ADD COLUMN show_results TINYINT(1) DEFAULT 1;
```

## 🚀 START THE SYSTEM

### 1. Start Backend (Port 5000)
```powershell
cd backend
npm run dev
```

### 2. Start Frontend (Port 5173 or 5174)
```powershell
cd frontend
npm run dev
```

### 3. Access Application
- Frontend: http://localhost:5173 (or 5174)
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

## 👤 TEST ACCOUNTS

### Candidate Account
- Username: `candidate_test`
- Password: `Test123456`

### Recruiter Account  
- Username: `recruiter_test`
- Password: `Test123456`

## 📝 FEATURES WORKING

### For Recruiters:
- ✅ View all tests
- ✅ Create new test with questions
- ✅ Edit test details
- ✅ Delete test (with validation)
- ✅ View test details with questions
- ✅ Filter tests by difficulty and status

### For Candidates:
- ✅ Register account
- ✅ Login
- ✅ View profile

## 🔍 TROUBLESHOOTING

### Backend not connecting?
```powershell
# Check if port 5000 is free
netstat -ano | findstr :5000

# If occupied, kill the process
taskkill /PID <process_id> /F

# Restart backend
cd backend
npm run dev
```

### Frontend connection refused?
1. Make sure backend is running first
2. Check backend is on port 5000
3. Check frontend API baseURL in `src/services/api.js`

### Database connection error?
```powershell
# Check MySQL container
docker ps | findstr cs60_mysql

# If not running
cd database
docker-compose up -d
```

## 📂 PROJECT STRUCTURE

```
CS.60/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # Business logic
│   │   ├── models/       # Sequelize models  
│   │   ├── routes/       # API routes
│   │   └── middlewares/  # Auth & validation
│   └── logs/         # Application logs
│
├── frontend/         # React + Vite
│   └── src/
│       ├── components/   # Reusable components
│       ├── pages/        # Page components
│       ├── services/     # API service
│       └── context/      # Auth context
│
└── database/         # MySQL Docker setup
    ├── docker-compose.yml
    └── init/         # DB initialization scripts
```

## ✨ RECENT CHANGES

### Backend
- `test.controller.js`: Added CandidateTest import, fixed deleteTest transaction
- `test.model.js`: Added 5 new fields for test configuration
- `models/index.js`: Added QuestionOptions alias for includes

### Frontend
- `EditTest.jsx`: Migrated Grid props to MUI v6
- `TestDetail.jsx`: Migrated Grid props, fixed API response parsing
- `Dashboard.jsx`: Migrated Grid props

### Database
- `tests` table: Added columns for difficulty_level, status, max_attempts, is_randomized, show_results

## 🎯 NEXT STEPS

1. Test full workflow: Register → Login → Create Test → View Test → Edit Test → Delete Test
2. Add more question types if needed
3. Implement candidate test-taking functionality
4. Add interview scheduling features

---

**System Status: ✅ READY TO USE**

Last Updated: October 19, 2025
