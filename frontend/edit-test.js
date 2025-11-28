const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    
    if (!token) {
        console.error('❌ No token found, redirecting to login...');
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'login.html';
        return null;
    }
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Load test info
async function loadTest() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    if (!testId) {
        alert('Không tìm thấy ID đề thi');
        window.location.href = 'test-list.html';
        return;
    }
    
    try {
        const headers = getAuthHeaders();
        if (!headers) return; // Already redirected to login
        
        const res = await fetch(`${API_BASE_URL}/tests/${testId}`, {
            headers: headers
        });
        
        if (res.status === 401 || res.status === 403) {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            window.location.href = 'login.html';
            return;
        }
        
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || 'Không tải được thông tin đề thi');
        }
        
        const data = await res.json();
        const test = data.data || data;
        
        document.getElementById('testId').value = test.test_id;
        document.getElementById('testName').value = test.test_name || '';
        document.getElementById('testDescription').value = test.description || '';
        document.getElementById('testType').value = test.type || '';
    } catch (err) {
        console.error('❌ Error loading test:', err);
        alert('Lỗi: ' + err.message);
        window.location.href = 'test-list.html';
    }
}

document.addEventListener('DOMContentLoaded', loadTest);

document.getElementById('editTestForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const testId = document.getElementById('testId').value;
    const payload = {
        test_name: document.getElementById('testName').value.trim(),
        description: document.getElementById('testDescription').value.trim(),
        type: document.getElementById('testType').value
    };
    
    if (!payload.test_name || !payload.type) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    try {
        const headers = getAuthHeaders();
        if (!headers) return; // Already redirected to login
        
        const res = await fetch(`${API_BASE_URL}/tests/${testId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        });
        
        if (res.status === 401 || res.status === 403) {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            window.location.href = 'login.html';
            return;
        }
        
        if (res.ok) {
            alert('✅ Cập nhật thành công!');
            window.location.href = 'test-list.html';
        } else {
            const errorData = await res.json().catch(() => ({}));
            alert('❌ Cập nhật thất bại: ' + (errorData.message || 'Lỗi không xác định'));
        }
    } catch (err) {
        console.error('❌ Error updating test:', err);
        alert('❌ Có lỗi xảy ra: ' + err.message);
    }
});
