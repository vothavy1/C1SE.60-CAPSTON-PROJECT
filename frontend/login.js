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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            // Lưu token vào localStorage
            const token = data.token || data.data?.token;
            if (token) {
                localStorage.setItem('token', token);
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
