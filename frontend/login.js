// Kiểm tra nếu đã có token -> chuyển sang trang tương ứng với role
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        const sessionUser = JSON.parse(localStorage.getItem('session_user') || '{}');
        const role = sessionUser.role;
        
        // Redirect based on role
        if (role === 'ADMIN') {
            window.location.href = 'admin-dashboard.html';
        } else if (role === 'RECRUITER') {
            window.location.href = 'recruiter.html';
        } else if (role === 'CANDIDATE') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'recruiter.html'; // Default fallback
        }
    }
});

// Xử lý form đăng nhập
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Login response:', data); // Debug log
            
            // 🔥 XÓA HẾT TOKEN CŨ TRƯỚC KHI LƯU TOKEN MỚI
            localStorage.clear(); // Xóa tất cả để tránh conflict
            sessionStorage.clear(); // Xóa cả session storage
            
            // Clear all cookies
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // Lưu token vào localStorage
            const token = data.token || data.data?.token;
            const user = data.user || data.data?.user;
            
            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('login_timestamp', Date.now().toString()); // Timestamp để bust cache
                
                // Lưu session_user để candidate-list.html có thể kiểm tra
                if (user) {
                    const sessionUser = {
                        user_id: user.userId || user.user_id,
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                        role: user.role,
                        company_id: user.company_id || user.companyId
                    };
                    localStorage.setItem('session_user', JSON.stringify(sessionUser));
                    console.log('✅ Session saved:', sessionUser);
                    
                    // Redirect based on role
                    const timestamp = Date.now();
                    if (sessionUser.role === 'ADMIN') {
                        window.location.href = 'admin-dashboard.html?t=' + timestamp;
                    } else if (sessionUser.role === 'RECRUITER') {
                        window.location.href = 'recruiter.html?t=' + timestamp;
                    } else if (sessionUser.role === 'CANDIDATE') {
                        window.location.href = 'index.html?t=' + timestamp;
                    } else {
                        window.location.href = 'recruiter.html?t=' + timestamp; // Default fallback
                    }
                } else {
                    // No user data, fallback to recruiter
                    window.location.href = 'recruiter.html?t=' + Date.now();
                }
            } else {
                alert('Sai thông tin đăng nhập!');
            }
        } else if (response.status === 401) {
            alert('Sai thông tin đăng nhập!');
        } else {
            alert('Sai thông tin đăng nhập!');
        }
    } catch (err) {
        alert('Lỗi khi đăng nhập: ' + err.message);
    }
});
