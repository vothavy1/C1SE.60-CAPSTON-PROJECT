import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Logout,
  Person,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Box
        sx={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          py: 2,
          px: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" component="h1" color="primary">
            CS60 Recruitment System
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <Person />
            </Avatar>
            <Typography variant="body1">
              Xin chào, {user?.fullName || user?.username}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Logout />}
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Chào mừng đến với hệ thống tuyển dụng CS60
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  Bạn đã đăng nhập thành công với vai trò: <strong>{user?.role}</strong>
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* User Info Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Thông tin tài khoản
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tên đăng nhập:</strong> {user?.username}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Họ tên:</strong> {user?.fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Vai trò:</strong> {user?.role}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Chức năng chính
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Các tính năng chính của hệ thống sẽ được hiển thị ở đây.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button variant="outlined" disabled>
                    Quản lý bài test
                  </Button>
                  <Button variant="outlined" disabled>
                    Quản lý ứng viên
                  </Button>
                  <Button variant="outlined" disabled>
                    Quản lý vị trí
                  </Button>
                  <Button variant="outlined" disabled>
                    Báo cáo thống kê
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;