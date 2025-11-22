// 🔥 FORCE CLEAR CACHE ON NEW LOGIN
(function checkCacheBust() {
    const lastPageLoad = sessionStorage.getItem('test_page_loaded');
    const loginTime = localStorage.getItem('login_timestamp');
    
    if (loginTime && (!lastPageLoad || parseInt(lastPageLoad) < parseInt(loginTime))) {
        console.log('🔄 New login detected, clearing test page cache...');
        sessionStorage.setItem('test_page_loaded', Date.now().toString());
        // Force reload without cache
        if (!window.location.search.includes('nocache')) {
            window.location.href = window.location.pathname + '?nocache=' + Date.now();
            return;
        }
    }
})();

const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    
    if (!token) {
        console.warn('⚠️ No token found! Redirecting to login...');
        setTimeout(() => window.location.href = 'login.html', 1000);
    }
    
    return {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

async function fetchTests() {
    try {
        const response = await fetch(`${API_BASE_URL}/tests`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            console.error('❌ 401 Unauthorized - Token không hợp lệ hoặc hết hạn');
            alert('⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            localStorage.clear();
            window.location.href = 'login.html';
            return;
        }
        
        if (response.status === 403) {
            console.error('❌ 403 Forbidden - Không có quyền truy cập');
            alert('⚠️ Bạn không có quyền xem danh sách đề thi!');
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Lỗi khi lấy danh sách đề thi');
        }
        
        const result = await response.json();
        console.log('✅ Tests loaded:', result);
        
        // Backend trả về { success: true, data: { tests: [...] } }
        const tests = result.data && result.data.tests ? result.data.tests : [];
        renderTests(tests);
    } catch (error) {
        console.error('❌ Error fetching tests:', error);
        document.querySelector('#testsTable tbody').innerHTML = `<tr><td colspan="6" class="text-danger text-center">${error.message}</td></tr>`;
    }
}

function renderTests(tests) {
    const tbody = document.querySelector('#testsTable tbody');
    tbody.innerHTML = '';
    if (!Array.isArray(tests) || tests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có đề thi nào.</td></tr>';
        return;
    }
    tests.forEach((test, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${test.test_name || test.name}</td>
            <td>${test.difficulty_level || test.type}</td>
            <td>${test.status}</td>
            <td>${new Date(test.created_at || test.createdAt).toLocaleString('vi-VN')}</td>
            <td>
                <a href="edit-test.html?id=${test.test_id || test.id}" class="btn btn-sm btn-primary me-2">Sửa</a>
                <button class="btn btn-sm btn-danger" onclick="deleteTest('${test.test_id || test.id}')">Xóa</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteTest(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa đề thi này không?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/tests/${id}`, { 
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Xóa đề thi thất bại');
        alert('Xóa đề thi thành công!');
        fetchTests();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', fetchTests);
