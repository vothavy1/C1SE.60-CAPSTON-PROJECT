const API_BASE_URL = 'http://localhost:5000/api';

function getAuthHeaders() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

document.addEventListener('DOMContentLoaded', loadTestData);
document.getElementById('editTestForm').addEventListener('submit', handleEditSubmit);

function getTestIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

async function loadTestData() {
    const testId = getTestIdFromUrl();
    if (!testId) {
        alert('Không tìm thấy ID đề thi!');
        window.location.href = 'test-list.html';
        return;
    }
    document.getElementById('testId').value = testId;
    try {
        const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Không lấy được dữ liệu đề thi!');
        const test = await response.json();
        document.getElementById('testName').value = test.name || '';
        document.getElementById('testDescription').value = test.description || '';
        document.getElementById('testType').value = test.type || '';
    } catch (error) {
        alert(error.message);
        window.location.href = 'test-list.html';
    }
}

async function handleEditSubmit(e) {
    e.preventDefault();
    const testId = document.getElementById('testId').value;
    const testName = document.getElementById('testName').value.trim();
    const testDescription = document.getElementById('testDescription').value.trim();
    const testType = document.getElementById('testType').value;

    if (!testName) {
        alert('Tên đề thi không được để trống!');
        return;
    }
    if (!testType) {
        alert('Vui lòng chọn loại đề!');
        return;
    }

    const testData = {
        name: testName,
        description: testDescription,
        type: testType
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tests/${testId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(testData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Cập nhật đề thi thất bại!');
        }
        alert('Cập nhật đề thi thành công!');
        window.location.href = 'test-list.html';
    } catch (error) {
        alert(error.message || 'Có lỗi xảy ra khi cập nhật đề thi!');
    }
}
