/**
 * Global Authentication Check Utility
 * Tự động kiểm tra và xử lý lỗi xác thực trên tất cả các trang
 */

// Helper function to handle authentication errors globally
function handleAuthError(response, errorData) {
  if (response.status === 401 || response.status === 403) {
    // Check for specific error codes
    if (errorData?.error_code === 'COMPANY_MISMATCH' || errorData?.force_logout) {
      // Company mismatch - force logout
      alert('🚨 PHÁT HIỆN THAY ĐỔI CÔNG TY!\n\n' + 
            (errorData.message || 'Công ty của bạn đã được thay đổi trong hệ thống.') + 
            '\n\n➡️ VUI LÒNG ĐĂNG NHẬP LẠI để cập nhật quyền truy cập!');
      forceLogout();
      return true;
    } else if (errorData?.error_code === 'OLD_TOKEN') {
      // Old token without company_id
      alert('⚠️ TOKEN CŨ KHÔNG HỢP LỆ!\n\n' +
            'Hệ thống đã được cập nhật để bảo mật dữ liệu theo công ty.\n\n' +
            'Bạn đang dùng token cũ không có company_id.\n\n' +
            '➡️ VUI LÒNG ĐĂNG XUẤT VÀ ĐĂNG NHẬP LẠI!');
      forceLogout();
      return true;
    } else if (errorData?.error_code === 'NO_COMPANY') {
      // Recruiter without company
      alert('⚠️ TÀI KHOẢN CHƯA CÓ CÔNG TY!\n\n' +
            (errorData.message || 'Tài khoản recruiter của bạn chưa được gán vào công ty nào.') + 
            '\n\n➡️ Vui lòng liên hệ admin để được hỗ trợ.');
      forceLogout();
      return true;
    } else {
      // General auth error
      alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
      window.location.href = 'login.html';
      return true;
    }
  }
  return false;
}

// Force logout and clear all session data
function forceLogout() {
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Redirect to login
  window.location.href = 'login.html?reason=session_expired';
}

// Enhanced fetch wrapper with automatic auth error handling
async function secureFetch(url, options = {}) {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = 'login.html';
      throw new Error('No token found');
    }
    
    // Add auth header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store' // Prevent caching
    });
    
    // Check for auth errors
    if (response.status === 401 || response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      handleAuthError(response, errorData);
      throw new Error(errorData.message || 'Authentication failed');
    }
    
    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { handleAuthError, forceLogout, secureFetch };
}
