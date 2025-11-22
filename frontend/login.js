// Kiểm tra nếu đã có token -> chuyển sang recruiter.html
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'recruiter.html';
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
            
            // Lưu token vào localStorage
            const token = data.token || data.data?.token;
            const user = data.user || data.data?.user;
            
            if (token) {
                localStorage.setItem('token', token);
                
                // Lưu session_user để candidate-list.html có thể kiểm tra
                if (user) {
                    const sessionUser = {
                        user_id: user.userId || user.user_id, // Handle both camelCase and snake_case
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName || user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                        role: user.role
                    };
                    localStorage.setItem('session_user', JSON.stringify(sessionUser));
                    console.log('Session saved:', sessionUser); // Debug log
                }
                
                // Chuyển sang recruiter.html
                window.location.href = 'recruiter.html';
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
