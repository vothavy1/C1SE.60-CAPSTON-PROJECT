# CS60 Recruitment Frontend

A modern React.js frontend for the CS60 recruitment system with authentication functionality.

## Features

- 🔐 User authentication (Login/Register)
- 🎨 Modern UI with Material-UI
- 🛡️ Protected routes
- 📱 Responsive design
- 🔄 API integration with backend

## Tech Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Material-UI** - UI component library
- **Axios** - HTTP client for API calls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Backend server running on `http://localhost:5000`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit `http://localhost:5173` (or the port shown in terminal)

## Troubleshooting

### Build Errors
If you encounter "Unexpected token" errors:
1. Ensure `AuthContext.js` is renamed to `AuthContext.jsx`
2. Check that all imports are correct
3. Restart the dev server

### API 400 Bad Request Errors ✅ FIXED
If registration/login returns 400 errors:
- **Issue**: Sequelize Op.or syntax error in backend
- **Fix**: Changed `sequelize.Op.or` to `Sequelize.Op.or` in auth controller
- **Status**: ✅ Fixed and tested working

### Port Issues
- If port 5173 is in use, Vite will automatically use the next available port
- Check the terminal output for the actual port number

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

The frontend connects to the backend API at `http://localhost:5000/api`. Make sure the backend server is running before using the frontend.

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/logout` - User logout (protected)

## Project Structure

```
src/
├── components/
│   └── Auth/
│       ├── Login.jsx
│       └── Register.jsx
├── context/
│   └── AuthContext.js
├── pages/
│   └── Dashboard.jsx
├── services/
│   └── api.js
├── App.jsx
└── main.jsx
```

## Usage

### Login
1. Navigate to `/login`
2. Enter your username and password
3. Click "Đăng nhập"

### Register
1. Navigate to `/register`
2. Fill in the registration form
3. Click "Đăng ký"

### Dashboard
- After successful login, you'll be redirected to the dashboard
- View your profile information
- Access system features (to be implemented)

## Authentication Flow

1. User enters credentials on login/register form
2. Frontend sends request to backend API
3. On success, JWT token is stored in localStorage
4. User data is stored and authentication state is updated
5. Protected routes become accessible
6. On logout, token and user data are cleared

## Contributing

1. Follow the existing code style
2. Use meaningful commit messages
3. Test your changes thoroughly
4. Update documentation as needed

## License

This project is part of the CS60 recruitment system.
