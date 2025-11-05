const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// Load test info
async function loadTest() {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('id');
    if (!testId) return;
    try {
        const res = await fetch(`${API_BASE_URL}/tests/${testId}`, {
            headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error('Không tải được thông tin đề thi');
        const data = await res.json();
        const test = data.data || data;
        document.getElementById('testId').value = test.test_id;
        document.getElementById('testName').value = test.test_name || '';
        document.getElementById('testDescription').value = test.description || '';
        document.getElementById('testType').value = test.type || '';
    } catch (err) {
        alert(err.message);
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
    try {
        const res = await fetch(`${API_BASE_URL}/tests/${testId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            alert('Cập nhật thành công!');
            window.location.href = 'test-list.html';
        } else {
            alert('Cập nhật thất bại!');
        }
    } catch (err) {
        alert('Có lỗi xảy ra!');
    }
});
