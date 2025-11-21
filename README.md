# Hệ Thống Tuyển Dụng CS60

Hệ thống tuyển dụng CS60 là một ứng dụng web toàn diện được thiết kế để quản lý quy trình tuyển dụng, bao gồm quản lý ứng viên, tạo bài kiểm tra, phỏng vấn và theo dõi tiến trình tuyển dụng.

## 🚀 Quick Start (Cách chạy nhanh nhất)

```powershell
# Chạy tất cả (Backend + Frontend) trong 1 lệnh
.\start-all.ps1
```

Hệ thống sẽ tự động mở tại: http://localhost:3000

📖 **Xem hướng dẫn chi tiết:** [QUICK-START.md](./QUICK-START.md)

## 🔑 Tài khoản Test

| Role | Username/Email | Password |
|------|----------------|----------|
| Candidate | `havy@test.com` | `123456` |
| Recruiter | `recruiter_test` | `Test123456` |

## Cấu Trúc Dự Án

```
.
├── backend/             # Server Node.js với Express và Sequelize (Port 5000)
├── database/            # MySQL Docker container (Port 3306)
├── frontend/            # HTML/CSS/JS với Face Recognition (Port 3000)
├── start-all.ps1        # ⭐ Script khởi động tự động
├── check-system.ps1     # Script kiểm tra hệ thống
└── QUICK-START.md       # Hướng dẫn chi tiết
```

## Chức Năng Chính

- **Quản lý người dùng**: Đăng nhập, phân quyền
- **Quản lý câu hỏi**: Tạo và quản lý ngân hàng câu hỏi
- **Quản lý bài kiểm tra**: Tạo và quản lý các bài kiểm tra
- **Quản lý ứng viên**: Lưu trữ thông tin ứng viên và tài liệu
- **Quản lý phỏng vấn**: Lên lịch và quản lý phỏng vấn
- **Làm bài kiểm tra**: Môi trường cho ứng viên làm bài kiểm tra
- **Báo cáo và phân tích**: Thống kê và báo cáo về quá trình tuyển dụng

## Backend

Backend được xây dựng bằng Node.js, Express và Sequelize với MySQL.

### Khởi động nhanh

```powershell
# Cách 1: Dùng script tự động (khuyên dùng)
.\start-all.ps1

# Cách 2: Chạy riêng backend
cd backend
npm start
```

Backend chạy tại: **http://localhost:5000**

### Cài đặt lần đầu

1. **Khởi động MySQL Database:**
```bash
cd database
docker-compose up -d
```

2. **Cài đặt dependencies:**
```bash
cd backend
npm install
```

3. **Tạo file .env** (nếu chưa có):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cs60_recruitment
DB_USER=cs60user
DB_PASSWORD=cs60password
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

4. **Chạy backend:**
```bash
npm start
```

### API Endpoints

- `/api/auth`: Xác thực và quản lý người dùng
- `/api/users`: Quản lý người dùng và vai trò
- `/api/questions`: Quản lý ngân hàng câu hỏi
- `/api/tests`: Quản lý bài kiểm tra
- `/api/candidates`: Quản lý ứng viên
- `/api/jobs`: Quản lý vị trí tuyển dụng
- `/api/interviews`: Quản lý phỏng vấn
- `/api/candidate-tests`: Quản lý bài làm của ứng viên
- `/api/reports`: Báo cáo và thống kê

## Database

Hệ thống sử dụng MySQL trong Docker container với các bảng chính:

- Users, Roles, Permissions
- Questions, Tests, TestQuestions
- Candidates, JobPositions, JobApplications
- Interviews, InterviewParticipants, InterviewFeedback
- CandidateTests, CandidateAnswers

### Truy cập Database

- **phpMyAdmin**: http://localhost:8080
  - Server: `mysql`
  - Username: `root`
  - Password: `rootpassword`

- **MySQL Direct Connection**:
  - Host: `localhost:3306`
  - Database: `cs60_recruitment`
  - User: `cs60user`
  - Password: `cs60password`

## 🛠️ Scripts Hữu Ích

```powershell
# Khởi động toàn bộ hệ thống
.\start-all.ps1

# Kiểm tra trạng thái hệ thống
.\check-system.ps1

# Chạy riêng Backend
.\start-backend.bat

# Chạy riêng Frontend
.\start-frontend.bat
```

## 📚 Tài Liệu

- [QUICK-START.md](./QUICK-START.md) - Hướng dẫn chạy nhanh
- [FRONTEND-UPDATE.md](./FRONTEND-UPDATE.md) - Chi tiết về frontend mới
- [SYSTEM-STATUS.md](./SYSTEM-STATUS.md) - Tình trạng hệ thống
- [backend/README.md](./backend/README.md) - Backend documentation
- [frontend/README.md](./frontend/README.md) - Frontend documentation

## 🐛 Troubleshooting

### Port đã bị sử dụng
```powershell
# Kill process trên port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Kill process trên port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }
```

### Backend không kết nối được database
```powershell
# Restart MySQL container
cd database
docker-compose restart
```

### Xem logs chi tiết
```powershell
# Backend logs
cd backend
node src/server.js

# MySQL logs
docker logs cs60_mysql
```

## Phát Triển

Dự án được phát triển bởi nhóm CS60.

### Tech Stack
- **Backend**: Node.js, Express, Sequelize, MySQL
- **Frontend**: HTML, CSS, JavaScript, Face Recognition API
- **Database**: MySQL 8.0 (Docker)
- **Authentication**: JWT
- **API Documentation**: REST API

### Contributors
- Backend & Database: Team CS60
- Frontend: Integrated from [Cap1_Version1_Demo](https://github.com/anhvuha123/Cap1_Version1_Demo)
