# CS60 Recruitment System - Frontend

Frontend HTML/CSS/JavaScript thuần cho hệ thống tuyển dụng CS60.

## Tính năng

- 🔐 Đăng nhập/Đăng ký với backend API
- 📹 Hỗ trợ đăng nhập bằng khuôn mặt (Face Recognition)
- 📝 Giao diện làm bài thi trực tuyến
- 🎯 Giám sát thi cử với camera
- 📊 Xem kết quả thi

## Cấu trúc

```
frontend/
├── index.html        # Trang đăng nhập
├── register.html     # Trang đăng ký
├── exam.html         # Trang chọn bài thi
├── test.html         # Trang làm bài thi
├── style.css         # CSS chung
├── config.js         # Cấu hình API endpoint
├── server.js         # HTTP server đơn giản
└── package.json      # Node.js package config
```

## Chạy frontend

### Cách 1: Dùng Node.js HTTP Server (khuyên dùng)

```bash
cd frontend
npm start
```

Frontend sẽ chạy tại: http://localhost:3000

### Cách 2: Dùng Live Server (VS Code Extension)

1. Cài đặt extension "Live Server" trong VS Code
2. Right-click vào `index.html` → "Open with Live Server"

### Cách 3: Dùng Python HTTP Server

```bash
cd frontend
python -m http.server 3000
```

## Kết nối với Backend

Frontend được cấu hình kết nối với backend tại `http://localhost:5000/api`

Bạn có thể thay đổi cấu hình trong file `config.js`:

```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  // ...
};
```

## Tài khoản test

Sử dụng các tài khoản sau để test:

**Candidate:**
- Username: `candidate_test`
- Password: `Test123456`

**Recruiter:**
- Username: `recruiter_test`
- Password: `Test123456`

## Lưu ý

- Frontend cần backend đang chạy để hoạt động đầy đủ
- Camera cần được cấp quyền để sử dụng tính năng nhận diện khuôn mặt
- Token xác thực được lưu trong localStorage
