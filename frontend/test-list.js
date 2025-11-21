const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

async function fetchTests() {
    try {
        const response = await fetch(`${API_BASE_URL}/tests`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Lỗi khi lấy danh sách đề thi');
        const result = await response.json();
        // Backend trả về { success: true, data: { tests: [...] } }
        const tests = result.data && result.data.tests ? result.data.tests : [];
        renderTests(tests);
    } catch (error) {
        console.error(error);
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
