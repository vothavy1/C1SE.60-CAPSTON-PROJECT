# Frontend Testing Guide

## Prerequisites
1. Backend server must be running on `http://localhost:5000`
2. Frontend dev server running on `http://localhost:5173` (or assigned port - check terminal output)

## Test Scenarios

### 1. User Registration ✅ FIXED
1. Open browser and navigate to `http://localhost:5173/register` (or assigned port)
2. Fill in the registration form:
   - Full Name: "Nguyen Van A"
   - Username: "testuser"
   - Email: "test@example.com"
   - Password: "password123"
3. Click "Đăng ký" button
4. Should see success message and redirect to login page

**Fixed Issue**: Sequelize Op.or syntax error in backend controller - changed `sequelize.Op.or` to `Sequelize.Op.or`

### 2. User Login
1. Navigate to `http://localhost:5173/login` (or assigned port)
2. Enter credentials:
   - Username: "testuser"
   - Password: "password123"
3. Click "Đăng nhập" button
4. Should redirect to dashboard

### 3. Dashboard Access
1. After login, should see dashboard with:
   - Welcome message
   - User profile information
   - Quick action buttons (placeholder)

### 4. Logout
1. Click "Đăng xuất" button in header
2. Should redirect to login page
3. Should not be able to access dashboard without login

### 5. Protected Routes
1. Try to access `http://localhost:5173/dashboard` without login
2. Should redirect to login page

## API Testing

You can also test the API endpoints directly:

### Register User ✅ WORKING
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apiuser",
    "email": "api@example.com",
    "password": "password123",
    "full_name": "API User"
  }'
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apiuser",
    "password": "password123"
  }'
```

## Troubleshooting

### Frontend not loading
- Check if all dependencies are installed: `npm install`
- Check if dev server is running: `npm run dev`
- Check console for errors

### API connection issues
- Ensure backend is running on port 5000
- Check CORS settings in backend
- Verify API endpoints match

### Authentication issues
- Clear browser localStorage
- Check JWT token expiration
- Verify backend database has user data

## Features to Test
- [x] Form validation
- [x] Error handling
- [x] Loading states
- [x] Responsive design
- [x] Route protection
- [x] Token management