// 🔥 FORCE CLEAR CACHE AND VALIDATE COMPANY CONTEXT
(function checkCacheBust() {
    // Clear ALL potential cache sources
    const lastPageLoad = sessionStorage.getItem('test_page_loaded');
    const loginTime = localStorage.getItem('login_timestamp');
    
    if (loginTime && (!lastPageLoad || parseInt(lastPageLoad) < parseInt(loginTime))) {
        console.log('🔄 New login detected, clearing test page cache...');
        
        // 🧹 COMPREHENSIVE CACHE CLEARING
        sessionStorage.clear(); // Clear all session storage
        sessionStorage.setItem('test_page_loaded', Date.now().toString());
        sessionStorage.setItem('login_timestamp', loginTime); // Preserve login timestamp
        
        // Clear browser cache for this page
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        // Force reload without cache
        if (!window.location.search.includes('nocache')) {
            window.location.href = window.location.pathname + '?nocache=' + Date.now();
            return;
        }
    }
})();

const API_BASE_URL = 'http://localhost:5000/api';

// 🛡️ COMPANY CONTEXT VALIDATOR
function validateCompanyContext() {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🏢 Current user company context:', {
            userId: payload.id,
            companyId: payload.company_id,
            role: payload.role
        });
        return true;
    } catch (error) {
        console.error('❌ Invalid token format:', error);
        return false;
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('authToken');
    
    if (!token) {
        console.warn('⚠️ No token found! Redirecting to login...');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return {};
    }

    // 🛡️ VALIDATE COMPANY CONTEXT
    if (!validateCompanyContext()) {
        console.error('❌ Invalid company context! Forcing logout...');
        localStorage.clear();
        window.location.href = 'login.html';
        return {};
    }
    
    return {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Company-Context': 'recruiter-tests', // Context identifier
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

async function fetchTests() {
    try {
        console.log('🔄 Fetching tests with company filtering...');
        
        // 🛡️ CRITICAL: Use simple /tests endpoint (no limit parameter to avoid cache issues)
        const response = await fetch(`${API_BASE_URL}/tests`, {
            method: 'GET',
            headers: getAuthHeaders(),
            cache: 'no-cache' // Force fresh request
        });
        
        // 🔍 DEBUG: Log response details
        console.log('📊 Response details:', {
            status: response.status,
            size: response.headers.get('content-length'),
            url: response.url
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
            const errorData = await response.json().catch(() => ({}));
            if (errorData.error_code === 'NO_COMPANY') {
                alert('⚠️ Tài khoản chưa được gán vào công ty. Vui lòng liên hệ admin!');
            } else if (errorData.error_code === 'COMPANY_MISMATCH') {
                alert('⚠️ Phát hiện thay đổi công ty. Đang đăng xuất để cập nhật quyền...');
                localStorage.clear();
                window.location.href = 'login.html';
            } else {
                alert('⚠️ Bạn không có quyền xem danh sách đề thi!');
            }
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Lỗi khi lấy danh sách đề thi');
        }
        
        const result = await response.json();
        
        // 🔍 SECURITY: Verify response contains company-filtered data
        console.log('✅ Tests loaded:', {
            success: result.success,
            testCount: result.data?.tests?.length || 0,
            dataSize: JSON.stringify(result).length,
            firstTest: result.data?.tests?.[0]
        });
        
        // Backend trả về { success: true, data: { tests: [...] } }
        const tests = result.data && result.data.tests ? result.data.tests : [];
        
        // 🛡️ COMPANY SEGREGATION VALIDATION
        if (tests.length > 0) {
            const companyIds = [...new Set(tests.map(test => test.company_id))];
            console.log('🏢 Company IDs in response:', companyIds);
            
            if (companyIds.length > 1) {
                console.error('🚨 SECURITY ALERT: Multiple company data detected!', companyIds);
                alert('⚠️ Phát hiện lỗi bảo mật dữ liệu. Vui lòng đăng xuất và đăng nhập lại!');
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }
        }
        
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
